import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Plus, Trash2, Save, AlertTriangle } from "lucide-react";
import { athleteSchema } from "@/lib/validations";
import { z } from "zod";
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck";
import { findDuplicates, DuplicateMatch } from "@/lib/nameSimilarity";
import DuplicateWarningDialog from "@/components/DuplicateWarningDialog";
import { Badge } from "@/components/ui/badge";

interface AthleteFormData {
  id: string;
  name: string;
  email: string;
  city: string;
  instagram: string;
  category: "C" | "D" | "Iniciante";
  gender: "Masculino" | "Feminino";
}

const BulkAddAthletesDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [athletes, setAthletes] = useState<AthleteFormData[]>([
    { id: "1", name: "", email: "", city: "", instagram: "", category: "Iniciante", gender: "Masculino" },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [duplicateAthleteName, setDuplicateAthleteName] = useState("");
  const { toast } = useToast();

  // Get existing athletes for duplicate check
  const { checkName, athleteCount } = useDuplicateCheck();

  const addNewAthlete = () => {
    const newId = String(Date.now());
    setAthletes([
      ...athletes,
      { id: newId, name: "", email: "", city: "", instagram: "", category: "Iniciante", gender: "Masculino" },
    ]);
  };

  const removeAthlete = (id: string) => {
    if (athletes.length === 1) {
      toast({
        title: "Atenção",
        description: "Deve haver pelo menos um atleta no formulário",
        variant: "destructive",
      });
      return;
    }
    setAthletes(athletes.filter((a) => a.id !== id));
  };

  const updateAthlete = (id: string, field: keyof AthleteFormData, value: string) => {
    setAthletes(
      athletes.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  // Check for duplicates in the batch
  const checkForDuplicates = () => {
    const validAthletes = athletes.filter((a) => a.name.trim() && a.city.trim());
    
    for (const athlete of validAthletes) {
      const result = checkName(athlete.name);
      if (result.hasDuplicates && result.matches.some(m => m.similarity >= 90)) {
        setDuplicateMatches(result.matches);
        setDuplicateAthleteName(athlete.name);
        setShowDuplicateWarning(true);
        return true;
      }
    }
    return false;
  };

  const handleBulkSave = async (skipDuplicateCheck = false) => {
    const validAthletes = athletes.filter((a) => a.name.trim() && a.city.trim());

    if (validAthletes.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos nome e cidade de um atleta",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicates before saving (unless skipped)
    if (!skipDuplicateCheck && checkForDuplicates()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Validate each athlete before insertion
      const athletesToInsert = [];
      const validationErrors = [];

      for (let i = 0; i < validAthletes.length; i++) {
        const athlete = validAthletes[i];
        try {
          const athleteData = {
            name: athlete.name.trim(),
            city: athlete.city.trim(),
            category: athlete.category,
            gender: athlete.gender,
            email: athlete.email?.trim() || undefined,
            instagram: athlete.instagram?.trim() || undefined,
            points: 0,
          };
          
          const validated = athleteSchema.parse(athleteData);
          athletesToInsert.push(validated);
        } catch (error) {
          if (error instanceof z.ZodError) {
            validationErrors.push(`Atleta ${i + 1}: ${error.issues[0].message}`);
          }
        }
      }

      if (validationErrors.length > 0) {
        toast({
          title: "Erros de validação",
          description: validationErrors[0],
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const { error } = await supabase.from("athletes").insert(athletesToInsert);

      if (error) throw error;

      toast({
        title: "✓ Cadastro em lote concluído!",
        description: `${validAthletes.length} atletas cadastrados com sucesso`,
      });

      setOpen(false);
      setShowDuplicateWarning(false);
      setAthletes([
        { id: "1", name: "", email: "", city: "", instagram: "", category: "Iniciante", gender: "Masculino" },
      ]);
      onSuccess();
    } catch (error: any) {
      console.error("Erro no cadastro em lote:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Ocorreu um erro durante o cadastro",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get duplicate warnings for all athletes
  const athleteDuplicateWarnings = useMemo(() => {
    const warnings: Record<string, DuplicateMatch[]> = {};
    athletes.forEach((athlete) => {
      if (athlete.name.length >= 3) {
        const result = checkName(athlete.name);
        if (result.hasDuplicates) {
          warnings[athlete.id] = result.matches;
        }
      }
    });
    return warnings;
  }, [athletes, checkName]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Cadastro em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastrar Vários Atletas
          </DialogTitle>
          <DialogDescription>
            Adicione múltiplos atletas de uma vez e salve todos juntos
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {athletes.map((athlete, index) => (
              <Card key={athlete.id} className="relative">
                <CardContent className="pt-6">
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAthlete(athlete.id)}
                      disabled={athletes.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Atleta #{index + 1}</h4>
                    {athleteDuplicateWarnings[athlete.id] && (
                      <Badge variant="outline" className="text-amber-600 border-amber-500 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Nome parecido encontrado
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${athlete.id}`}>Nome Completo*</Label>
                      <Input
                        id={`name-${athlete.id}`}
                        value={athlete.name}
                        onChange={(e) => updateAthlete(athlete.id, "name", e.target.value)}
                        placeholder="João Silva"
                        className={athleteDuplicateWarnings[athlete.id] ? "border-amber-500" : ""}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`city-${athlete.id}`}>Cidade*</Label>
                      <Input
                        id={`city-${athlete.id}`}
                        value={athlete.city}
                        onChange={(e) => updateAthlete(athlete.id, "city", e.target.value)}
                        placeholder="Rio de Janeiro"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`email-${athlete.id}`}>Email</Label>
                      <Input
                        id={`email-${athlete.id}`}
                        type="email"
                        value={athlete.email}
                        onChange={(e) => updateAthlete(athlete.id, "email", e.target.value)}
                        placeholder="joao@email.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`instagram-${athlete.id}`}>Instagram</Label>
                      <Input
                        id={`instagram-${athlete.id}`}
                        value={athlete.instagram}
                        onChange={(e) => updateAthlete(athlete.id, "instagram", e.target.value)}
                        placeholder="@joaosilva"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`gender-${athlete.id}`}>Gênero*</Label>
                      <Select
                        value={athlete.gender}
                        onValueChange={(value: any) =>
                          updateAthlete(athlete.id, "gender", value)
                        }
                      >
                        <SelectTrigger id={`gender-${athlete.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Masculino">🧔 Masculino</SelectItem>
                          <SelectItem value="Feminino">👩 Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`category-${athlete.id}`}>Categoria*</Label>
                      <Select
                        value={athlete.category}
                        onValueChange={(value: any) =>
                          updateAthlete(athlete.id, "category", value)
                        }
                      >
                        <SelectTrigger id={`category-${athlete.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Iniciante">Iniciante</SelectItem>
                          <SelectItem value="D">Categoria D</SelectItem>
                          <SelectItem value="C">Categoria C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 justify-between pt-4 border-t">
          <Button variant="outline" onClick={addNewAthlete}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Mais
          </Button>
          <Button onClick={() => handleBulkSave()} disabled={isProcessing}>
            <Save className="mr-2 h-4 w-4" />
            {isProcessing ? "Salvando..." : `Salvar Todos (${athletes.filter(a => a.name && a.city).length})`}
          </Button>
        </div>

        {/* Duplicate Warning Dialog */}
        <DuplicateWarningDialog
          open={showDuplicateWarning}
          onOpenChange={setShowDuplicateWarning}
          matches={duplicateMatches}
          athleteName={duplicateAthleteName}
          onConfirm={() => {
            handleBulkSave(true);
          }}
          onCancel={() => {
            setShowDuplicateWarning(false);
          }}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BulkAddAthletesDialog;
