import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, Trash2, CheckCircle2, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { athleteSchema } from "@/lib/validations";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type ImportReport = {
  imported: number;
  updated: number;
  ignored: number;
  errors: string[];
};

type DuplicateStrategy = "skip" | "update" | "create";

const ImportAthletesDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [workbookData, setWorkbookData] = useState<any>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("skip");
  const [showReport, setShowReport] = useState(false);
  const [importReport, setImportReport] = useState<ImportReport | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos .xlsx, .xls ou .csv são aceitos",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "csv") {
        const athletes = await parseCSV(file);
        setPreviewRows(athletes.slice(0, 100));
        setSheets([]);
        setSelectedSheet("");
      } else {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        setWorkbookData(wb);
        setSheets(wb.SheetNames);
        
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          loadSheetData(wb, firstSheet);
        }
      }
    } catch (error: any) {
      console.error("Erro ao ler arquivo:", error);
      toast({
        title: "Erro ao ler arquivo",
        description: error.message || "Verifique o formato do arquivo",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSheetData = (wb: any, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
    setPreviewRows(json.slice(0, 100));
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbookData) {
      loadSheetData(workbookData, sheetName);
    }
  };

  const handleClear = () => {
    setFileName("");
    setSheets([]);
    setSelectedSheet("");
    setPreviewRows([]);
    setWorkbookData(null);
    const fileInput = document.getElementById("file-import") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleImport = async () => {
    if (previewRows.length === 0) {
      toast({
        title: "Nada para importar",
        description: "Selecione um arquivo com dados válidos",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const report: ImportReport = {
      imported: 0,
      updated: 0,
      ignored: 0,
      errors: [],
    };

    try {
      // Buscar todos os atletas existentes
      const { data: existingAthletes, error: fetchError } = await supabase
        .from("athletes")
        .select("id, name, city, email, points");

      if (fetchError) throw fetchError;

      const athletes = previewRows.map((row: any) => ({
        nome: row.nome || row.Nome || row.name || row.Name || "",
        cidade: row.cidade || row.Cidade || row.city || row.City || "",
        categoria: row.categoria || row.Categoria || row.category || "",
        genero: row.genero || row.Genero || row.gender || row.Gender || "Masculino",
        email: row.email || row.Email || "",
        instagram: row.instagram || row.Instagram || "",
        pontos: row.pontos || row.Pontos || row.points || row.Points || 0,
      }));

      const validAthletes = athletes.filter((a) => a.nome && a.cidade);

      if (validAthletes.length === 0) {
        toast({
          title: "Nenhum atleta válido",
          description: "Certifique-se de que as colunas 'nome' e 'cidade' estão preenchidas",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      for (let i = 0; i < validAthletes.length; i++) {
        const athlete = validAthletes[i];
        try {
          const athleteData = {
            name: athlete.nome.trim(),
            city: athlete.cidade.trim(),
            category: validateCategory(athlete.categoria),
            gender: validateGender(athlete.genero),
            email: athlete.email?.trim() || undefined,
            instagram: athlete.instagram?.trim() || undefined,
            points: parseInt(String(athlete.pontos)) || 0,
          };

          const validated = athleteSchema.parse(athleteData);

          // Verificar duplicados
          const duplicate = existingAthletes?.find(
            (existing) =>
              (existing.name.toLowerCase() === validated.name.toLowerCase() &&
                existing.city.toLowerCase() === validated.city.toLowerCase()) ||
              (validated.email && existing.email?.toLowerCase() === validated.email.toLowerCase())
          );

          if (duplicate) {
            if (duplicateStrategy === "skip") {
              report.ignored++;
              continue;
            } else if (duplicateStrategy === "update") {
              // Atualizar atleta existente
              const { error: updateError } = await supabase
                .from("athletes")
                .update({
                  category: validated.category,
                  gender: validated.gender,
                  email: validated.email || null,
                  instagram: validated.instagram || null,
                  points: duplicate.points + validated.points, // Soma pontos
                })
                .eq("id", duplicate.id);

              if (updateError) throw updateError;
              report.updated++;
            } else {
              // Criar novo mesmo sendo duplicado
              const { error: insertError } = await supabase
                .from("athletes")
                .insert([validated]);

              if (insertError) throw insertError;
              report.imported++;
            }
          } else {
            // Novo atleta
            const { error: insertError } = await supabase
              .from("athletes")
              .insert([validated]);

            if (insertError) throw insertError;
            report.imported++;
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            report.errors.push(`Linha ${i + 1} (${athlete.nome}): ${error.issues[0].message}`);
          } else {
            report.errors.push(`Linha ${i + 1} (${athlete.nome}): ${(error as any).message}`);
          }
        }
      }

      setImportReport(report);
      setShowReport(true);
      onSuccess();
    } catch (error: any) {
      console.error("Erro na importação:", error);
      toast({
        title: "Erro ao importar",
        description: error.message || "Ocorreu um erro durante a importação",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validateCategory = (cat?: string) => {
    const validCats = ["C", "D", "Iniciante"];
    if (!cat) return "Iniciante";
    const normalized = cat.trim();
    return validCats.includes(normalized) ? (normalized as any) : "Iniciante";
  };

  const validateGender = (gender?: string): "Masculino" | "Feminino" => {
    if (!gender) return "Masculino";
    const normalized = gender.trim().toLowerCase();
    if (normalized.includes("fem") || normalized === "f") return "Feminino";
    return "Masculino";
  };

  const handleCloseReport = () => {
    setShowReport(false);
    setImportReport(null);
    setOpen(false);
    handleClear();
  };

  const parseCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as any[]),
        error: reject,
      });
    });
  };

  if (showReport && importReport) {
    return (
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Relatório de Importação
            </DialogTitle>
            <DialogDescription>
              Resumo completo da importação de atletas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <div className="text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {importReport.imported}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Importados
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {importReport.updated}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Atualizados
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800">
                <div className="text-center">
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {importReport.ignored}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Ignorados
                  </div>
                </div>
              </Card>
            </div>

            {importReport.errors.length > 0 && (
              <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-700 dark:text-red-300">
                      Erros Encontrados ({importReport.errors.length})
                    </h4>
                  </div>
                </div>
                <ScrollArea className="h-[200px] w-full">
                  <div className="space-y-1">
                    {importReport.errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-100 dark:bg-red-900 rounded"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={handleCloseReport}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importação em Massa de Atletas
          </DialogTitle>
          <DialogDescription>
            Importe centenas de atletas de uma vez. Suporta .xlsx, .xls e .csv
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-import">Escolha a planilha</Label>
            <Input
              id="file-import"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="mt-2"
            />
            {fileName && (
              <div className="mt-2 text-sm text-muted-foreground">
                Arquivo: <strong>{fileName}</strong>
              </div>
            )}
          </div>

          {sheets.length > 0 && (
            <div>
              <Label htmlFor="sheet-select">Escolha a aba</Label>
              <Select value={selectedSheet} onValueChange={handleSheetChange}>
                <SelectTrigger id="sheet-select" className="mt-2">
                  <SelectValue placeholder="Selecione uma aba" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {sheets.map((sheet) => (
                    <SelectItem key={sheet} value={sheet}>
                      {sheet}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {previewRows.length > 0 && (
            <>
              <div className="border rounded-lg p-4 bg-muted/50">
                <Label className="text-sm font-semibold mb-2 block">
                  Ação para atletas duplicados
                </Label>
                <RadioGroup
                  value={duplicateStrategy}
                  onValueChange={(value) => setDuplicateStrategy(value as DuplicateStrategy)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="skip" id="skip" />
                    <Label htmlFor="skip" className="font-normal cursor-pointer">
                      <strong>Ignorar</strong> - Manter atleta existente sem alterações
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update" id="update" />
                    <Label htmlFor="update" className="font-normal cursor-pointer">
                      <strong>Atualizar</strong> - Atualizar dados e somar pontos do existente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="create" id="create" />
                    <Label htmlFor="create" className="font-normal cursor-pointer">
                      <strong>Criar novo</strong> - Criar entrada separada mesmo sendo duplicado
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="border rounded-lg overflow-hidden bg-card">
                <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
                  <h4 className="font-semibold text-sm">
                    Preview - {previewRows.length} linha(s) detectada(s)
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    Colunas aceitas: nome, cidade, categoria, gênero, email, instagram, pontos
                  </Badge>
                </div>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted z-10">
                      <TableRow>
                        {Object.keys(previewRows[0] || {}).map((header) => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.keys(previewRows[0] || {}).map((key) => (
                            <TableCell key={key} className="text-sm whitespace-nowrap">
                              {String(row[key] || "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            {previewRows.length > 0 && (
              <Button variant="outline" onClick={handleClear}>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
            <Button
              onClick={handleImport}
              disabled={previewRows.length === 0 || isProcessing}
            >
              {isProcessing ? "Processando..." : `Importar ${previewRows.length} Atleta(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAthletesDialog;
