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
import { toast } from 'sonner';
import { Search, UserCheck, Trash2, Loader2, Clock, MapPin, Instagram, User } from 'lucide-react';
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

const CATEGORIES: Category[] = ['Iniciante', 'D', 'C'];
const GENDERS: Gender[] = ['Masculino', 'Feminino'];

const Waitlist = memo(() => {
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
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
      <main className="container mx-auto px-4 py-8">
        <BackButton />
        
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-display flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Lista de Espera
              {waitlist && <Badge variant="secondary" className="ml-2">{waitlist.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Filter */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cidade ou Instagram..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredWaitlist.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {search ? 'Nenhum resultado encontrado' : 'Lista de espera vazia'}
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
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
                              <Avatar className="h-10 w-10 border">
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
});

Waitlist.displayName = 'Waitlist';

export default Waitlist;
