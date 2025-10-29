import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Plus, Trash2, Save } from "lucide-react";

interface AthleteFormData {
  id: string;
  name: string;
  email: string;
  city: string;
  instagram: string;
  category: "C" | "D" | "Iniciante";
}

const BulkAddAthletesDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [athletes, setAthletes] = useState<AthleteFormData[]>([
    { id: "1", name: "", email: "", city: "", instagram: "", category: "Iniciante" },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const addNewAthlete = () => {
    const newId = String(Date.now());
    setAthletes([
      ...athletes,
      { id: newId, name: "", email: "", city: "", instagram: "", category: "Iniciante" },
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

  const handleBulkSave = async () => {
    const validAthletes = athletes.filter((a) => a.name.trim() && a.city.trim());

    if (validAthletes.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos nome e cidade de um atleta",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const athletesToInsert = validAthletes.map((athlete) => ({
        name: athlete.name.trim(),
        city: athlete.city.trim(),
        category: athlete.category,
        email: athlete.email.trim() || null,
        instagram: athlete.instagram.trim() || null,
        points: 0,
      }));

      const { error } = await supabase.from("athletes").insert(athletesToInsert);

      if (error) throw error;

      toast({
        title: "✓ Cadastro em lote concluído!",
        description: `${validAthletes.length} atletas cadastrados com sucesso`,
      });

      setOpen(false);
      setAthletes([
        { id: "1", name: "", email: "", city: "", instagram: "", category: "Iniciante" },
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

                  <h4 className="font-semibold mb-4">Atleta #{index + 1}</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${athlete.id}`}>Nome Completo*</Label>
                      <Input
                        id={`name-${athlete.id}`}
                        value={athlete.name}
                        onChange={(e) => updateAthlete(athlete.id, "name", e.target.value)}
                        placeholder="João Silva"
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
          <Button onClick={handleBulkSave} disabled={isProcessing}>
            <Save className="mr-2 h-4 w-4" />
            {isProcessing ? "Salvando..." : `Salvar Todos (${athletes.filter(a => a.name && a.city).length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkAddAthletesDialog;
