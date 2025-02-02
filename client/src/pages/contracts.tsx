import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { ContractForm, type ContractFormValues } from "@/components/contracts/contract-form";
import { generateContract } from "@/lib/openai";
import { saveContract, getUserContracts, type Contract } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Download, Eye, MoreVertical, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";

export default function ContractsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewContractDialog, setShowNewContractDialog] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);
  const [contractTitle, setContractTitle] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch contracts using Firestore with proper error handling
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      try {
        if (!auth.currentUser) {
          throw new Error('Usuario no autenticado');
        }
        return await getUserContracts();
      } catch (error) {
        console.error('Error fetching contracts:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los contratos. Por favor, intente nuevamente.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!auth.currentUser,
  });

  // Save contract mutation using Firestore
  const saveContractMutation = useMutation({
    mutationFn: async (contractData: {
      title: string;
      type: string;
      content: string;
      status: string;
    }) => {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      console.log('Saving contract with data:', contractData); // Debug log
      return await saveContract(contractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Éxito",
        description: "Contrato guardado correctamente",
      });
    },
    onError: (error: Error) => {
      console.error('Error in saveContractMutation:', error);
      toast({
        title: "Error",
        description: error.message || "Error al guardar el contrato. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateContract = async (values: ContractFormValues) => {
    setIsGenerating(true);
    try {
      const contract = await generateContract(values);
      setGeneratedContract(contract);
      setContractTitle(`${values.type} Agreement - ${values.artistName}`);
      toast({
        title: "Contrato Generado",
        description: "Su contrato ha sido generado exitosamente.",
      });
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el contrato. Por favor, intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContract = async () => {
    if (!generatedContract || !contractTitle) {
      toast({
        title: "Error",
        description: "El título y contenido del contrato son requeridos.",
        variant: "destructive",
      });
      return;
    }

    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "Debe iniciar sesión para guardar contratos.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Attempting to save contract...'); // Debug log
      await saveContractMutation.mutateAsync({
        title: contractTitle,
        type: "legal",
        content: generatedContract,
        status: "draft"
      });

      setGeneratedContract(null);
      setShowNewContractDialog(false);
      setContractTitle("");
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Contratos</h2>
            <p className="text-muted-foreground">
              Gestiona tus contratos y documentos legales
            </p>
          </div>
          <Dialog open={showNewContractDialog} onOpenChange={setShowNewContractDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Contrato
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Contrato</DialogTitle>
                <DialogDescription>
                  Complete el formulario para generar un contrato profesional
                </DialogDescription>
              </DialogHeader>
              {!generatedContract ? (
                <ContractForm onSubmit={handleGenerateContract} isLoading={isGenerating} />
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium">
                      Título del Contrato
                    </label>
                    <input
                      id="title"
                      type="text"
                      className="w-full p-2 border rounded"
                      value={contractTitle}
                      onChange={(e) => setContractTitle(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {generatedContract}
                    </pre>
                  </ScrollArea>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedContract(null);
                        setShowNewContractDialog(false);
                        setContractTitle("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSaveContract}
                      disabled={!contractTitle || saveContractMutation.isPending}
                    >
                      {saveContractMutation.isPending ? "Guardando..." : "Guardar Contrato"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Total Contratos</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">{contracts.length}</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium">Contratos Activos</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {contracts.filter((c) => c.status === "active").length}
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-medium">Pendientes</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {contracts.filter((c) => c.status === "draft").length}
              </p>
            </Card>
          </div>

          <Card>
            {isLoading ? (
              <div className="p-8 text-center">Cargando contratos...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{contract.title}</TableCell>
                      <TableCell>{contract.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`gap-1 ${getStatusColor(contract.status)}`}
                        >
                          {getStatusIcon(contract.status)}
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Eye className="h-4 w-4" /> Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Download className="h-4 w-4" /> Descargar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    case "pending":
      return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
    case "draft":
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "active":
      return <CheckCircle2 className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "draft":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return null;
  }
}