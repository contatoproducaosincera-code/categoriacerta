import { memo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { calculateSimilarity, normalizeString } from '@/lib/nameSimilarity';

type Gender = 'Masculino' | 'Feminino';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  city: string;
  gender: Gender;
}

const AthleteRegistrationForm = memo(() => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RegistrationForm>({ firstName: '', lastName: '', city: '', gender: 'Masculino' });
  const queryClient = useQueryClient();
  
  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const debouncedName = useDebounce(fullName, 300);

  // Cache existing names for duplicate check
  const { data: existingNames } = useQuery({
    queryKey: ['registration-name-check'],
    queryFn: async () => {
      const [athletesResult, waitlistResult] = await Promise.all([
        supabase.from('athletes').select('name, city'),
        supabase.from('waitlist').select('first_name, last_name, city')
      ]);
      
      const athletes = (athletesResult.data || []).map(a => ({ 
        name: a.name, 
        city: a.city 
      }));
      
      const waitlist = (waitlistResult.data || []).map(w => ({ 
        name: `${w.first_name} ${w.last_name}`, 
        city: w.city 
      }));
      
      return [...athletes, ...waitlist];
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    enabled: open,
  });

  // Check for duplicates
  const duplicateCheck = useCallback(() => {
    if (!debouncedName || debouncedName.length < 3 || !existingNames) {
      return { hasDuplicate: false, matches: [] as { name: string; city: string; similarity: number }[] };
    }

    const normalizedNew = normalizeString(debouncedName);
    const matches: { name: string; city: string; similarity: number }[] = [];

    for (const existing of existingNames) {
      const normalizedExisting = normalizeString(existing.name);
      
      // Exact match
      if (normalizedNew === normalizedExisting) {
        matches.push({ ...existing, similarity: 100 });
        continue;
      }
      
      // High similarity
      const similarity = calculateSimilarity(normalizedNew, normalizedExisting);
      if (similarity >= 85) {
        matches.push({ ...existing, similarity });
      }
    }

    return { 
      hasDuplicate: matches.length > 0, 
      matches: matches.sort((a, b) => b.similarity - a.similarity).slice(0, 3) 
    };
  }, [debouncedName, existingNames]);

  const { hasDuplicate, matches } = duplicateCheck();

  const registerMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      const { error } = await supabase.from('waitlist').insert({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        city: data.city.trim(),
        gender: data.gender,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição realizada!', { description: 'Você está na lista de espera.' });
      setForm({ firstName: '', lastName: '', city: '', gender: 'Masculino' });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['registration-name-check'] });
    },
    onError: () => {
      toast.error('Erro ao realizar inscrição');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.firstName.trim() || !form.lastName.trim() || !form.city.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (hasDuplicate && matches.some(m => m.similarity >= 95)) {
      toast.error('Nome muito parecido com atleta já cadastrado');
      return;
    }

    registerMutation.mutate(form);
  };

  const updateField = useCallback((field: keyof RegistrationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 font-semibold">
          <UserPlus className="h-5 w-5" />
          Inscreva-se como Atleta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Inscrição de Atleta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              placeholder="Seu nome"
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input
              id="lastName"
              placeholder="Seu sobrenome"
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Duplicate indicator */}
          {fullName.length >= 3 && (
            <div className="text-xs flex items-center gap-1.5">
              {hasDuplicate ? (
                <span className={matches.some(m => m.similarity >= 95) ? 'text-destructive' : 'text-amber-600 dark:text-amber-500'}>
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Nome parecido: {matches[0]?.name} ({matches[0]?.city})
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-500">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  Nome disponível
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Sua cidade"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label>Gênero</Label>
              <Select value={form.gender} onValueChange={(v) => setForm(prev => ({ ...prev, gender: v as Gender }))}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={registerMutation.isPending || (hasDuplicate && matches.some(m => m.similarity >= 95))}
          >
            {registerMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
            ) : (
              'Enviar Inscrição'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
});

AthleteRegistrationForm.displayName = 'AthleteRegistrationForm';

export default AthleteRegistrationForm;
