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
import { 
  FileText, Plus, Download, Edit, Trash2, Eye, MoreVertical, CheckCircle2, 
  Clock, AlertCircle, FileDown, Brain, Scale, Sparkles, Shield, Users 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

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
  const [contractToAnalyze, setContractToAnalyze] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("contracts");

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

  // Función para analizar contratos usando AI
  const analyzeContract = async (contractText: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await generateContract({ // Modificar esta función para analizar en lugar de generar
        type: "analysis",
        content: contractText
      });
      setAnalysisResult(analysis);
    } catch (error) {
      console.error('Error analyzing contract:', error);
      toast({
        title: "Error",
        description: "Failed to analyze the contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-16 px-4 md:pt-20 md:px-8">
        <motion.div 
          className="flex-1 space-y-8 md:space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex flex-col space-y-3"
            variants={itemVariants}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Legal Contract Management
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
              Create, analyze, and manage your professional agreements with AI assistance
            </p>
          </motion.div>

          <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
            <motion.div variants={itemVariants}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-1 bg-muted/50 backdrop-blur-sm rounded-xl">
                {[
                  { value: "contracts", icon: FileText, label: "Contracts", shortLabel: "Docs" },
                  { value: "generator", icon: Sparkles, label: "Contract Generator", shortLabel: "Generate" },
                  { value: "analyzer", icon: Scale, label: "Contract Analyzer", shortLabel: "Analyze" },
                  { value: "ai-agent", icon: Brain, label: "Legal AI Agent", shortLabel: "AI Help" }
                ].map(tab => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="gap-2 text-sm py-3 transition-all duration-300 data-[state=active]:bg-orange-500"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            {/* Contracts Tab */}
            <TabsContent value="contracts">
              <motion.div 
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="grid gap-6 md:grid-cols-3">
                  {[
                    { title: "Total", icon: FileText, count: contracts.length, color: "primary" },
                    { title: "Active", icon: CheckCircle2, count: contracts.filter(c => c.status === "active").length, color: "green" },
                    { title: "Pending", icon: Clock, count: contracts.filter(c => c.status === "draft").length, color: "yellow" }
                  ].map((stat, index) => (
                    <motion.div 
                      key={stat.title}
                      variants={itemVariants}
                      custom={index}
                    >
                      <Card className="p-6 hover:shadow-lg transition-all duration-300 group">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg bg-${stat.color}-500/10 group-hover:bg-${stat.color}-500/20 transition-colors`}>
                            <stat.icon className={`h-6 w-6 text-${stat.color}-500`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium">{stat.title}</h3>
                            <p className="mt-1 text-3xl font-bold">{stat.count}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <Card className="overflow-hidden border-none shadow-lg">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="p-12 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                        </motion.div>
                        <p className="text-muted-foreground">Loading contracts...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-muted/5">
                            <TableHead className="font-semibold">Title</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold">Date</TableHead>
                            <TableHead className="w-[60px] md:w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contracts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-48">
                                <div className="flex flex-col items-center justify-center space-y-3">
                                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                                  <div className="text-center">
                                    <p className="text-lg font-medium">No contracts yet</p>
                                    <p className="text-sm text-muted-foreground">
                                      Create your first contract to get started
                                    </p>
                                  </div>
                                  <Button 
                                    onClick={() => setSelectedTab("generator")}
                                    className="mt-4 bg-orange-500 hover:bg-orange-600"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Contract
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            contracts.map((contract) => (
                              <TableRow key={contract.id} className="group hover:bg-muted/5">
                                <TableCell className="font-medium max-w-[200px] truncate">
                                  {contract.title}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Badge variant="outline">{contract.type}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={`gap-1.5 py-1 ${getStatusColor(contract.status)}`}
                                  >
                                    {getStatusIcon(contract.status)}
                                    <span>{contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                  {new Date(contract.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[180px]">
                                      <DropdownMenuItem
                                        onClick={() => handleViewContract(contract)}
                                        className="gap-2 py-2 cursor-pointer"
                                      >
                                        <Eye className="h-4 w-4" />
                                        View Contract
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDownloadPDF(contract)}
                                        className="gap-2 py-2 cursor-pointer"
                                      >
                                        <FileDown className="h-4 w-4" />
                                        Download PDF
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDownloadText(contract)}
                                        className="gap-2 py-2 cursor-pointer"
                                      >
                                        <Download className="h-4 w-4" />
                                        Download Text
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleEditContract(contract)}
                                        className="gap-2 py-2 cursor-pointer"
                                      >
                                        <Edit className="h-4 w-4" />
                                        Edit Contract
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteContract(contract)}
                                        className="gap-2 py-2 cursor-pointer text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Contract
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
                  </div>
                </Card>
              </motion.div>
            </TabsContent>

            {/* Generator Tab */}
            <motion.div variants={itemVariants}>
              <TabsContent value="generator">
                <Card className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                      <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold">Contract Generator</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Create professional contracts with AI assistance
                      </p>
                    </div>
                  </div>
                  <ContractForm onSubmit={handleGenerateContract} isLoading={isGenerating} />
                </Card>
              </TabsContent>
            </motion.div>

            {/* Analyzer Tab */}
            <motion.div variants={itemVariants}>
              <TabsContent value="analyzer">
                <Card className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                      <Scale className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold">Contract Analyzer</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Analyze and review contracts with AI assistance
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste your contract text here for analysis..."
                      value={contractToAnalyze}
                      onChange={(e) => setContractToAnalyze(e.target.value)}
                      className="min-h-[150px] md:min-h-[200px]"
                    />
                    <Button 
                      onClick={() => analyzeContract(contractToAnalyze)}
                      disabled={isAnalyzing || !contractToAnalyze}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Contract"}
                    </Button>
                    {analysisResult && (
                      <div className="mt-4 md:mt-6 p-4 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-2">Analysis Results</h4>
                        <ScrollArea className="h-[200px] md:h-[300px]">
                          <div className="space-y-4">
                            <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm">
                              {analysisResult}
                            </pre>
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </motion.div>

            {/* AI Agent Tab */}
            <motion.div variants={itemVariants}>
              <TabsContent value="ai-agent">
                <Card className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                      <Brain className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold">Legal Artist AI Agent</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Get expert legal advice for your music career
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-6">
                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">Ask Legal AI Assistant</h4>
                        <Textarea
                          className="mb-4"
                          placeholder="Ask about legal rights, contract terms..."
                          rows={4}
                        />
                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                          Get AI Response
                        </Button>
                      </div>

                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">Quick Questions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button variant="outline" className="justify-start text-sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Copyright
                          </Button>
                          <Button variant="outline" className="justify-start text-sm">
                            <Scale className="mr-2 h-4 w-4" />
                            Royalties
                          </Button>
                          <Button variant="outline" className="justify-start text-sm">
                            <Shield className="mr-2 h-4 w-4" />
                            Terms
                          </Button>
                          <Button variant="outline" className="justify-start text-sm">
                            <Users className="mr-2 h-4 w-4" />
                            Band
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">Legal Insights</h4>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <Brain className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Music Rights</p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                Understand and protect your work
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Brain className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Contract Review</p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                Professional agreement analysis
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </motion.div>

          </Tabs>
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
        </motion.div>
      </main>
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