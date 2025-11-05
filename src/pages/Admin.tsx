import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Trophy, UserPlus, Edit, Trash2, Search, Award, Calendar, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import ImportAthletesDialog from "@/components/ImportAthletesDialog";
import BackButton from "@/components/BackButton";
import ImportTutorialDialog from "@/components/ImportTutorialDialog";
import BulkAddAthletesDialog from "@/components/BulkAddAthletesDialog";
import AthleteAchievementsDialog from "@/components/AthleteAchievementsDialog";

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
  const [adminGenderFilter, setAdminGenderFilter] = useState<string>("all");
  const [adminCityFilter, setAdminCityFilter] = useState<string>("all");
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [openBulkCategory, setOpenBulkCategory] = useState(false);
  const [bulkCategory, setBulkCategory] = useState<"C" | "D" | "Iniciante">("Iniciante");

  const [newAthlete, setNewAthlete] = useState({
    name: "",
    email: "",
    city: "",
    instagram: "",
    category: "Iniciante" as "C" | "D" | "Iniciante",
    gender: "Masculino" as "Masculino" | "Feminino",
  });

  const [editAthlete, setEditAthlete] = useState({
    name: "",
    email: "",
    city: "",
    instagram: "",
    category: "Iniciante" as "C" | "D" | "Iniciante",
    gender: "Masculino" as "Masculino" | "Feminino",
  });

  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    location: "",
    category: "Iniciante" as "C" | "D" | "Iniciante",
    whatsapp: "",
  });

  const [editTournament, setEditTournament] = useState({
    name: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    location: "",
    category: "Iniciante" as "C" | "D" | "Iniciante",
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
      setNewAthlete({ name: "", email: "", city: "", instagram: "", category: "Iniciante", gender: "Masculino" });
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
          gender: editAthlete.gender,
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

  const bulkUpdateCategoryMutation = useMutation({
    mutationFn: async () => {
      const athleteIds = Array.from(selectedAthletes);
      
      const { error } = await supabase
        .from("athletes")
        .update({ category: bulkCategory })
        .in("id", athleteIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      toast({
        title: "Categorias atualizadas!",
        description: `${selectedAthletes.size} atleta(s) atualizado(s) para categoria ${bulkCategory}`,
      });
      setOpenBulkCategory(false);
      setSelectedAthletes(new Set());
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleSelectAll = () => {
    const filteredAthletes = (athletes || []).filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = adminGenderFilter === "all" || athlete.gender === adminGenderFilter;
      const matchesCity = adminCityFilter === "all" || athlete.city === adminCityFilter;
      return matchesSearch && matchesGender && matchesCity;
    });

    if (selectedAthletes.size === filteredAthletes.length) {
      setSelectedAthletes(new Set());
    } else {
      setSelectedAthletes(new Set(filteredAthletes.map(a => a.id)));
    }
  };

  const toggleAthleteSelection = (athleteId: string) => {
    const newSelection = new Set(selectedAthletes);
    if (newSelection.has(athleteId)) {
      newSelection.delete(athleteId);
    } else {
      newSelection.add(athleteId);
    }
    setSelectedAthletes(newSelection);
  };

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
      
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-6 flex justify-between items-center">
            <BackButton />
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerencie atletas e torneios</p>
          </div>

          <Tabs defaultValue="athletes" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="athletes">Atletas</TabsTrigger>
              <TabsTrigger value="tournaments">Torneios</TabsTrigger>
            </TabsList>

            <TabsContent value="athletes" className="space-y-6">
              <div className="flex gap-3 flex-wrap items-center">
                <Dialog open={openAddAthlete} onOpenChange={setOpenAddAthlete}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Novo Atleta
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Atleta</DialogTitle>
                      <DialogDescription>Preencha os dados do atleta</DialogDescription>
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
                        <Label htmlFor="gender">Gênero*</Label>
                        <Select 
                          value={newAthlete.gender} 
                          onValueChange={(value: any) => setNewAthlete({ ...newAthlete, gender: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">🧔 Masculino</SelectItem>
                            <SelectItem value="Feminino">👩 Feminino</SelectItem>
                          </SelectContent>
                        </Select>
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
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => addAthleteMutation.mutate()}
                        disabled={!newAthlete.name || !newAthlete.city || addAthleteMutation.isPending}
                      >
                        {addAthleteMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <BulkAddAthletesDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-athletes"] })} />
                <ImportAthletesDialog onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-athletes"] })} />
                <ImportTutorialDialog />
                
                {selectedAthletes.size > 0 && (
                  <Dialog open={openBulkCategory} onOpenChange={setOpenBulkCategory}>
                    <DialogTrigger asChild>
                      <Button variant="secondary">
                        <Users className="mr-2 h-4 w-4" />
                        Alterar Categoria ({selectedAthletes.size})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Alteração em Massa de Categoria</DialogTitle>
                        <DialogDescription>
                          Alterar categoria de {selectedAthletes.size} atleta(s) selecionado(s)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="bulk-category">Nova Categoria*</Label>
                          <Select 
                            value={bulkCategory} 
                            onValueChange={(value: any) => setBulkCategory(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Iniciante">Iniciante</SelectItem>
                              <SelectItem value="D">Categoria D</SelectItem>
                              <SelectItem value="C">Categoria C</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => bulkUpdateCategoryMutation.mutate()}
                          disabled={bulkUpdateCategoryMutation.isPending}
                        >
                          {bulkUpdateCategoryMutation.isPending ? "Atualizando..." : `Atualizar ${selectedAthletes.size} Atleta(s)`}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <Card className="border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5 text-primary" />
                    Sistema de Pontuação
                  </CardTitle>
                  <CardDescription className="text-sm">
                    1º lugar: <strong>+100 pts</strong> · 2º lugar: <strong>+80 pts</strong> · 3º lugar: <strong>+60 pts</strong>
                    <br />
                    A cada 500 pontos o atleta sobe de categoria automaticamente.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Atletas Cadastrados</CardTitle>
                  <CardDescription>Gerencie atletas e registre conquistas</CardDescription>
                </CardHeader>
                <CardContent>
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar atleta por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={adminGenderFilter} onValueChange={setAdminGenderFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Gênero" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Todos os Gêneros</SelectItem>
                    <SelectItem value="Masculino">🧔 Masculino</SelectItem>
                    <SelectItem value="Feminino">👩 Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={adminCityFilter} onValueChange={setAdminCityFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="all">Todas as Cidades</SelectItem>
                    {[...new Set((athletes || []).map(a => a.city))].sort().map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={(athletes || []).filter(athlete => {
                          const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesGender = adminGenderFilter === "all" || athlete.gender === adminGenderFilter;
                          const matchesCity = adminCityFilter === "all" || athlete.city === adminCityFilter;
                          return matchesSearch && matchesGender && matchesCity;
                        }).length > 0 && selectedAthletes.size === (athletes || []).filter(athlete => {
                          const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
                          const matchesGender = adminGenderFilter === "all" || athlete.gender === adminGenderFilter;
                          const matchesCity = adminCityFilter === "all" || athlete.city === adminCityFilter;
                          return matchesSearch && matchesGender && matchesCity;
                        }).length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Gênero</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(athletes || [])
                    .filter(athlete => {
                      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesGender = adminGenderFilter === "all" || athlete.gender === adminGenderFilter;
                      const matchesCity = adminCityFilter === "all" || athlete.city === adminCityFilter;
                      return matchesSearch && matchesGender && matchesCity;
                    })
                    .map((athlete) => (
                    <TableRow key={athlete.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAthletes.has(athlete.id)}
                          onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{athlete.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {athlete.gender === "Feminino" ? "👩" : "🧔"} {athlete.gender}
                        </Badge>
                      </TableCell>
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

                          <AthleteAchievementsDialog
                            athleteId={athlete.id}
                            athleteName={athlete.name}
                            athletePoints={athlete.points}
                            athleteCategory={athlete.category}
                            isAdmin={true}
                            onAchievementDeleted={() => queryClient.invalidateQueries({ queryKey: ["admin-athletes"] })}
                          >
                            <Button 
                              size="sm" 
                              variant="outline"
                              title="Ver e gerenciar conquistas"
                            >
                              <Award className="h-3 w-3" />
                            </Button>
                          </AthleteAchievementsDialog>

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
                                    gender: athlete.gender || "Masculino",
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
                                  <Label htmlFor="edit-gender">Gênero*</Label>
                                  <Select 
                                    value={editAthlete.gender} 
                                    onValueChange={(value: any) => setEditAthlete({ ...editAthlete, gender: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Masculino">🧔 Masculino</SelectItem>
                                      <SelectItem value="Feminino">👩 Feminino</SelectItem>
                                    </SelectContent>
                                  </Select>
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

            </TabsContent>

            <TabsContent value="tournaments" className="space-y-6">
              <Dialog open={openAddTournament} onOpenChange={setOpenAddTournament}>
                <DialogTrigger asChild>
                  <Button>
                    <Trophy className="mr-2 h-4 w-4" />
                    Novo Torneio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Torneio</DialogTitle>
                    <DialogDescription>Preencha os dados do torneio</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tournament-name-2">Nome do Torneio*</Label>
                      <Input
                        id="tournament-name-2"
                        value={newTournament.name}
                        onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                        placeholder="Copa Verão 2025"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-description-2">Descrição</Label>
                      <Input
                        id="tournament-description-2"
                        value={newTournament.description}
                        onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                        placeholder="Descrição do torneio"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-date-2">Data*</Label>
                      <Input
                        id="tournament-date-2"
                        type="date"
                        value={newTournament.date}
                        onChange={(e) => setNewTournament({ ...newTournament, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-location-2">Local*</Label>
                      <Input
                        id="tournament-location-2"
                        value={newTournament.location}
                        onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })}
                        placeholder="Rio de Janeiro - RJ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-whatsapp-2">WhatsApp* (número com DDD ou link)</Label>
                      <Input
                        id="tournament-whatsapp-2"
                        value={newTournament.whatsapp}
                        onChange={(e) => setNewTournament({ ...newTournament, whatsapp: e.target.value })}
                        placeholder="5521999999999 ou https://wa.me/5521999999999"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tournament-category-2">Categoria*</Label>
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
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => addTournamentMutation.mutate()}
                      disabled={!newTournament.name || !newTournament.date || !newTournament.location || !newTournament.whatsapp || addTournamentMutation.isPending}
                    >
                      {addTournamentMutation.isPending ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

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
                                    <Label htmlFor="edit-tournament-whatsapp">WhatsApp* (número com DDD ou link)</Label>
                                    <Input
                                      id="edit-tournament-whatsapp"
                                      value={editTournament.whatsapp}
                                      onChange={(e) => setEditTournament({ ...editTournament, whatsapp: e.target.value })}
                                      placeholder="5521999999999 ou https://wa.me/5521999999999"
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
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Admin;
