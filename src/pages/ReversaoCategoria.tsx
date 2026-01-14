import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, AlertTriangle, CheckCircle2, History, Users, ArrowRight, Calculator, RefreshCw, Zap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryHistoryWithAthlete {
  id: string;
  athlete_id: string;
  old_category: "C" | "D" | "Iniciante";
  new_category: "C" | "D" | "Iniciante";
  points_at_change: number;
  changed_at: string;
  athlete_name?: string;
}

interface RevertedAthlete {
  id: string;
  name: string;
  categoryBefore: string;
  categoryAfter: string;
  pointsRestored: number;
}

interface AthleteWithMismatchedPoints {
  id: string;
  name: string;
  category: string;
  currentPoints: number;
  calculatedPoints: number;
  difference: number;
}

interface RecalculatedAthlete {
  id: string;
  name: string;
  category: string;
  oldPoints: number;
  newPoints: number;
}

interface SyncedAthlete {
  id: string;
  name: string;
  oldCategory: string;
  newCategory: string;
  oldPoints: number;
  newPoints: number;
  promoted: boolean;
}

// Função para calcular a categoria correta baseada nos pontos TOTAIS acumulados
const calculateCorrectCategory = (totalPoints: number): { category: "C" | "D" | "Iniciante"; pointsInCategory: number } => {
  // Regras:
  // - Iniciante: 0-159 pontos -> sobe para D com 160 pontos
  // - D: 0-299 pontos na categoria -> sobe para C com 300 pontos
  // - C: categoria máxima, não pontua mais
  
  // Calcular quantas vezes o atleta subiu de categoria
  // Iniciante -> D: precisa de 160 pontos
  // D -> C: precisa de mais 300 pontos (total 460)
  
  if (totalPoints >= 460) {
    // Atingiu C (160 para D + 300 para C = 460)
    // Na categoria C não pontua
    return { category: "C", pointsInCategory: 0 };
  } else if (totalPoints >= 160) {
    // Está na categoria D
    // Pontos na categoria D = total - 160 (pontos usados para subir para D)
    const pointsInD = totalPoints - 160;
    
    // Se já tem 300+ pontos na D, deveria ter subido para C
    if (pointsInD >= 300) {
      return { category: "C", pointsInCategory: 0 };
    }
    
    return { category: "D", pointsInCategory: pointsInD };
  } else {
    // Ainda é Iniciante
    return { category: "Iniciante", pointsInCategory: totalPoints };
  }
};

const ReversaoCategoria = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [revertedAthletes, setRevertedAthletes] = useState<RevertedAthlete[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [recalculatedAthletes, setRecalculatedAthletes] = useState<RecalculatedAthlete[]>([]);
  const [showRecalculateReport, setShowRecalculateReport] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [syncedAthletes, setSyncedAthletes] = useState<SyncedAthlete[]>([]);
  const [showSyncReport, setShowSyncReport] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Buscar atletas afetados pela última atualização automática
  const { data: affectedAthletes, isLoading, refetch } = useQuery({
    queryKey: ["affected-athletes-for-revert"],
    queryFn: async () => {
      const { data: historyData, error: historyError } = await supabase
        .from("category_history")
        .select("*")
        .order("changed_at", { ascending: false });

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        return [];
      }

      const athleteIds = [...new Set(historyData.map(h => h.athlete_id))];
      const { data: athletesData, error: athletesError } = await supabase
        .from("athletes")
        .select("id, name, category, points")
        .in("id", athleteIds);

      if (athletesError) throw athletesError;

      const athleteMap = new Map(athletesData?.map(a => [a.id, a]) || []);

      const enrichedHistory: CategoryHistoryWithAthlete[] = historyData.map(h => ({
        ...h,
        old_category: h.old_category as "C" | "D" | "Iniciante",
        new_category: h.new_category as "C" | "D" | "Iniciante",
        athlete_name: athleteMap.get(h.athlete_id)?.name || "Atleta não encontrado",
      }));

      return enrichedHistory;
    },
  });

  // Buscar atletas com pontuação inconsistente
  const { data: mismatchedAthletes, isLoading: isLoadingMismatched, refetch: refetchMismatched } = useQuery({
    queryKey: ["athletes-with-mismatched-points"],
    queryFn: async () => {
      const { data: athletes, error: athletesError } = await supabase
        .from("athletes")
        .select("id, name, category, points");

      if (athletesError) throw athletesError;

      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("athlete_id, points_awarded");

      if (achievementsError) throw achievementsError;

      const pointsByAthlete = new Map<string, number>();
      achievements?.forEach(ach => {
        const current = pointsByAthlete.get(ach.athlete_id) || 0;
        pointsByAthlete.set(ach.athlete_id, current + ach.points_awarded);
      });

      const mismatched: AthleteWithMismatchedPoints[] = [];
      athletes?.forEach(athlete => {
        const totalAchievementPoints = pointsByAthlete.get(athlete.id) || 0;
        const { pointsInCategory } = calculateCorrectCategory(totalAchievementPoints);
        
        // Só mostrar atletas com discrepância de pontos
        if (totalAchievementPoints > 0 && athlete.points !== pointsInCategory) {
          mismatched.push({
            id: athlete.id,
            name: athlete.name,
            category: athlete.category,
            currentPoints: athlete.points,
            calculatedPoints: pointsInCategory,
            difference: pointsInCategory - athlete.points,
          });
        }
      });

      return mismatched.sort((a, b) => b.difference - a.difference);
    },
  });

  // Buscar todos os atletas para sincronização completa
  const { data: allAthletesForSync, isLoading: isLoadingSync, refetch: refetchSync } = useQuery({
    queryKey: ["all-athletes-for-sync"],
    queryFn: async () => {
      const { data: athletes, error: athletesError } = await supabase
        .from("athletes")
        .select("id, name, category, points");

      if (athletesError) throw athletesError;

      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("athlete_id, points_awarded");

      if (achievementsError) throw achievementsError;

      const pointsByAthlete = new Map<string, number>();
      achievements?.forEach(ach => {
        const current = pointsByAthlete.get(ach.athlete_id) || 0;
        pointsByAthlete.set(ach.athlete_id, current + ach.points_awarded);
      });

      const athletesNeedingSync: Array<{
        id: string;
        name: string;
        currentCategory: string;
        correctCategory: string;
        currentPoints: number;
        correctPoints: number;
        totalAchievementPoints: number;
        needsUpdate: boolean;
      }> = [];

      athletes?.forEach(athlete => {
        const totalAchievementPoints = pointsByAthlete.get(athlete.id) || 0;
        const { category: correctCategory, pointsInCategory: correctPoints } = calculateCorrectCategory(totalAchievementPoints);
        
        const needsUpdate = athlete.category !== correctCategory || athlete.points !== correctPoints;
        
        if (totalAchievementPoints > 0 || needsUpdate) {
          athletesNeedingSync.push({
            id: athlete.id,
            name: athlete.name,
            currentCategory: athlete.category,
            correctCategory,
            currentPoints: athlete.points,
            correctPoints,
            totalAchievementPoints,
            needsUpdate,
          });
        }
      });

      return athletesNeedingSync
        .filter(a => a.needsUpdate)
        .sort((a, b) => b.totalAchievementPoints - a.totalAchievementPoints);
    },
  });

  // Mutation para sincronização completa
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!allAthletesForSync || allAthletesForSync.length === 0) {
        throw new Error("Não há atletas para sincronizar");
      }

      const synced: SyncedAthlete[] = [];

      for (const athlete of allAthletesForSync) {
        const { error: updateError } = await supabase
          .from("athletes")
          .update({ 
            category: athlete.correctCategory as "C" | "D" | "Iniciante",
            points: athlete.correctPoints 
          })
          .eq("id", athlete.id);

        if (updateError) {
          console.error(`Erro ao sincronizar atleta ${athlete.id}:`, updateError);
          continue;
        }

        synced.push({
          id: athlete.id,
          name: athlete.name,
          oldCategory: athlete.currentCategory,
          newCategory: athlete.correctCategory,
          oldPoints: athlete.currentPoints,
          newPoints: athlete.correctPoints,
          promoted: athlete.currentCategory !== athlete.correctCategory,
        });
      }

      return synced;
    },
    onSuccess: (synced) => {
      setSyncedAthletes(synced);
      setShowSyncReport(true);
      setIsSyncing(false);
      queryClient.invalidateQueries({ queryKey: ["all-athletes-for-sync"] });
      queryClient.invalidateQueries({ queryKey: ["athletes-with-mismatched-points"] });
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      queryClient.invalidateQueries({ queryKey: ["ranking-athletes"] });
      queryClient.invalidateQueries({ queryKey: ["offline-athletes"] });

      toast({
        title: "Sincronização concluída com sucesso!",
        description: `${synced.length} atleta(s) foram atualizados.`,
      });
    },
    onError: (error: any) => {
      setIsSyncing(false);
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para recalcular pontuações (somente pontos, não categoria)
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      if (!mismatchedAthletes || mismatchedAthletes.length === 0) {
        throw new Error("Não há atletas para recalcular");
      }

      const recalculated: RecalculatedAthlete[] = [];

      for (const athlete of mismatchedAthletes) {
        const { error: updateError } = await supabase
          .from("athletes")
          .update({ points: athlete.calculatedPoints })
          .eq("id", athlete.id);

        if (updateError) {
          console.error(`Erro ao recalcular atleta ${athlete.id}:`, updateError);
          continue;
        }

        recalculated.push({
          id: athlete.id,
          name: athlete.name,
          category: athlete.category,
          oldPoints: athlete.currentPoints,
          newPoints: athlete.calculatedPoints,
        });
      }

      return recalculated;
    },
    onSuccess: (recalculated) => {
      setRecalculatedAthletes(recalculated);
      setShowRecalculateReport(true);
      setIsRecalculating(false);
      queryClient.invalidateQueries({ queryKey: ["athletes-with-mismatched-points"] });
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      queryClient.invalidateQueries({ queryKey: ["ranking-athletes"] });
      queryClient.invalidateQueries({ queryKey: ["offline-athletes"] });

      toast({
        title: "Pontuações recalculadas com sucesso!",
        description: `${recalculated.length} atleta(s) tiveram suas pontuações atualizadas.`,
      });
    },
    onError: (error: any) => {
      setIsRecalculating(false);
      toast({
        title: "Erro no recálculo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para reverter as categorias
  const revertMutation = useMutation({
    mutationFn: async () => {
      if (!affectedAthletes || affectedAthletes.length === 0) {
        throw new Error("Não há atletas para reverter");
      }

      const reverted: RevertedAthlete[] = [];
      const latestChangeByAthlete = new Map<string, CategoryHistoryWithAthlete>();
      
      for (const change of affectedAthletes) {
        const existing = latestChangeByAthlete.get(change.athlete_id);
        if (!existing || new Date(change.changed_at) > new Date(existing.changed_at)) {
          latestChangeByAthlete.set(change.athlete_id, change);
        }
      }

      for (const [athleteId, lastChange] of latestChangeByAthlete) {
        const { data: currentAthlete, error: fetchError } = await supabase
          .from("athletes")
          .select("*")
          .eq("id", athleteId)
          .single();

        if (fetchError || !currentAthlete) {
          console.error(`Erro ao buscar atleta ${athleteId}:`, fetchError);
          continue;
        }

        if (currentAthlete.category === lastChange.new_category) {
          const { error: updateError } = await supabase
            .from("athletes")
            .update({
              category: lastChange.old_category,
              points: lastChange.points_at_change,
            })
            .eq("id", athleteId);

          if (updateError) {
            console.error(`Erro ao reverter atleta ${athleteId}:`, updateError);
            continue;
          }

          const { error: deleteError } = await supabase
            .from("category_history")
            .delete()
            .eq("id", lastChange.id);

          if (deleteError) {
            console.error(`Erro ao remover histórico ${lastChange.id}:`, deleteError);
          }

          reverted.push({
            id: athleteId,
            name: lastChange.athlete_name || currentAthlete.name,
            categoryBefore: lastChange.new_category,
            categoryAfter: lastChange.old_category,
            pointsRestored: lastChange.points_at_change,
          });
        }
      }

      return reverted;
    },
    onSuccess: (reverted) => {
      setRevertedAthletes(reverted);
      setShowReport(true);
      setIsReverting(false);
      queryClient.invalidateQueries({ queryKey: ["affected-athletes-for-revert"] });
      queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });
      queryClient.invalidateQueries({ queryKey: ["category-history"] });
      
      toast({
        title: "Reversão concluída com sucesso!",
        description: `${reverted.length} atleta(s) foram revertidos para suas categorias anteriores.`,
      });
    },
    onError: (error: any) => {
      setIsReverting(false);
      toast({
        title: "Erro na reversão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRevert = () => {
    setIsReverting(true);
    revertMutation.mutate();
  };

  const handleRecalculate = () => {
    setIsRecalculating(true);
    recalculateMutation.mutate();
  };

  const handleSync = () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "C": return "bg-amber-500 hover:bg-amber-600";
      case "D": return "bg-blue-500 hover:bg-blue-600";
      case "Iniciante": return "bg-green-500 hover:bg-green-600";
      default: return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const uniqueAthletesCount = affectedAthletes 
    ? new Set(affectedAthletes.map(a => a.athlete_id)).size 
    : 0;

  const promotedCount = syncedAthletes.filter(a => a.promoted).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <BackButton />
        
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
              <RotateCcw className="w-8 h-8 text-primary" />
              Gestão de Categorias e Pontuações
            </h1>
            <p className="text-muted-foreground">
              Gerencie sincronização, recálculo de pontuações e reversão de categorias
            </p>
          </div>

          <Tabs defaultValue="sync" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sync" className="gap-2">
                <Zap className="w-4 h-4" />
                Sincronização Completa
              </TabsTrigger>
              <TabsTrigger value="recalculate" className="gap-2">
                <Calculator className="w-4 h-4" />
                Recalcular Pontos
              </TabsTrigger>
              <TabsTrigger value="revert" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reverter Categorias
              </TabsTrigger>
            </TabsList>

            {/* Tab de Sincronização Completa */}
            <TabsContent value="sync" className="space-y-6">
              {/* Aviso sobre sincronização */}
              <Card className="border-purple-500/50 bg-purple-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-600">
                    <Zap className="w-5 h-5" />
                    Sincronização Completa de Pontos e Categorias
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>Esta funcionalidade irá analisar <strong>todo o histórico de torneios</strong> e:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Calcular a soma total de pontos de cada atleta</li>
                    <li>Determinar a categoria correta baseada nas regras vigentes</li>
                    <li>Atualizar automaticamente pontos e categorias</li>
                  </ul>
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg mt-4">
                    <p className="font-semibold text-purple-700 dark:text-purple-300">📊 Regras de Promoção:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                      <li><strong>Iniciante → D:</strong> ao acumular 160 pontos</li>
                      <li><strong>D → C:</strong> ao acumular 300 pontos na categoria D</li>
                      <li><strong>Categoria C:</strong> máxima da região (não pontua mais)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Estatísticas de sincronização */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-full">
                        <Users className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Atletas Desatualizados</p>
                        <p className="text-2xl font-bold">{allAthletesForSync?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-full">
                        <ArrowRight className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Precisam Subir Categoria</p>
                        <p className="text-2xl font-bold">
                          {allAthletesForSync?.filter(a => a.currentCategory !== a.correctCategory).length || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">
                          {showSyncReport ? "Sincronização Concluída" : "Aguardando Ação"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela de Atletas para Sincronização */}
              <Card>
                <CardHeader>
                  <CardTitle>Atletas que Precisam de Atualização</CardTitle>
                  <CardDescription>
                    Lista de atletas cujas categorias ou pontos não correspondem ao histórico de torneios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSync ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Analisando histórico de torneios...
                    </div>
                  ) : !allAthletesForSync || allAthletesForSync.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-green-600">Tudo sincronizado!</p>
                      <p className="text-sm mt-2">Todos os atletas estão com pontos e categorias corretos.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Atleta</TableHead>
                            <TableHead>Categoria Atual</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead>Categoria Correta</TableHead>
                            <TableHead className="text-right">Pontos Atuais</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead className="text-right">Pontos Corretos</TableHead>
                            <TableHead className="text-right">Total Acumulado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allAthletesForSync.slice(0, 50).map((athlete) => (
                            <TableRow key={athlete.id} className={athlete.currentCategory !== athlete.correctCategory ? "bg-orange-500/5" : ""}>
                              <TableCell className="font-medium">{athlete.name}</TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.currentCategory)}>
                                  {athlete.currentCategory}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {athlete.currentCategory !== athlete.correctCategory ? (
                                  <ArrowRight className="w-4 h-4 text-orange-500 mx-auto" />
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.correctCategory)}>
                                  {athlete.correctCategory}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-red-500 font-semibold">
                                {athlete.currentPoints} pts
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
                              </TableCell>
                              <TableCell className="text-right text-green-500 font-semibold">
                                {athlete.correctPoints} pts
                              </TableCell>
                              <TableCell className="text-right text-purple-500 font-semibold">
                                {athlete.totalAchievementPoints} pts
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {allAthletesForSync.length > 50 && (
                        <p className="text-center text-muted-foreground mt-4 text-sm">
                          Mostrando 50 de {allAthletesForSync.length} atletas
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Botão de Sincronização */}
              {!showSyncReport && allAthletesForSync && allAthletesForSync.length > 0 && (
                <div className="flex justify-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="lg" 
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                        disabled={isSyncing}
                      >
                        <Zap className="w-5 h-5" />
                        Sincronizar {allAthletesForSync.length} Atletas
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-purple-500" />
                          Confirmar Sincronização
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>Você está prestes a sincronizar pontos e categorias de todos os atletas.</p>
                          
                          <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                            <p><strong>Esta ação irá:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Atualizar {allAthletesForSync.length} atleta(s)</li>
                              <li>Promover {allAthletesForSync.filter(a => a.currentCategory !== a.correctCategory).length} atleta(s) de categoria</li>
                              <li>Recalcular pontos baseado no histórico de torneios</li>
                            </ul>
                          </div>
                          
                          <p className="text-purple-600 font-semibold">
                            ✅ Esta operação garante que todos os atletas estejam com categoria e pontos corretos.
                          </p>
                          
                          <p>Deseja prosseguir com a sincronização?</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleSync}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Sim, Sincronizar Agora
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Relatório Pós-Sincronização */}
              {showSyncReport && syncedAthletes.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Relatório de Sincronização
                    </CardTitle>
                    <CardDescription>
                      Sincronização concluída com base no histórico de torneios.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-background rounded-lg border">
                        <p className="text-3xl font-bold text-primary">{syncedAthletes.length}</p>
                        <p className="text-sm text-muted-foreground">Atletas Atualizados</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-lg border">
                        <p className="text-3xl font-bold text-orange-500">{promotedCount}</p>
                        <p className="text-sm text-muted-foreground">Promoções de Categoria</p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Atleta</TableHead>
                            <TableHead>Categoria Anterior</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead>Categoria Nova</TableHead>
                            <TableHead className="text-right">Pontos Anteriores</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead className="text-right">Pontos Novos</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {syncedAthletes.map((athlete) => (
                            <TableRow key={athlete.id} className={athlete.promoted ? "bg-orange-500/10" : ""}>
                              <TableCell className="font-medium">
                                {athlete.name}
                                {athlete.promoted && (
                                  <Badge className="ml-2 bg-orange-500">Promovido!</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.oldCategory)}>
                                  {athlete.oldCategory}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className={`w-4 h-4 mx-auto ${athlete.promoted ? "text-orange-500" : "text-muted-foreground"}`} />
                              </TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.newCategory)}>
                                  {athlete.newCategory}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {athlete.oldPoints} pts
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className="w-4 h-4 text-green-500 mx-auto" />
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {athlete.newPoints} pts
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                      <p className="text-green-700 dark:text-green-300 font-semibold">
                        ✅ Sincronização concluída com sucesso. O sistema está atualizado conforme as regras vigentes.
                      </p>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowSyncReport(false);
                          setSyncedAthletes([]);
                          refetchSync();
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Verificar Novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab de Recálculo de Pontuações */}
            <TabsContent value="recalculate" className="space-y-6">
              <Card className="border-blue-500/50 bg-blue-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Calculator className="w-5 h-5" />
                    Recálculo de Pontuações (Apenas Pontos)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>Esta funcionalidade irá apenas recalcular pontos, sem alterar categorias:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Identificar atletas com pontuação inconsistente</li>
                    <li>Recalcular a pontuação baseada no histórico de achievements</li>
                    <li>Atualizar a pontuação atual de cada atleta afetado</li>
                  </ul>
                  <p className="font-semibold text-blue-700">
                    ℹ️ Use "Sincronização Completa" para também atualizar categorias automaticamente.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500/10 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Atletas com Discrepância</p>
                        <p className="text-2xl font-bold">{mismatchedAthletes?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-full">
                        <Calculator className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Pontos a Restaurar</p>
                        <p className="text-2xl font-bold">
                          {mismatchedAthletes?.reduce((acc, a) => acc + Math.abs(a.difference), 0) || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">
                          {showRecalculateReport ? "Recálculo Concluído" : "Aguardando Ação"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Atletas com Pontuação Inconsistente</CardTitle>
                  <CardDescription>
                    Lista de atletas cujos pontos atuais não correspondem ao histórico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingMismatched ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando dados...
                    </div>
                  ) : !mismatchedAthletes || mismatchedAthletes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-semibold text-green-600">Todas as pontuações estão corretas!</p>
                      <p className="text-sm mt-2">Nenhum atleta encontrado com discrepância de pontos.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Atleta</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Pontos Atuais</TableHead>
                            <TableHead className="text-right">Pontos Calculados</TableHead>
                            <TableHead className="text-right">Diferença</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mismatchedAthletes.slice(0, 50).map((athlete) => (
                            <TableRow key={athlete.id}>
                              <TableCell className="font-medium">{athlete.name}</TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.category)}>
                                  {athlete.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-red-500 font-semibold">
                                {athlete.currentPoints} pts
                              </TableCell>
                              <TableCell className="text-right text-green-500 font-semibold">
                                {athlete.calculatedPoints} pts
                              </TableCell>
                              <TableCell className="text-right text-blue-500 font-semibold">
                                {athlete.difference > 0 ? "+" : ""}{athlete.difference} pts
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {mismatchedAthletes.length > 50 && (
                        <p className="text-center text-muted-foreground mt-4 text-sm">
                          Mostrando 50 de {mismatchedAthletes.length} atletas
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {!showRecalculateReport && mismatchedAthletes && mismatchedAthletes.length > 0 && (
                <div className="flex justify-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="lg" 
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                        disabled={isRecalculating}
                      >
                        <Calculator className="w-5 h-5" />
                        Recalcular Pontuações de {mismatchedAthletes.length} Atletas
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-blue-500" />
                          Confirmar Recálculo
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>Você está prestes a recalcular as pontuações dos atletas.</p>
                          
                          <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                            <p><strong>Esta ação irá:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Atualizar a pontuação de {mismatchedAthletes.length} atleta(s)</li>
                              <li>Usar o histórico de achievements como base do cálculo</li>
                            </ul>
                          </div>
                          
                          <p className="text-blue-600 font-semibold">
                            ✅ Esta operação é segura e idempotente.
                          </p>
                          
                          <p>Deseja prosseguir com o recálculo?</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRecalculate}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Sim, Recalcular Agora
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {showRecalculateReport && recalculatedAthletes.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Relatório de Recálculo
                    </CardTitle>
                    <CardDescription>
                      Pontuações recalculadas com sucesso.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-lg font-semibold">
                        Total de atletas recalculados: <span className="text-primary">{recalculatedAthletes.length}</span>
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Atleta</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="text-right">Pontos Anteriores</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead className="text-right">Pontos Atualizados</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recalculatedAthletes.map((athlete) => (
                            <TableRow key={athlete.id}>
                              <TableCell className="font-medium">{athlete.name}</TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.category)}>
                                  {athlete.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right text-red-500">
                                {athlete.oldPoints} pts
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className="w-4 h-4 text-green-500 mx-auto" />
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                {athlete.newPoints} pts
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                      <p className="text-green-700 dark:text-green-300 font-semibold">
                        ✅ Pontuações recalculadas com sucesso.
                      </p>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowRecalculateReport(false);
                          setRecalculatedAthletes([]);
                          refetchMismatched();
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Verificar Novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab de Reversão de Categorias */}
            <TabsContent value="revert" className="space-y-6">
              <Card className="border-amber-500/50 bg-amber-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                    Atenção - Leia antes de prosseguir
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>Esta ação irá:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Reverter as categorias dos atletas para o estado anterior à subida automática</li>
                    <li>Restaurar a pontuação que cada atleta possuía antes da mudança</li>
                    <li>Remover os registros de histórico das mudanças revertidas</li>
                  </ul>
                  <p className="font-semibold text-amber-700">
                    ⚠️ Esta ação é irreversível após confirmada. Os dados serão permanentemente alterados.
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Atletas Afetados</p>
                        <p className="text-2xl font-bold">{uniqueAthletesCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-full">
                        <History className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Registros no Histórico</p>
                        <p className="text-2xl font-bold">{affectedAthletes?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500/10 rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="text-lg font-semibold">
                          {showReport ? "Reversão Concluída" : "Aguardando Ação"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Atletas que Subiram de Categoria Automaticamente</CardTitle>
                  <CardDescription>
                    Lista de atletas identificados no histórico de mudanças de categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando dados...
                    </div>
                  ) : !affectedAthletes || affectedAthletes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum atleta encontrado no histórico de mudanças de categoria.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Atleta</TableHead>
                            <TableHead>Categoria Anterior</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead>Nova Categoria</TableHead>
                            <TableHead>Pontos na Mudança</TableHead>
                            <TableHead>Data da Mudança</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {affectedAthletes.map((athlete) => (
                            <TableRow key={athlete.id}>
                              <TableCell className="font-medium">{athlete.athlete_name}</TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.old_category)}>
                                  {athlete.old_category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className="w-4 h-4 text-muted-foreground mx-auto" />
                              </TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.new_category)}>
                                  {athlete.new_category}
                                </Badge>
                              </TableCell>
                              <TableCell>{athlete.points_at_change} pts</TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(athlete.changed_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!showReport && affectedAthletes && affectedAthletes.length > 0 && (
                <div className="flex justify-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="lg" 
                        variant="destructive"
                        className="gap-2"
                        disabled={isReverting}
                      >
                        <RotateCcw className="w-5 h-5" />
                        Reverter Atualização Automática de Categorias
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          Confirmar Reversão
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>Você está prestes a reverter a atualização automática de categorias.</p>
                          
                          <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                            <p><strong>Esta ação irá:</strong></p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Reverter {uniqueAthletesCount} atleta(s) para suas categorias anteriores</li>
                              <li>Restaurar as pontuações originais de cada atleta</li>
                              <li>Remover os registros de histórico correspondentes</li>
                            </ul>
                          </div>
                          
                          <p className="text-destructive font-semibold">
                            ⚠️ Esta ação é IRREVERSÍVEL após confirmada!
                          </p>
                          
                          <p>Deseja realmente prosseguir?</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRevert}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Sim, Reverter Agora
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {showReport && revertedAthletes.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Reversão Concluída
                    </CardTitle>
                    <CardDescription>
                      O sistema voltou às configurações anteriores.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-lg font-semibold">
                        Total de atletas revertidos: <span className="text-primary">{revertedAthletes.length}</span>
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Atleta</TableHead>
                            <TableHead>Categoria Antes</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead>Categoria Após</TableHead>
                            <TableHead>Pontos Restaurados</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revertedAthletes.map((athlete) => (
                            <TableRow key={athlete.id}>
                              <TableCell className="font-medium">{athlete.name}</TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.categoryBefore)}>
                                  {athlete.categoryBefore}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className="w-4 h-4 text-green-500 mx-auto" />
                              </TableCell>
                              <TableCell>
                                <Badge className={getCategoryBadgeColor(athlete.categoryAfter)}>
                                  {athlete.categoryAfter}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-green-600">
                                {athlete.pointsRestored} pts
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                      <p className="text-green-700 dark:text-green-300 font-semibold">
                        ✅ Reversão concluída com sucesso. O sistema voltou às configurações anteriores.
                      </p>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowReport(false);
                          setRevertedAthletes([]);
                          refetch();
                        }}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Verificar Novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ReversaoCategoria;
