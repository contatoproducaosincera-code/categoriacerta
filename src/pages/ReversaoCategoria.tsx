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
import { RotateCcw, AlertTriangle, CheckCircle2, History, Users, ArrowRight, Calculator, RefreshCw } from "lucide-react";
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

const ReversaoCategoria = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [revertedAthletes, setRevertedAthletes] = useState<RevertedAthlete[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [recalculatedAthletes, setRecalculatedAthletes] = useState<RecalculatedAthlete[]>([]);
  const [showRecalculateReport, setShowRecalculateReport] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

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

  // Buscar atletas com pontuação inconsistente (pontos zerados mas com achievements)
  const { data: mismatchedAthletes, isLoading: isLoadingMismatched, refetch: refetchMismatched } = useQuery({
    queryKey: ["athletes-with-mismatched-points"],
    queryFn: async () => {
      // Buscar todos os atletas
      const { data: athletes, error: athletesError } = await supabase
        .from("athletes")
        .select("id, name, category, points");

      if (athletesError) throw athletesError;

      // Buscar todos os achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("athlete_id, points_awarded");

      if (achievementsError) throw achievementsError;

      // Calcular pontos totais por atleta baseado em achievements
      const pointsByAthlete = new Map<string, number>();
      achievements?.forEach(ach => {
        const current = pointsByAthlete.get(ach.athlete_id) || 0;
        pointsByAthlete.set(ach.athlete_id, current + ach.points_awarded);
      });

      // Identificar atletas com discrepância de pontos
      const mismatched: AthleteWithMismatchedPoints[] = [];
      athletes?.forEach(athlete => {
        const calculatedPoints = pointsByAthlete.get(athlete.id) || 0;
        // Só mostrar atletas que têm achievements mas pontos zerados ou incorretos
        if (calculatedPoints > 0 && athlete.points !== calculatedPoints) {
          mismatched.push({
            id: athlete.id,
            name: athlete.name,
            category: athlete.category,
            currentPoints: athlete.points,
            calculatedPoints: calculatedPoints,
            difference: calculatedPoints - athlete.points,
          });
        }
      });

      // Ordenar por maior diferença
      return mismatched.sort((a, b) => b.difference - a.difference);
    },
  });

  // Mutation para recalcular pontuações
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      if (!mismatchedAthletes || mismatchedAthletes.length === 0) {
        throw new Error("Não há atletas para recalcular");
      }

      const recalculated: RecalculatedAthlete[] = [];

      for (const athlete of mismatchedAthletes) {
        // Atualizar a pontuação do atleta
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
              Gerencie reversões de categorias e recálculo de pontuações do sistema
            </p>
          </div>

          <Tabs defaultValue="recalculate" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recalculate" className="gap-2">
                <Calculator className="w-4 h-4" />
                Recalcular Pontuações
              </TabsTrigger>
              <TabsTrigger value="revert" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Reverter Categorias
              </TabsTrigger>
            </TabsList>

            {/* Tab de Recálculo de Pontuações */}
            <TabsContent value="recalculate" className="space-y-6">
              {/* Aviso sobre recálculo */}
              <Card className="border-blue-500/50 bg-blue-500/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Calculator className="w-5 h-5" />
                    Recálculo de Pontuações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>Esta funcionalidade irá:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Identificar atletas com pontuação inconsistente (zerada ou incorreta)</li>
                    <li>Recalcular a pontuação baseada no histórico de achievements</li>
                    <li>Atualizar a pontuação atual de cada atleta afetado</li>
                    <li>Garantir que o ranking exiba os valores corretos</li>
                  </ul>
                  <p className="font-semibold text-blue-700">
                    ℹ️ O histórico de achievements é usado como fonte da verdade para o cálculo.
                  </p>
                </CardContent>
              </Card>

              {/* Estatísticas de recálculo */}
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
                          {mismatchedAthletes?.reduce((acc, a) => acc + a.difference, 0) || 0}
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

              {/* Tabela de Atletas com Discrepância */}
              <Card>
                <CardHeader>
                  <CardTitle>Atletas com Pontuação Inconsistente</CardTitle>
                  <CardDescription>
                    Lista de atletas cujos pontos atuais não correspondem ao histórico de achievements
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
                                +{athlete.difference} pts
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

              {/* Botão de Recálculo */}
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
                              <li>Restaurar um total de {mismatchedAthletes.reduce((acc, a) => acc + a.difference, 0)} pontos</li>
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

              {/* Relatório Pós-Recálculo */}
              {showRecalculateReport && recalculatedAthletes.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Relatório de Recálculo
                    </CardTitle>
                    <CardDescription>
                      Pontuações recalculadas com sucesso a partir do histórico.
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
                        ✅ Pontuações recalculadas com sucesso a partir do histórico.
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
              {/* Aviso Importante */}
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

              {/* Estatísticas */}
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

              {/* Tabela de Atletas Afetados */}
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

              {/* Botão de Reversão */}
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

              {/* Relatório Pós-Reversão */}
              {showReport && revertedAthletes.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Relatório de Reversão
                    </CardTitle>
                    <CardDescription>
                      Reversão concluída com sucesso. O sistema voltou às configurações anteriores.
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
                            <TableHead>Categoria Antes da Reversão</TableHead>
                            <TableHead className="text-center">→</TableHead>
                            <TableHead>Categoria Após Reversão</TableHead>
                            <TableHead>Pontuação Restaurada</TableHead>
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
                      >
                        Verificar Novamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {showReport && revertedAthletes.length === 0 && (
                <Card className="border-amber-500/50 bg-amber-500/10">
                  <CardContent className="pt-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-amber-700">
                      Nenhum atleta foi revertido
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Os atletas podem já ter sido revertidos anteriormente ou suas categorias atuais 
                      não correspondem ao histórico registrado.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setShowReport(false);
                        refetch();
                      }}
                    >
                      Verificar Novamente
                    </Button>
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
