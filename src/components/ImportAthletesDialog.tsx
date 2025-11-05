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
import { Upload, FileSpreadsheet, Trash2 } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { athleteSchema } from "@/lib/validations";
import { z } from "zod";

const ImportAthletesDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [workbookData, setWorkbookData] = useState<any>(null);
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

    try {
      const athletes = previewRows.map((row: any) => ({
        nome: row.nome || row.Nome || row.name || row.Name || "",
        cidade: row.cidade || row.Cidade || row.city || row.City || "",
        categoria: row.categoria || row.Categoria || row.category || "",
        genero: row.genero || row.Genero || row.gender || row.Gender || "Masculino",
        email: row.email || row.Email || "",
        instagram: row.instagram || row.Instagram || "",
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

      // Validate each athlete before insertion
      const athletesToInsert = [];
      const validationErrors = [];

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
            points: 0,
          };
          
          const validated = athleteSchema.parse(athleteData);
          athletesToInsert.push(validated);
        } catch (error) {
          if (error instanceof z.ZodError) {
            validationErrors.push(`Linha ${i + 1}: ${error.issues[0].message}`);
          }
        }
      }

      if (validationErrors.length > 0 && athletesToInsert.length === 0) {
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

      const successMessage = validationErrors.length > 0
        ? `${athletesToInsert.length} atletas importados. ${validationErrors.length} linhas ignoradas por erros de validação.`
        : `${validAthletes.length} atletas importados com sucesso`;

      toast({
        title: "✓ Importação concluída!",
        description: successMessage,
      });

      setOpen(false);
      handleClear();
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
    const validCats = ["A", "B", "C", "D", "Iniciante"];
    if (!cat) return "Iniciante";
    const normalized = cat.trim();
    return validCats.includes(normalized) ? normalized as any : "Iniciante";
  };
  
  const validateGender = (gender?: string): "Masculino" | "Feminino" => {
    if (!gender) return "Masculino";
    const normalized = gender.trim().toLowerCase();
    if (normalized.includes("fem") || normalized === "f") return "Feminino";
    return "Masculino";
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
            Importador de Planilhas
          </DialogTitle>
          <DialogDescription>
            Importe atletas em lote de arquivos .xlsx, .xls ou .csv
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
              <div className="mt-2 text-sm text-muted-foreground">
                Linhas exibidas: <strong>{previewRows.length}</strong>
              </div>
            </div>
          )}

          {previewRows.length > 0 && (
            <div className="border rounded-lg overflow-hidden bg-card">
              <div className="bg-muted px-4 py-2 border-b">
                <h4 className="font-semibold text-sm">
                  Preview (primeiras {previewRows.length} linhas)
                </h4>
              </div>
              <div className="overflow-auto max-h-[300px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      {Object.keys(previewRows[0] || {}).map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">{header}</TableHead>
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
              </div>
            </div>
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
              {isProcessing ? "Importando..." : "Confirmar Importação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAthletesDialog;
