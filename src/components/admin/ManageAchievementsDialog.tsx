import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Edit, Trash2, History } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Athlete {
  id: string;
  name: string;
  points: number;
}

interface Achievement {
  id: string;
  athlete_id: string;
  tournament_name: string;
  position: number;
  points_awarded: number;
  date: string;
}

interface ManageAchievementsDialogProps {
  athlete: Athlete;
  children: React.ReactNode;
}

const ManageAchievementsDialog = ({ athlete, children }: ManageAchievementsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
  const [editForm, setEditForm] = useState({
    tournament_name: "",
    position: "1",
    points_awarded: 100,
    date: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: achievements, isLoading } = useQuery({
    queryKey: ["athlete-achievements-admin", athlete.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("athlete_id", athlete.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Achievement[];
    },
    enabled: open,
  });

  const updateAchievementMutation = useMutation({
    mutationFn: async () => {
      if (!editingAchievement) return;

      const oldPoints = editingAchievement.points_awarded;
      const newPoints = editForm.points_awarded;
      const pointsDiff = newPoints - oldPoints;

      // Atualizar conquista
      const { error: achievementError } = await supabase
        .from("achievements")
        .update({
          tournament_name: editForm.tournament_name,
          position: parseInt(editForm.position),
          points_awarded: newPoints,
          date: editForm.date,
        })
        .eq("id", editingAchievement.id);

      if (achievementError) throw achievementError;

      // Atualizar pontos do atleta se houver diferença
      if (pointsDiff !== 0) {
        const { error: athleteError } = await supabase
          .from("athletes")
          .update({ points: athlete.points + pointsDiff })
          .eq("id", athlete.id);

        if (athleteError) throw athleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-achievements-admin", athlete.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      toast({
        title: "Conquista atualizada!",
        description: "A conquista foi atualizada com sucesso",
      });
      setEditingAchievement(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: async (achievement: Achievement) => {
      // Remover pontos do atleta
      const { error: athleteError } = await supabase
        .from("athletes")
        .update({ points: Math.max(0, athlete.points - achievement.points_awarded) })
        .eq("id", athlete.id);

      if (athleteError) throw athleteError;

      // Excluir conquista
      const { error: achievementError } = await supabase
        .from("achievements")
        .delete()
        .eq("id", achievement.id);

      if (achievementError) throw achievementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-achievements-admin", athlete.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      toast({
        title: "Conquista excluída!",
        description: "A conquista foi removida e os pontos foram ajustados",
      });
      setDeleteConfirmOpen(false);
      setAchievementToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditClick = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setEditForm({
      tournament_name: achievement.tournament_name,
      position: achievement.position.toString(),
      points_awarded: achievement.points_awarded,
      date: achievement.date,
    });
  };

  const handleDeleteClick = (achievement: Achievement) => {
    setAchievementToDelete(achievement);
    setDeleteConfirmOpen(true);
  };

  const getPositionEmoji = (position: number) => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "🏅";
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Conquistas de {athlete.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie as conquistas e pontuações do atleta. Total atual: {athlete.points} pts
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando conquistas...</div>
          ) : achievements && achievements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Torneio</TableHead>
                  <TableHead className="text-center">Pos.</TableHead>
                  <TableHead className="text-center">Pontos</TableHead>
                  <TableHead className="text-center">Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell className="font-medium">{achievement.tournament_name}</TableCell>
                    <TableCell className="text-center">
                      {getPositionEmoji(achievement.position)} {achievement.position}º
                    </TableCell>
                    <TableCell className="text-center font-semibold text-primary">
                      +{achievement.points_awarded}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {new Date(achievement.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(achievement)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(achievement)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conquista registrada</p>
            </div>
          )}

          {/* Dialog de Edição */}
          {editingAchievement && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editar Conquista
              </h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-tournament">Nome do Torneio*</Label>
                  <Input
                    id="edit-tournament"
                    value={editForm.tournament_name}
                    onChange={(e) => setEditForm({ ...editForm, tournament_name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-position">Posição*</Label>
                    <Select 
                      value={editForm.position} 
                      onValueChange={(value) => {
                        const pointsMap: Record<string, number> = { "1": 100, "2": 80, "3": 60 };
                        setEditForm({ 
                          ...editForm, 
                          position: value,
                          points_awarded: pointsMap[value] || editForm.points_awarded
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1º Lugar</SelectItem>
                        <SelectItem value="2">2º Lugar</SelectItem>
                        <SelectItem value="3">3º Lugar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-points">Pontos*</Label>
                    <Input
                      id="edit-points"
                      type="number"
                      min="0"
                      value={editForm.points_awarded}
                      onChange={(e) => setEditForm({ ...editForm, points_awarded: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-date">Data*</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => updateAchievementMutation.mutate()}
                    disabled={!editForm.tournament_name || updateAchievementMutation.isPending}
                  >
                    {updateAchievementMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingAchievement(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Alert Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Conquista?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conquista "{achievementToDelete?.tournament_name}"?
              <br /><br />
              <strong className="text-destructive">
                Os {achievementToDelete?.points_awarded} pontos serão removidos do atleta.
              </strong>
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => achievementToDelete && deleteAchievementMutation.mutate(achievementToDelete)}
              disabled={deleteAchievementMutation.isPending}
            >
              {deleteAchievementMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageAchievementsDialog;
