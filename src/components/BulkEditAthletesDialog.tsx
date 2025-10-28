import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

interface AthleteUpdate {
  id: string;
  name: string;
  email: string;
  city: string;
  instagram: string;
  category: "A" | "B" | "C" | "D" | "Iniciante";
  selected: boolean;
}

interface BulkEditAthletesDialogProps {
  onSuccess: () => void;
}

const BulkEditAthletesDialog = ({ onSuccess }: BulkEditAthletesDialogProps) => {
  const [open, setOpen] = useState(false);
  const [athletes, setAthletes] = useState<AthleteUpdate[]>([]);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const { data: existingAthletes } = useQuery({
    queryKey: ["bulk-edit-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && existingAthletes) {
      setAthletes(
        existingAthletes.map((athlete) => ({
          id: athlete.id,
          name: athlete.name,
          email: athlete.email || "",
          city: athlete.city,
          instagram: athlete.instagram || "",
          category: athlete.category,
          selected: false,
        }))
      );
    }
  };

  const toggleAthleteSelection = (id: string) => {
    setAthletes((prev) =>
      prev.map((athlete) =>
        athlete.id === id ? { ...athlete, selected: !athlete.selected } : athlete
      )
    );
  };

  const toggleAllSelection = () => {
    const allSelected = athletes.every((a) => a.selected);
    setAthletes((prev) =>
      prev.map((athlete) => ({ ...athlete, selected: !allSelected }))
    );
  };

  const updateAthlete = (id: string, field: keyof AthleteUpdate, value: string) => {
    setAthletes((prev) =>
      prev.map((athlete) =>
        athlete.id === id ? { ...athlete, [field]: value } : athlete
      )
    );
  };

  const handleBulkUpdate = async () => {
    const selectedAthletes = athletes.filter((a) => a.selected);

    if (selectedAthletes.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um atleta para atualizar",
        variant: "destructive",
      });
      return;
    }

    // Validar campos obrigatórios
    const invalidAthletes = selectedAthletes.filter(
      (athlete) => !athlete.name.trim() || !athlete.city.trim()
    );

    if (invalidAthletes.length > 0) {
      toast({
        title: "Erro de validação",
        description: "Nome e cidade são obrigatórios para todos os atletas selecionados",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      // Atualizar cada atleta individualmente
      const updates = selectedAthletes.map((athlete) =>
        supabase
          .from("athletes")
          .update({
            name: athlete.name,
            email: athlete.email || null,
            city: athlete.city,
            instagram: athlete.instagram || null,
            category: athlete.category,
          })
          .eq("id", athlete.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((result) => result.error);

      if (errors.length > 0) {
        toast({
          title: "Erro parcial",
          description: `${errors.length} atleta(s) não puderam ser atualizados`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: `${selectedAthletes.length} atleta(s) atualizado(s) com sucesso`,
        });
        setOpen(false);
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar atletas",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const selectedCount = athletes.filter((a) => a.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edição em Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Atletas em Lote</DialogTitle>
          <DialogDescription>
            Selecione os atletas que deseja editar e atualize suas informações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={athletes.length > 0 && athletes.every((a) => a.selected)}
                onCheckedChange={toggleAllSelection}
              />
              <span className="text-sm font-medium">
                Selecionar todos ({selectedCount} selecionados)
              </span>
            </div>
          </div>

          <div className="overflow-auto max-h-[calc(90vh-250px)] space-y-3">
            {athletes.map((athlete) => (
              <Card
                key={athlete.id}
                className={athlete.selected ? "border-primary" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={athlete.selected}
                      onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                    />
                    <CardTitle className="text-base">{athlete.name}</CardTitle>
                  </div>
                </CardHeader>
                {athlete.selected && (
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`name-${athlete.id}`} className="text-xs">
                        Nome*
                      </Label>
                      <Input
                        id={`name-${athlete.id}`}
                        value={athlete.name}
                        onChange={(e) =>
                          updateAthlete(athlete.id, "name", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`city-${athlete.id}`} className="text-xs">
                        Cidade*
                      </Label>
                      <Input
                        id={`city-${athlete.id}`}
                        value={athlete.city}
                        onChange={(e) =>
                          updateAthlete(athlete.id, "city", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`email-${athlete.id}`} className="text-xs">
                        Email
                      </Label>
                      <Input
                        id={`email-${athlete.id}`}
                        type="email"
                        value={athlete.email}
                        onChange={(e) =>
                          updateAthlete(athlete.id, "email", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`instagram-${athlete.id}`} className="text-xs">
                        Instagram
                      </Label>
                      <Input
                        id={`instagram-${athlete.id}`}
                        value={athlete.instagram}
                        onChange={(e) =>
                          updateAthlete(athlete.id, "instagram", e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`category-${athlete.id}`} className="text-xs">
                        Categoria*
                      </Label>
                      <Select
                        value={athlete.category}
                        onValueChange={(value: any) =>
                          updateAthlete(athlete.id, "category", value)
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Iniciante">Iniciante</SelectItem>
                          <SelectItem value="D">Categoria D</SelectItem>
                          <SelectItem value="C">Categoria C</SelectItem>
                          <SelectItem value="B">Categoria B</SelectItem>
                          <SelectItem value="A">Categoria A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkUpdate} disabled={processing || selectedCount === 0}>
              {processing
                ? "Atualizando..."
                : `Atualizar ${selectedCount} atleta(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditAthletesDialog;
