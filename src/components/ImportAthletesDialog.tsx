import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

const ImportAthletesDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const athletes = await parseFile(file);
      const validAthletes = athletes.filter((a) => a.nome && a.cidade);

      if (validAthletes.length === 0) {
        toast({
          title: "Nenhum atleta encontrado",
          description: "Certifique-se de que a planilha tem as colunas 'nome' e 'cidade'",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      const athletesToInsert = validAthletes.map((athlete) => ({
        name: athlete.nome.trim(),
        city: athlete.cidade.trim(),
        category: validateCategory(athlete.categoria),
        email: athlete.email?.trim() || null,
        instagram: athlete.instagram?.trim() || null,
        points: 0,
      }));

      const { error } = await supabase.from("athletes").insert(athletesToInsert);

      if (error) throw error;

      toast({
        title: "✓ Importação concluída!",
        description: `${validAthletes.length} atletas importados com sucesso`,
      });

      setOpen(false);
      e.target.value = "";
      onSuccess();
    } catch (error: any) {
      console.error("Erro na importação:", error);
      toast({
        title: "Erro ao importar",
        description: error.message || "Verifique o formato do arquivo",
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

  const parseFile = async (file: File): Promise<any[]> => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = (results.data as any[]).map((row) => ({
              nome: row.nome || row.Nome || row.name || row.Name || "",
              cidade: row.cidade || row.Cidade || row.city || row.City || "",
              categoria: row.categoria || row.Categoria || row.category || "",
              email: row.email || row.Email || "",
              instagram: row.instagram || row.Instagram || "",
            }));
            resolve(data);
          },
          error: reject,
        });
      });
    }

    if (ext === "xlsx" || ext === "xls") {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
            
            const mapped = jsonData.map((row) => ({
              nome: row.nome || row.Nome || row.name || row.Name || "",
              cidade: row.cidade || row.Cidade || row.city || row.City || "",
              categoria: row.categoria || row.Categoria || row.category || "",
              email: row.email || row.Email || "",
              instagram: row.instagram || row.Instagram || "",
            }));
            resolve(mapped);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    throw new Error("Formato não suportado. Use .csv, .xlsx ou .xls");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Atletas
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV, XLSX ou XLS com os dados dos atletas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p className="mb-2"><strong>Colunas obrigatórias:</strong> nome, cidade</p>
                <p><strong>Opcionais:</strong> categoria, email, instagram</p>
              </div>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="mt-2"
              />
            </div>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span>Processando arquivo...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportAthletesDialog;
