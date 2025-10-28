import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Trophy, UserPlus, Edit, Trash2, Search } from "lucide-react";
import ImportAthletesDialog from "@/components/ImportAthletesDialog";
import BackButton from "@/components/BackButton";
import ImportTutorialDialog from "@/components/ImportTutorialDialog";
import BulkAddAthletesDialog from "@/components/BulkAddAthletesDialog";
import BulkEditAthletesDialog from "@/components/BulkEditAthletesDialog";

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [openAddAthlete, setOpenAddAthlete] = useState(false);
  const [openAddPoints, setOpenAddPoints] = useState(false);
  const [openEditAthlete, setOpenEditAthlete] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAddTournament, setOpenAddTournament] = useState(false);
  const [openEditTournament, setOpenEditTournament] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);

  const [newAthlete, setNewAthlete] = useState({
    name: "",
    email: "",
    city: "",
    instagram: "",
    category: "Iniciante" as "A" | "B" | "C" | "D" | "Iniciante",
  });

  const [editAthlete, setEditAthlete] = useState({
    name: "",
    email: "",
    city: "",
    instagram: "",
    category: "Iniciante" as "A" | "B" | "C" | "D" | "Iniciante",
  });

  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    location: "",
    category: "Iniciante" as "A" | "B" | "C" | "D" | "Iniciante",
    whatsapp: "",
  });

  const [editTournament, setEditTournament] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    location: "",
    category: "Iniciante" as "A" | "B" | "C" | "D" | "Iniciante",
    whatsapp: "",
  });

  const [achievement, setAchievement] = useState({
    tournament_name: "",
    position: "1",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const { data: athletes } = useQuery({
    queryKey: ["admin-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("*")
        .order("points", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tournaments } = useQuery({
    queryKey: ["admin-tournaments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addAthleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("athletes")
        .insert([newAthlete]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      toast({
        title: "Atleta cadastrado!",
        description: "O atleta foi adicionado com sucesso",
      });
      setOpenAddAthlete(false);
      setNewAthlete({ name: "", email: "", city: "", instagram: "", category: "Iniciante" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAthleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("athletes")
        .update({
          name: editAthlete.name,
          email: editAthlete.email || null,
          city: editAthlete.city,
          instagram: editAthlete.instagram || null,
          category: editAthlete.category,
        })
        .eq("id", selectedAthlete.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      toast({
        title: "Atleta atualizado!",
        description: "Os dados do atleta foram atualizados com sucesso",
      });
      setOpenEditAthlete(false);
      setSelectedAthlete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAthleteMutation = useMutation({
    mutationFn: async (athleteId: string) => {
      const { error } = await supabase
        .from("athletes")
        .delete()
        .eq("id", athleteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      toast({
        title: "Atleta excluído!",
        description: "O atleta foi removido do sistema",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addTournamentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tournaments")
        .insert([newTournament]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      toast({
        title: "Torneio cadastrado!",
        description: "O torneio foi adicionado com sucesso",
      });
      setOpenAddTournament(false);
      setNewTournament({ 
        name: "", 
        description: "", 
        date: new Date().toISOString().split('T')[0], 
        location: "", 
        category: "Iniciante",
        whatsapp: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTournamentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("tournaments")
        .update({
          name: editTournament.name,
          description: editTournament.description || null,
          date: editTournament.date,
          location: editTournament.location,
          category: editTournament.category,
          whatsapp: editTournament.whatsapp || null,
        })
        .eq("id", selectedTournament.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      toast({
        title: "Torneio atualizado!",
        description: "Os dados do torneio foram atualizados com sucesso",
      });
      setOpenEditTournament(false);
      setSelectedTournament(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const { error } = await supabase
        .from("tournaments")
        .delete()
        .eq("id", tournamentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
      toast({
        title: "Torneio excluído!",
        description: "O torneio foi removido do sistema",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addPointsMutation = useMutation({
    mutationFn: async () => {
      const pointsMap: Record<string, number> = {
        "1": 100,
        "2": 80,
        "3": 60,
      };

      const pointsToAdd = pointsMap[achievement.position];
      const newPoints = selectedAthlete.points + pointsToAdd;

      // Atualizar pontos do atleta
      const { error: updateError } = await supabase
        .from("athletes")
        .update({ points: newPoints })
        .eq("id", selectedAthlete.id);

      if (updateError) throw updateError;

      // Registrar conquista
      const { error: achievementError } = await supabase
        .from("achievements")
        .insert([{
          athlete_id: selectedAthlete.id,
          tournament_name: achievement.tournament_name,
          position: parseInt(achievement.position),
          points_awarded: pointsToAdd,
          date: achievement.date,
        }]);

      if (achievementError) throw achievementError;

      // Verificar se houve upgrade de categoria e disparar notificação
      const { data: updatedAthlete } = await supabase
        .from("athletes")
        .select("*")
        .eq("id", selectedAthlete.id)
        .single();

      if (updatedAthlete && updatedAthlete.category !== selectedAthlete.category && updatedAthlete.email) {
        // Disparar notificação de upgrade
        await supabase.functions.invoke("notify-category-upgrade", {
          body: {
            athleteName: updatedAthlete.name,
            athleteEmail: updatedAthlete.email,
            oldCategory: selectedAthlete.category,
            newCategory: updatedAthlete.category,
            points: updatedAthlete.points,
          },
        });
      }

      return updatedAthlete;
    },
    onSuccess: (updatedAthlete) => {
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      
      const upgraded = updatedAthlete && updatedAthlete.category !== selectedAthlete.category;
      
      toast({
        title: upgraded ? "🎉 Atleta subiu de categoria!" : "Pontos adicionados!",
        description: upgraded 
          ? `${updatedAthlete.name} subiu para a categoria ${updatedAthlete.category}! Email de notificação enviado.`
          : "A conquista foi registrada com sucesso",
      });
      
      setOpenAddPoints(false);
      setAchievement({ tournament_name: "", position: "1", date: new Date().toISOString().split('T')[0] });
      setSelectedAthlete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <BackButton />
          </div>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground">Gerencie atletas e registre conquistas</p>
            </div>
            <div className="flex gap-2">
              <ImportTutorialDialog />
              <BulkAddAthletesDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-athletes"] })} />
              <BulkEditAthletesDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-athletes"] })} />
              <ImportAthletesDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-athletes"] })} />
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Dialog open={openAddAthlete} onOpenChange={setOpenAddAthlete}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Cadastrar Atleta
                    </CardTitle>
                    <CardDescription>Adicione um novo atleta ao sistema</CardDescription>
                  </CardHeader>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Atleta</DialogTitle>
                  <DialogDescription>
                    Preencha os dados do atleta
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo*</Label>
                    <Input
                      id="name"
                      value={newAthlete.name}
                      onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (para notificações)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newAthlete.email}
                      onChange={(e) => setNewAthlete({ ...newAthlete, email: e.target.value })}
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade*</Label>
                    <Input
                      id="city"
                      value={newAthlete.city}
                      onChange={(e) => setNewAthlete({ ...newAthlete, city: e.target.value })}
                      placeholder="Rio de Janeiro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={newAthlete.instagram}
                      onChange={(e) => setNewAthlete({ ...newAthlete, instagram: e.target.value })}
                      placeholder="@joaosilva"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria*</Label>
                    <Select 
                      value={newAthlete.category} 
                      onValueChange={(value: any) => setNewAthlete({ ...newAthlete, category: value })}
                    >
                      <SelectTrigger>
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
                  <Button 
                    className="w-full" 
                    onClick={() => addAthleteMutation.mutate()}
                    disabled={!newAthlete.name || !newAthlete.city || addAthleteMutation.isPending}
                  >
                    {addAthleteMutation.isPending ? "Cadastrando..." : "Cadastrar Atleta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Sistema Automático
                </CardTitle>
                <CardDescription>
                  Ao registrar conquistas, o sistema:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Calcula e adiciona pontos automaticamente</li>
                    <li>Atualiza categoria ao atingir 500, 1000, 1500 ou 2000 pontos</li>
                    <li>Envia email de notificação ao atleta</li>
                    <li>Registra mudança no histórico</li>
                  </ul>
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Atletas Cadastrados</CardTitle>
              <CardDescription>Clique em "Adicionar Conquista" para registrar pontos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atleta por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(athletes || [])
                    .filter(athlete => 
                      athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((athlete) => (
                    <TableRow key={athlete.id}>
                      <TableCell className="font-medium">{athlete.name}</TableCell>
                      <TableCell>{athlete.category}</TableCell>
                      <TableCell className="font-bold text-primary">{athlete.points}</TableCell>
                      <TableCell>{athlete.city}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog open={openAddPoints && selectedAthlete?.id === athlete.id} onOpenChange={(open) => {
                            setOpenAddPoints(open);
                            if (!open) setSelectedAthlete(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => setSelectedAthlete(athlete)}
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Conquista
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Registrar Conquista</DialogTitle>
                                <DialogDescription>
                                  Adicione uma conquista para {athlete.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="tournament">Nome do Torneio*</Label>
                                  <Input
                                    id="tournament"
                                    value={achievement.tournament_name}
                                    onChange={(e) => setAchievement({ ...achievement, tournament_name: e.target.value })}
                                    placeholder="Copa Verão 2025"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="position">Posição*</Label>
                                  <Select 
                                    value={achievement.position} 
                                    onValueChange={(value) => setAchievement({ ...achievement, position: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1º Lugar (+100 pontos)</SelectItem>
                                      <SelectItem value="2">2º Lugar (+80 pontos)</SelectItem>
                                      <SelectItem value="3">3º Lugar (+60 pontos)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="date">Data*</Label>
                                  <Input
                                    id="date"
                                    type="date"
                                    value={achievement.date}
                                    onChange={(e) => setAchievement({ ...achievement, date: e.target.value })}
                                  />
                                </div>
                                <Button 
                                  className="w-full" 
                                  onClick={() => addPointsMutation.mutate()}
                                  disabled={!achievement.tournament_name || addPointsMutation.isPending}
                                >
                                  {addPointsMutation.isPending ? "Registrando..." : "Registrar Conquista"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog open={openEditAthlete && selectedAthlete?.id === athlete.id} onOpenChange={(open) => {
                            setOpenEditAthlete(open);
                            if (!open) setSelectedAthlete(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedAthlete(athlete);
                                  setEditAthlete({
                                    name: athlete.name,
                                    email: athlete.email || "",
                                    city: athlete.city,
                                    instagram: athlete.instagram || "",
                                    category: athlete.category,
                                  });
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Editar Atleta</DialogTitle>
                                <DialogDescription>
                                  Atualize os dados de {athlete.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-name">Nome Completo*</Label>
                                  <Input
                                    id="edit-name"
                                    value={editAthlete.name}
                                    onChange={(e) => setEditAthlete({ ...editAthlete, name: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-email">Email</Label>
                                  <Input
                                    id="edit-email"
                                    type="email"
                                    value={editAthlete.email}
                                    onChange={(e) => setEditAthlete({ ...editAthlete, email: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-city">Cidade*</Label>
                                  <Input
                                    id="edit-city"
                                    value={editAthlete.city}
                                    onChange={(e) => setEditAthlete({ ...editAthlete, city: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-instagram">Instagram</Label>
                                  <Input
                                    id="edit-instagram"
                                    value={editAthlete.instagram}
                                    onChange={(e) => setEditAthlete({ ...editAthlete, instagram: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-category">Categoria*</Label>
                                  <Select 
                                    value={editAthlete.category} 
                                    onValueChange={(value: any) => setEditAthlete({ ...editAthlete, category: value })}
                                  >
                                    <SelectTrigger>
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
                                <Button
                                  className="w-full" 
                                  onClick={() => updateAthleteMutation.mutate()}
                                  disabled={!editAthlete.name || !editAthlete.city || updateAthleteMutation.isPending}
                                >
                                  {updateAthleteMutation.isPending ? "Atualizando..." : "Atualizar Atleta"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir ${athlete.name}?`)) {
                                deleteAthleteMutation.mutate(athlete.id);
                              }
                            }}
                            disabled={deleteAthleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Seção de Torneios */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Gerenciar Torneios</h2>
            
            <div className="mb-6">
              <Dialog open={openAddTournament} onOpenChange={setOpenAddTournament}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Torneio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Torneio</DialogTitle>
                    <DialogDescription>
                      Preencha os dados do torneio
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tournament-name">Nome do Torneio*</Label>
                      <Input
                        id="tournament-name"
                        value={newTournament.name}
                        onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                        placeholder="Copa Verão 2025"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-description">Descrição</Label>
                      <Input
                        id="tournament-description"
                        value={newTournament.description}
                        onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                        placeholder="Descrição do torneio"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-date">Data*</Label>
                      <Input
                        id="tournament-date"
                        type="date"
                        value={newTournament.date}
                        onChange={(e) => setNewTournament({ ...newTournament, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-location">Local*</Label>
                      <Input
                        id="tournament-location"
                        value={newTournament.location}
                        onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })}
                        placeholder="Rio de Janeiro - RJ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-whatsapp">WhatsApp* (com DDD)</Label>
                      <Input
                        id="tournament-whatsapp"
                        value={newTournament.whatsapp}
                        onChange={(e) => setNewTournament({ ...newTournament, whatsapp: e.target.value })}
                        placeholder="5521999999999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-category">Categoria*</Label>
                      <Select 
                        value={newTournament.category} 
                        onValueChange={(value: any) => setNewTournament({ ...newTournament, category: value })}
                      >
                        <SelectTrigger>
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
                    <Button 
                      className="w-full" 
                      onClick={() => addTournamentMutation.mutate()}
                      disabled={!newTournament.name || !newTournament.date || !newTournament.location || !newTournament.whatsapp || addTournamentMutation.isPending}
                    >
                      {addTournamentMutation.isPending ? "Cadastrando..." : "Cadastrar Torneio"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Torneios Cadastrados</CardTitle>
                <CardDescription>Gerencie os torneios divulgados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tournaments || []).map((tournament) => (
                      <TableRow key={tournament.id}>
                        <TableCell className="font-medium">{tournament.name}</TableCell>
                        <TableCell>{new Date(tournament.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>{tournament.location}</TableCell>
                        <TableCell>{tournament.category}</TableCell>
                        <TableCell>{tournament.whatsapp || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog open={openEditTournament && selectedTournament?.id === tournament.id} onOpenChange={(open) => {
                              setOpenEditTournament(open);
                              if (!open) setSelectedTournament(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTournament(tournament);
                                    setEditTournament({
                                      name: tournament.name,
                                      description: tournament.description || "",
                                      date: tournament.date,
                                      location: tournament.location,
                                      category: tournament.category,
                                      whatsapp: tournament.whatsapp || "",
                                    });
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Editar Torneio</DialogTitle>
                                  <DialogDescription>
                                    Atualize os dados de {tournament.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-tournament-name">Nome do Torneio*</Label>
                                    <Input
                                      id="edit-tournament-name"
                                      value={editTournament.name}
                                      onChange={(e) => setEditTournament({ ...editTournament, name: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-tournament-description">Descrição</Label>
                                    <Input
                                      id="edit-tournament-description"
                                      value={editTournament.description}
                                      onChange={(e) => setEditTournament({ ...editTournament, description: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-tournament-date">Data*</Label>
                                    <Input
                                      id="edit-tournament-date"
                                      type="date"
                                      value={editTournament.date}
                                      onChange={(e) => setEditTournament({ ...editTournament, date: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-tournament-location">Local*</Label>
                                    <Input
                                      id="edit-tournament-location"
                                      value={editTournament.location}
                                      onChange={(e) => setEditTournament({ ...editTournament, location: e.target.value })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-tournament-whatsapp">WhatsApp* (com DDD)</Label>
                                    <Input
                                      id="edit-tournament-whatsapp"
                                      value={editTournament.whatsapp}
                                      onChange={(e) => setEditTournament({ ...editTournament, whatsapp: e.target.value })}
                                      placeholder="5521999999999"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-tournament-category">Categoria*</Label>
                                    <Select 
                                      value={editTournament.category} 
                                      onValueChange={(value: any) => setEditTournament({ ...editTournament, category: value })}
                                    >
                                      <SelectTrigger>
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
                                  <Button
                                    className="w-full" 
                                    onClick={() => updateTournamentMutation.mutate()}
                                    disabled={!editTournament.name || !editTournament.date || !editTournament.location || !editTournament.whatsapp || updateTournamentMutation.isPending}
                                  >
                                    {updateTournamentMutation.isPending ? "Atualizando..." : "Atualizar Torneio"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir o torneio ${tournament.name}?`)) {
                                  deleteTournamentMutation.mutate(tournament.id);
                                }
                              }}
                              disabled={deleteTournamentMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admin;
