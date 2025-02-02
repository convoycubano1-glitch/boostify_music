import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { ContractForm, type ContractFormValues } from "@/components/contracts/contract-form";
import { generateContract } from "@/lib/openai";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Plus,
  Download,
  Eye,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface Contract {
  id: number;
  title: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
}

export default function ContractsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewContractDialog, setShowNewContractDialog] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);
  const [contractTitle, setContractTitle] = useState<string>("");
    const queryClient = useQueryClient();


  // Fetch contracts
  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    enabled: !!user,
  });

  // Save contract mutation
  const saveContractMutation = useMutation({
    mutationFn: async (contract: { title: string; type: string; content: string }) => {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(contract),
      });
      if (!response.ok) {
        throw new Error("Failed to save contract");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
  });

  const handleGenerateContract = async (values: ContractFormValues) => {
    setIsGenerating(true);
    try {
      const contract = await generateContract(values);
      setGeneratedContract(contract);
      setContractTitle(`${values.type} Agreement - ${values.artistName}`);
      toast({
        title: "Contract Generated",
        description: "Your contract has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContract = async () => {
    if (!generatedContract || !contractTitle) return;

    try {
      await saveContractMutation.mutateAsync({
        title: contractTitle,
        type: "contract", // You might want to be more specific based on the contract type
        content: generatedContract,
      });

      toast({
        title: "Contract Saved",
        description: "Your contract has been saved successfully.",
      });
      setGeneratedContract(null);
      setShowNewContractDialog(false);
      setContractTitle("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contract. Please try again.",
        variant: "destructive",
      });
    }
  };

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
                      Contract Title
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
                      Close
                    </Button>
                    <Button
                      onClick={handleSaveContract}
                      disabled={!contractTitle}
                    >
                      Save Contract
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
                {contracts.filter((c) => c.status === "pending").length}
              </p>
            </Card>
          </div>

          <Card>
            {isLoading ? (
              <div className="p-8 text-center">Loading contracts...</div>
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
                      <TableCell>{new Date(contract.created_at).toLocaleDateString()}</TableCell>
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