import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/header";
import { ContractForm, type ContractFormValues } from "@/components/contracts/contract-form";
import { generateContract } from "@/lib/openai";
import { saveContract, getUserContracts, deleteContract, updateContract, type Contract } from "@/lib/firebase";
import html2pdf from 'html2pdf.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Download, Edit, Trash2, Eye, MoreVertical, CheckCircle2, Clock, AlertCircle, FileDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { deleteDoc } from "firebase/firestore";

export default function ContractsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewContractDialog, setShowNewContractDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);
  const [contractTitle, setContractTitle] = useState<string>("");
  const queryClient = useQueryClient();

  // Fetch contracts
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

  // Delete contract mutation
  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: string) => {
      await deleteContract(contractId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Success",
        description: "Contract deleted successfully",
      });
      setShowDeleteDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error deleting the contract",
        variant: "destructive",
      });
    },
  });

  // Update contract mutation
  const updateContractMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contract> }) => {
      await updateContract(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Success",
        description: "Contract updated successfully",
      });
      setShowEditDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error updating the contract",
        variant: "destructive",
      });
    },
  });

  // Handle view contract
  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowViewDialog(true);
  };

  // Handle edit contract
  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setEditedContent(contract.content);
    setShowEditDialog(true);
  };

  // Handle delete contract
  const handleDeleteContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDeleteDialog(true);
  };

    // Handle download contract as PDF
    const handleDownloadPDF = async (contract: Contract) => {
      const contractContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="color: #333; margin-bottom: 20px;">${contract.title}</h1>
          <div style="white-space: pre-wrap; font-family: monospace; font-size: 14px;">
            ${contract.content}
          </div>
        </div>
      `;
  
      const opt = {
        margin: 1,
        filename: `${contract.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
  
      try {
        const element = document.createElement('div');
        element.innerHTML = contractContent;
        document.body.appendChild(element);
        await html2pdf().set(opt).from(element).save();
        document.body.removeChild(element);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Failed to generate PDF. Please try again.",
          variant: "destructive",
        });
      }
    };
  
    // Handle download contract as text
    const handleDownloadText = (contract: Contract) => {
      const element = document.createElement("a");
      const file = new Blob([contract.content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${contract.title}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

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
      console.log('Saving contract with data:', contractData);
      return await saveContract(contractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Success",
        description: "Contract saved successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Error in saveContractMutation:', error);
      toast({
        title: "Error",
        description: error.message || "Error saving the contract. Please try again.",
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
        title: "Contract Generated",
        description: "Your contract has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Error",
        description: "Failed to generate the contract. Please try again.",
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
        description: "The contract title and content are required.",
        variant: "destructive",
      });
      return;
    }

    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to save contracts.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Attempting to save contract...');
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Contract Management
            </h2>
            <p className="text-muted-foreground">
              Create, manage, and track your professional agreements efficiently
            </p>
          </div>
          <Dialog open={showNewContractDialog} onOpenChange={setShowNewContractDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Contract
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Contract</DialogTitle>
                <DialogDescription>
                  Fill out the form below to generate a professional contract using AI
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
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveContract}
                      disabled={!contractTitle || saveContractMutation.isPending}
                    >
                      {saveContractMutation.isPending ? "Saving..." : "Save Contract"}
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
                <h3 className="text-lg font-medium">Total Contracts</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">{contracts.length}</p>
              <p className="text-sm text-muted-foreground mt-2">
                View and manage all your contracts in one place
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium">Active Contracts</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {contracts.filter((c) => c.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Currently active and enforced agreements
              </p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-medium">Pending</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {contracts.filter((c) => c.status === "draft").length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Drafts and contracts pending review
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
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="space-y-3">
                          <p className="text-lg font-medium">No contracts yet</p>
                          <p className="text-sm text-muted-foreground">
                            Click "New Contract" to create your first agreement
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contracts.map((contract) => (
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
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewContract(contract)} className="gap-2">
                                <Eye className="h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDownloadPDF(contract)} className="gap-2">
                                <FileDown className="h-4 w-4" /> Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadText(contract)} className="gap-2">
                                <Download className="h-4 w-4" /> Download TXT
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditContract(contract)} className="gap-2">
                                <Edit className="h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteContract(contract)} className="gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* View Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedContract?.title}</DialogTitle>
                <DialogDescription>
                  Created on {selectedContract?.createdAt.toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {selectedContract?.content}
                    </pre>
                  </div>
                </ScrollArea>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Edit Contract</DialogTitle>
                <DialogDescription>
                  Make changes to your contract content below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[400px] p-4 font-mono text-sm border rounded"
                />
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedContract) {
                        updateContractMutation.mutate({
                          id: selectedContract.id,
                          updates: { content: editedContent }
                        });
                      }
                    }}
                    disabled={updateContractMutation.isPending}
                  >
                    {updateContractMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The contract will be permanently deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (selectedContract) {
                      deleteContractMutation.mutate(selectedContract.id);
                    }
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteContractMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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