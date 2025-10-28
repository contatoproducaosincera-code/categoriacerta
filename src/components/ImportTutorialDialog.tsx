import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Download, Upload, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ImportTutorialDialog = () => {
  const handleDownloadTemplate = () => {
    const headers = ["nome", "cidade", "categoria", "email", "instagram"];
    const exampleData = [
      ["João Silva", "Rio de Janeiro", "Iniciante", "joao@email.com", "@joaosilva"],
      ["Maria Santos", "São Paulo", "C", "maria@email.com", "@mariasantos"],
      ["Pedro Costa", "Belo Horizonte", "B", "pedro@email.com", "@pedrocosta"]
    ];
    
    let csvContent = headers.join(",") + "\n";
    exampleData.forEach(row => {
      csvContent += row.map(field => `"${field}"`).join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_atletas.csv";
    link.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="mr-2 h-4 w-4" />
          Como Importar?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Upload className="h-5 w-5 text-primary" />
            Tutorial: Importar Atletas em Lote
          </DialogTitle>
          <DialogDescription>
            Aprenda a cadastrar múltiplos atletas de uma vez usando planilhas Excel ou CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Passo 1 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Prepare sua Planilha</h3>
                  <p className="text-muted-foreground mb-3">
                    Sua planilha deve conter as seguintes colunas (em qualquer ordem):
                  </p>
                  <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <strong>nome</strong> - Nome completo do atleta (obrigatório)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <strong>cidade</strong> - Cidade do atleta (obrigatório)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <strong>categoria</strong> - A, B, C, D ou Iniciante (opcional, padrão: Iniciante)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <strong>email</strong> - Email para notificações (opcional)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <strong>instagram</strong> - Usuário do Instagram (opcional)
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Planilha Modelo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passo 2 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Formatos Aceitos</h3>
                  <p className="text-muted-foreground mb-3">
                    O sistema aceita arquivos nos seguintes formatos:
                  </p>
                  <div className="flex gap-3">
                    <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-md">
                      <span className="font-medium text-green-700">.xlsx</span>
                      <span className="text-xs text-green-600 ml-2">(Excel)</span>
                    </div>
                    <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-md">
                      <span className="font-medium text-green-700">.xls</span>
                      <span className="text-xs text-green-600 ml-2">(Excel Antigo)</span>
                    </div>
                    <div className="bg-green-50 border border-green-200 px-3 py-2 rounded-md">
                      <span className="font-medium text-green-700">.csv</span>
                      <span className="text-xs text-green-600 ml-2">(Texto)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passo 3 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Faça o Upload</h3>
                  <p className="text-muted-foreground mb-3">
                    Clique no botão <strong>"Importar Atletas"</strong> no painel administrativo e selecione seu arquivo.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    O sistema irá:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Validar todos os dados</li>
                    <li>Identificar e reportar erros</li>
                    <li>Cadastrar apenas atletas válidos</li>
                    <li>Exibir um resumo do processo</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Alert>
            <AlertDescription>
              <strong>💡 Dicas importantes:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Certifique-se de que a primeira linha contém os nomes das colunas</li>
                <li>Categorias inválidas serão automaticamente definidas como "Iniciante"</li>
                <li>Campos vazios em colunas opcionais serão ignorados</li>
                <li>Você pode ter colunas extras na planilha, elas serão ignoradas</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTutorialDialog;
