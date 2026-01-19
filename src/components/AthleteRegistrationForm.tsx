import { memo, useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2, CheckCircle, AlertTriangle, Upload, X, Camera, Instagram } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { calculateSimilarity, normalizeString } from '@/lib/nameSimilarity';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CategoryQuestionnaire, { QuestionnaireResponses, SuggestedCategory } from './CategoryQuestionnaire';

type Gender = 'Masculino' | 'Feminino';
type RegistrationStep = 'form' | 'questionnaire';

interface RegistrationForm {
  firstName: string;
  lastName: string;
  city: string;
  gender: Gender;
  instagram: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const AthleteRegistrationForm = memo(() => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<RegistrationStep>('form');
  const [form, setForm] = useState<RegistrationForm>({ 
    firstName: '', 
    lastName: '', 
    city: '', 
    gender: 'Masculino',
    instagram: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<QuestionnaireResponses | null>(null);
  const [suggestedCategory, setSuggestedCategory] = useState<SuggestedCategory>('Iniciante');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Formato inválido', { description: 'Use JPG, JPEG ou PNG' });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande', { description: 'Tamanho máximo: 5MB' });
      return;
    }

    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove photo
  const handleRemovePhoto = useCallback(() => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Upload photo to storage
  const uploadPhoto = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('waitlist-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error('Erro ao fazer upload da foto');
    }

    const { data } = supabase.storage
      .from('waitlist-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Validate Instagram handle
  const validateInstagram = (value: string): boolean => {
    if (!value) return true; // Optional field
    // Remove @ if present and validate
    const handle = value.replace('@', '').trim();
    // Instagram usernames: 1-30 chars, letters, numbers, periods, underscores
    const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return instagramRegex.test(handle);
  };

  // Format Instagram for storage
  const formatInstagram = (value: string): string | null => {
    if (!value.trim()) return null;
    const handle = value.replace('@', '').trim();
    return handle ? `@${handle}` : null;
  };

  const registerMutation = useMutation({
    mutationFn: async (data: { form: RegistrationForm; responses: QuestionnaireResponses; category: SuggestedCategory }) => {
      if (!photoFile) {
        throw new Error('Foto de perfil é obrigatória');
      }

      setIsUploading(true);
      
      // Upload photo first
      const avatarUrl = await uploadPhoto(photoFile);
      
      // Then insert waitlist entry with questionnaire data
      const { error } = await supabase.from('waitlist').insert([{
        first_name: data.form.firstName.trim(),
        last_name: data.form.lastName.trim(),
        city: data.form.city.trim(),
        gender: data.form.gender,
        avatar_url: avatarUrl,
        instagram: formatInstagram(data.form.instagram),
        questionnaire_responses: JSON.parse(JSON.stringify(data.responses)),
        suggested_category: data.category,
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição realizada!', { description: 'Você está na lista de espera.' });
      resetForm();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['registration-name-check'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao realizar inscrição', { description: error.message });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  const resetForm = useCallback(() => {
    setForm({ firstName: '', lastName: '', city: '', gender: 'Masculino', instagram: '' });
    setPhotoFile(null);
    setPhotoPreview(null);
    setStep('form');
    setQuestionnaireResponses(null);
    setSuggestedCategory('Iniciante');
  }, []);

  // First step: Validate basic form and go to questionnaire
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.firstName.trim() || !form.lastName.trim() || !form.city.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (!photoFile) {
      toast.error('Foto de perfil é obrigatória', { description: 'Adicione uma foto para continuar' });
      return;
    }

    if (form.instagram && !validateInstagram(form.instagram)) {
      toast.error('Instagram inválido', { description: 'Use apenas letras, números, pontos e underscores' });
      return;
    }

    if (hasDuplicate && matches.some(m => m.similarity >= 95)) {
      toast.error('Nome muito parecido com atleta já cadastrado');
      return;
    }

    // Move to questionnaire step
    setStep('questionnaire');
  };

  // Handle questionnaire completion
  const handleQuestionnaireComplete = useCallback((responses: QuestionnaireResponses, category: SuggestedCategory) => {
    setQuestionnaireResponses(responses);
    setSuggestedCategory(category);
    
    // Submit the registration with questionnaire data
    registerMutation.mutate({ form, responses, category });
  }, [form, registerMutation]);

  const handleBackToForm = useCallback(() => {
    setStep('form');
  }, []);

  const updateField = useCallback((field: keyof RegistrationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const isSubmitting = registerMutation.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 font-semibold">
          <UserPlus className="h-5 w-5" />
          Inscreva-se como Atleta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {step === 'form' ? 'Inscrição de Atleta' : 'Avaliação de Categoria'}
          </DialogTitle>
        </DialogHeader>
        
        {step === 'form' ? (
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-2">
            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Foto de Perfil
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground/50">
                    {photoPreview ? (
                      <AvatarImage src={photoPreview} alt="Preview" className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-muted">
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {photoPreview ? 'Trocar foto' : 'Escolher foto'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    JPG, JPEG ou PNG (máx. 5MB)
                  </span>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {!photoFile && (
                <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Foto obrigatória para identificação
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Nome <span className="text-destructive">*</span></Label>
              <Input
                id="firstName"
                placeholder="Seu nome"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                maxLength={50}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="city">Cidade <span className="text-destructive">*</span></Label>
                <Input
                  id="city"
                  placeholder="Sua cidade"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Gênero <span className="text-destructive">*</span></Label>
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

            {/* Instagram Field */}
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-1.5">
                <Instagram className="h-4 w-4" />
                Instagram
                <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input
                id="instagram"
                placeholder="@seuinstagram"
                value={form.instagram}
                onChange={(e) => updateField('instagram', e.target.value)}
                maxLength={31}
              />
              {form.instagram && !validateInstagram(form.instagram) && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Formato inválido
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={(hasDuplicate && matches.some(m => m.similarity >= 95)) || !photoFile}
            >
              Continuar para Avaliação
            </Button>
          </form>
        ) : (
          <div className="mt-2">
            {isSubmitting ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  {isUploading ? 'Enviando foto...' : 'Finalizando inscrição...'}
                </p>
              </div>
            ) : (
              <CategoryQuestionnaire
                onComplete={handleQuestionnaireComplete}
                onBack={handleBackToForm}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

AthleteRegistrationForm.displayName = 'AthleteRegistrationForm';

export default AthleteRegistrationForm;
