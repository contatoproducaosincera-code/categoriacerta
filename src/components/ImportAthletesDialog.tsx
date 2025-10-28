import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AthleteRow {
  nome: string;
  cidade: string;
  categoria?: string;
  email?: string;
  instagram?: string;
}

const ImportAthletesDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<AthleteRow[]>([]);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Preview dos dados
    try {
      const data = await parseFile(selectedFile);
      setPreview(data.slice(0, 5)); // Mostrar apenas 5 primeiros
    } catch (error) {
      toast({
        title: "Erro ao ler arquivo",
        description: "Verifique se o arquivo está no formato correto",
        variant: "destructive",
      });
    }
  };

  const parseFile = async (file: File): Promise<AthleteRow[]> => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();

    if (fileExtension === "csv") {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as any[];
            const mapped = data.map((row) => ({
              nome: row.nome || row.Nome || row.name || "",
              cidade: row.cidade || row.Cidade || row.city || row.local || row.Local || "",
              categoria: row.categoria || row.Categoria || row.category || "",
              email: row.email || row.Email || "",
              instagram: row.instagram || row.Instagram || "",
            }));
            resolve(mapped);
          },
          error: (error) => reject(error),
        });
      });
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
            
            const mapped = jsonData.map((row) => ({
              nome: row.nome || row.Nome || row.name || "",
              cidade: row.cidade || row.Cidade || row.city || row.local || row.Local || "",
              categoria: row.categoria || row.Categoria || row.category || "",
              email: row.email || row.Email || "",
              instagram: row.instagram || row.Instagram || "",
            }));
            resolve(mapped);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
        reader.readAsArrayBuffer(file);
      });
    }

    throw new Error("Formato de arquivo não suportado");
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      const athletes = await parseFile(file);

      // Validar dados
      const validAthletes = athletes.filter(
        (athlete) => athlete.nome && athlete.cidade
      );

      if (validAthletes.length === 0) {
        toast({
          title: "Nenhum atleta válido",
          description: "Certifique-se de que as colunas 'nome' e 'cidade' estão preenchidas",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Inserir no banco de dados
      const validCategories = ["A", "B", "C", "D", "Iniciante"] as const;
      type ValidCategory = typeof validCategories[number];

      const athletesToInsert = validAthletes.map((athlete) => {
        const category = athlete.categoria || "Iniciante";
        const validCategory: ValidCategory = validCategories.includes(category as any) 
          ? (category as ValidCategory)
          : "Iniciante";

        return {
          name: athlete.nome,
          city: athlete.cidade,
          category: validCategory,
          email: athlete.email || null,
          instagram: athlete.instagram || null,
          points: 0,
        };
      });

      const { error } = await supabase
        .from("athletes")
        .insert(athletesToInsert);

      if (error) throw error;

      toast({
        title: "Importação concluída!",
        description: `${validAthletes.length} atletas foram cadastrados com sucesso`,
      });

      setOpen(false);
      setFile(null);
      setPreview([]);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
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
          <Upload className="h-4 w-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Atletas via Planilha
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo Excel (.xlsx, .xls) ou CSV com os dados dos atletas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> A planilha deve conter as colunas:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>nome</strong> (obrigatório)</li>
                <li><strong>cidade</strong> (obrigatório)</li>
                <li>categoria (opcional, padrão: Iniciante)</li>
                <li>email (opcional)</li>
                <li>instagram (opcional)</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="file">Selecione o arquivo</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="mt-2"
            />
          </div>

          {preview.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-semibold mb-2 text-sm">
                Preview (primeiros 5 registros):
              </h4>
              <div className="space-y-2">
                {preview.map((athlete, index) => (
                  <div
                    key={index}
                    className="text-xs p-2 bg-background rounded border"
                  >
                    <div><strong>Nome:</strong> {athlete.nome}</div>
                    <div><strong>Cidade:</strong> {athlete.cidade}</div>
                    {athlete.categoria && (
                      <div><strong>Categoria:</strong> {athlete.categoria}</div>
                    )}
                    {athlete.email && (
                      <div><strong>Email:</strong> {athlete.email}</div>
                    )}
                    {athlete.instagram && (
                      <div><strong>Instagram:</strong> {athlete.instagram}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleImport}
            disabled={!file || isProcessing}
          >
            {isProcessing ? "Importando..." : "Importar Atletas"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAthletesDialog;
