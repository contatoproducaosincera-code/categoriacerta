import { memo, useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, UserCheck, Trash2, Loader2, Clock, MapPin, Instagram, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Database } from '@/integrations/supabase/types';

type Category = Database['public']['Enums']['category'];
type Gender = Database['public']['Enums']['gender'];

interface WaitlistAthlete {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  gender: string;
  created_at: string;
  avatar_url: string | null;
  instagram: string | null;
}

const CATEGORIES: Category[] = ['Iniciante', 'D', 'C', 'B'];
const GENDERS: Gender[] = ['Masculino', 'Feminino'];

const Waitlist = memo(() => {
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<{ url: string; name: string } | null>(null);
  // Per-athlete category/gender selection
  const [athleteSettings, setAthleteSettings] = useState<Record<string, { category: Category; gender: Gender }>>({});
  
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();

  const getAthleteSettings = (athlete: WaitlistAthlete) => {
    const stored = athleteSettings[athlete.id];
    if (stored) return stored;
    // Use gender from waitlist as default
    return { category: 'Iniciante' as Category, gender: (athlete.gender || 'Masculino') as Gender };
  };

  const updateAthleteCategory = (athlete: WaitlistAthlete, category: Category) => {
    setAthleteSettings(prev => ({
      ...prev,
      [athlete.id]: { ...getAthleteSettings(athlete), category }
    }));
  };

  const updateAthleteGender = (athlete: WaitlistAthlete, gender: Gender) => {
    setAthleteSettings(prev => ({
      ...prev,
      [athlete.id]: { ...getAthleteSettings(athlete), gender }
    }));
  };

  const { data: waitlist, isLoading } = useQuery({
    queryKey: ['admin-waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as WaitlistAthlete[];
    },
    staleTime: 1000 * 30,
  });

  // Filter locally for instant response
  const filteredWaitlist = useMemo(() => {
    if (!waitlist) return [];
    if (!debouncedSearch) return waitlist;
    
    const searchLower = debouncedSearch.toLowerCase();
    return waitlist.filter(athlete => 
      athlete.first_name.toLowerCase().includes(searchLower) ||
      athlete.last_name.toLowerCase().includes(searchLower) ||
      athlete.city.toLowerCase().includes(searchLower) ||
      (athlete.instagram && athlete.instagram.toLowerCase().includes(searchLower))
    );
  }, [waitlist, debouncedSearch]);

  const approveMutation = useMutation({
    mutationFn: async ({ athlete, category, gender }: { athlete: WaitlistAthlete; category: Category; gender: Gender }) => {
      // Add to athletes table with avatar and instagram
      const { error: insertError } = await supabase.from('athletes').insert({
        name: `${athlete.first_name} ${athlete.last_name}`,
        city: athlete.city,
        category,
        gender,
        points: 0,
        avatar_url: athlete.avatar_url,
        instagram: athlete.instagram,
      });
      if (insertError) throw insertError;

      // Remove from waitlist
      const { error: deleteError } = await supabase.from('waitlist').delete().eq('id', athlete.id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success('Atleta aprovado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      queryClient.invalidateQueries({ queryKey: ['registration-name-check'] });
      setProcessingId(null);
    },
    onError: () => {
      toast.error('Erro ao aprovar atleta');
      setProcessingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('waitlist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição removida');
      queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] });
      setProcessingId(null);
    },
    onError: () => {
      toast.error('Erro ao remover inscrição');
      setProcessingId(null);
    },
  });

  const handleApprove = useCallback((athlete: WaitlistAthlete) => {
    const settings = getAthleteSettings(athlete);
    setProcessingId(athlete.id);
    approveMutation.mutate({ athlete, category: settings.category, gender: settings.gender });
  }, [approveMutation, athleteSettings]);

  const handleDelete = useCallback((id: string) => {
    setProcessingId(id);
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <BackButton />
        
        <Card className="mt-4 sm:mt-6 border-0 sm:border shadow-none sm:shadow-sm">
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-display flex items-center gap-2 flex-wrap">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
              <span>Lista de Espera</span>
              {waitlist && (
                <Badge variant="secondary" className="text-sm">
                  {filteredWaitlist.length}
                  {debouncedSearch && filteredWaitlist.length !== waitlist.length && (
                    <span className="opacity-60">/{waitlist.length}</span>
                  )}
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Aprove ou recuse cadastros pendentes. Defina categoria e gênero antes de aprovar.
            </p>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {/* Search Filter — full width, larger touch target */}
            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por nome, cidade ou @instagram..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 text-base"
                  inputMode="search"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredWaitlist.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  {search ? 'Nenhum resultado encontrado' : 'Lista de espera vazia'}
                </p>
              </div>
            ) : (
              <>
                {/* MOBILE: Card layout (visible <lg) */}
                <div className="lg:hidden space-y-3">
                  {filteredWaitlist.map((athlete) => {
                    const settings = getAthleteSettings(athlete);
                    const isProcessing = processingId === athlete.id;
                    return (
                      <div
                        key={athlete.id}
                        className="rounded-xl border bg-card p-4 shadow-sm space-y-3"
                      >
                        {/* Header: avatar + name + date */}
                        <div className="flex items-start gap-3">
                          <Avatar
                            className="h-14 w-14 border-2 border-primary/10 cursor-pointer shrink-0"
                            onClick={() => athlete.avatar_url && setEnlargedPhoto({
                              url: athlete.avatar_url,
                              name: `${athlete.first_name} ${athlete.last_name}`,
                            })}
                          >
                            {athlete.avatar_url ? (
                              <AvatarImage
                                src={athlete.avatar_url}
                                alt={`${athlete.first_name} ${athlete.last_name}`}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="bg-muted text-base font-semibold">
                              {getInitials(athlete.first_name, athlete.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base leading-tight break-words">
                              {athlete.first_name} {athlete.last_name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(athlete.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>

                        {/* Info pills: city + instagram */}
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="inline-flex items-center gap-1.5 bg-muted/60 rounded-md px-2.5 py-1 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[180px]">{athlete.city}</span>
                          </span>
                          {athlete.instagram ? (
                            <a
                              href={`https://instagram.com/${athlete.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-md px-2.5 py-1 hover:bg-primary/15 transition-colors"
                            >
                              <Instagram className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[160px]">{athlete.instagram}</span>
                            </a>
                          ) : null}
                        </div>

                        {/* Selectors: category + gender side by side */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground block mb-1">
                              Categoria
                            </label>
                            <Select
                              value={settings.category}
                              onValueChange={(v) => updateAthleteCategory(athlete, v as Category)}
                            >
                              <SelectTrigger className="h-10 text-sm w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground block mb-1">
                              Gênero
                            </label>
                            <Select
                              value={settings.gender}
                              onValueChange={(v) => updateAthleteGender(athlete, v as Gender)}
                            >
                              <SelectTrigger className="h-10 text-sm w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GENDERS.map((g) => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Actions: full-width primary, icon-only destructive */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="lg"
                            className="flex-1 h-11"
                            onClick={() => handleApprove(athlete)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" /> Aprovar
                              </>
                            )}
                          </Button>
                          <Button
                            size="lg"
                            variant="destructive"
                            className="h-11 w-11 p-0 shrink-0"
                            onClick={() => handleDelete(athlete.id)}
                            disabled={isProcessing}
                            aria-label="Remover inscrição"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DESKTOP: Table layout (lg+) */}
                <div className="hidden lg:block rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Atleta</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Instagram</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Gênero</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWaitlist.map((athlete) => {
                      const settings = getAthleteSettings(athlete);
                      return (
                        <TableRow key={athlete.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar 
                                className="h-10 w-10 border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                                onClick={() => athlete.avatar_url && setEnlargedPhoto({ 
                                  url: athlete.avatar_url, 
                                  name: `${athlete.first_name} ${athlete.last_name}` 
                                })}
                              >
                                {athlete.avatar_url ? (
                                  <AvatarImage 
                                    src={athlete.avatar_url} 
                                    alt={`${athlete.first_name} ${athlete.last_name}`}
                                    className="object-cover"
                                  />
                                ) : null}
                                <AvatarFallback className="bg-muted text-sm">
                                  {getInitials(athlete.first_name, athlete.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{athlete.first_name} {athlete.last_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(athlete.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {athlete.city}
                            </span>
                          </TableCell>
                          <TableCell>
                            {athlete.instagram ? (
                              <a 
                                href={`https://instagram.com/${athlete.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline text-sm"
                              >
                                <Instagram className="h-3 w-3" />
                                {athlete.instagram}
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={settings.category} 
                              onValueChange={(v) => updateAthleteCategory(athlete, v as Category)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map(cat => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={settings.gender} 
                              onValueChange={(v) => updateAthleteGender(athlete, v as Gender)}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GENDERS.map(gender => (
                                  <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(athlete)}
                                disabled={processingId === athlete.id}
                              >
                                {processingId === athlete.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <><UserCheck className="h-4 w-4 mr-1" /> Aprovar</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(athlete.id)}
                                disabled={processingId === athlete.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Photo Enlargement Dialog */}
        <Dialog open={!!enlargedPhoto} onOpenChange={() => setEnlargedPhoto(null)}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
            {enlargedPhoto && (
              <div className="relative">
                <button
                  onClick={() => setEnlargedPhoto(null)}
                  className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                <img 
                  src={enlargedPhoto.url} 
                  alt={enlargedPhoto.name}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-medium text-lg">{enlargedPhoto.name}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
});

Waitlist.displayName = 'Waitlist';

export default Waitlist;
