import { useState } from "react";
import { logger } from "../lib/logger";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Header } from "../components/layout/header";
import { ContractForm, type ContractFormValues } from "../components/contracts/contract-form";
import { 
  generateContract, 
  analyzeContract,
  getContractTemplates,
  generateFromTemplate,
  type ContractTemplate 
} from "../lib/gemini-contracts";
import { getUserContracts, saveContract, deleteContract, updateContract, type Contract } from "../lib/contracts";
import html2pdf from 'html2pdf.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import {
  FileText, Plus, Download, Edit, Trash2, Eye, MoreVertical, CheckCircle2,
  Clock, AlertCircle, FileDown, Brain, Scale, Sparkles, Shield, Users
} from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "../lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { motion } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95
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
        logger.error('Error fetching contracts:', error);
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Omit<Contract, 'id'>> }) => {
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
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as "portrait" | "landscape" }
    };

    try {
      const element = document.createElement('div');
      element.innerHTML = contractContent;
      document.body.appendChild(element);
      await html2pdf().set(opt).from(element).save();
      document.body.removeChild(element);
    } catch (error) {
      logger.error('Error generating PDF:', error);
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
      content: string;
      type?: any;
      status: 'draft' | 'active' | 'completed';
    }) => {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }
      
      logger.info('Saving contract with data:', contractData);
      return await saveContract(contractData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({
        title: "Success",
        description: "Contract saved successfully",
      });
    },
    onError: (error: Error) => {
      logger.error('Error in saveContractMutation:', error);
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
      const contract = await generateContract({
        contractType: values.type,
        artistName: values.artistName,
        clientName: values.otherParty,
        paymentTerms: values.terms,
        additionalClauses: values.additionalDetails
      });
      
      const contractTitle = `${values.type} Agreement - ${values.artistName}`;
      setGeneratedContract(contract);
      setContractTitle(contractTitle);
      
      // Auto-save to database
      if (auth.currentUser) {
        try {
          await saveContractMutation.mutateAsync({
            title: contractTitle,
            type: values.type as any,
            content: contract,
            status: "draft" as const
          });
          toast({
            title: "Contract Generated & Saved",
            description: "Your contract has been created and automatically saved to your library.",
          });
        } catch (saveError) {
          logger.error('Error auto-saving contract:', saveError);
          // Show the contract even if save fails
          toast({
            title: "Contract Generated",
            description: "Contract created successfully (save failed - please try again).",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Contract Generated",
          description: "Please log in to save contracts.",
        });
      }
    } catch (error) {
      logger.error('Error generating contract:', error);
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
      logger.info('Attempting to save contract...');
      await saveContractMutation.mutateAsync({
        title: contractTitle,
        type: "legal",
        content: generatedContract,
        status: "draft" as const
      });

      setGeneratedContract(null);
      setShowNewContractDialog(false);
      setContractTitle("");
    } catch (error) {
      logger.error('Error saving contract:', error);
    }
  };

  // Función para analizar contratos usando Gemini AI
  const analyzeContractFunction = async (contractText: string) => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeContract(contractText);
      
      const risksList = analysis.risks.map((risk, i) => `${i + 1}. ${risk}`).join('\n');
      const recsList = analysis.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n');
      const termsList = analysis.keyTerms.map((term, i) => `${i + 1}. ${term.term}: ${term.description}`).join('\n');
      
      const formattedAnalysis = `RESUMEN:\n${analysis.summary}\n\nRIESGOS IDENTIFICADOS:\n${risksList}\n\nRECOMENDACIONES:\n${recsList}\n\nTERMINOS CLAVE:\n${termsList}`;
      
      setAnalysisResult(formattedAnalysis);
    } catch (error) {
      logger.error('Error analyzing contract:', error);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-slate-950/20">
      <Header />
      <main className="flex-1 px-6 md:px-10">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden rounded-3xl mb-16 mt-8 md:mt-12">
          {/* Background Image */}
          <div 
            className="absolute inset-0 w-full h-full rounded-3xl"
            style={{
              backgroundImage: `url(/attached_assets/generated_images/modern_music_tech_vibrant_hero_background.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              zIndex: 0
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80 rounded-3xl" />
          
          {/* Animated Glow Effects */}
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600/30 rounded-full filter blur-3xl animate-pulse" 
               style={{ animationDuration: '7s' }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse" 
               style={{ animationDuration: '10s' }} />
          
          {/* Content */}
          <motion.div
            className="relative z-10 text-center max-w-4xl mx-auto px-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <div className="inline-block px-4 py-2 bg-blue-600/40 border border-blue-400/60 rounded-full text-sm font-semibold text-blue-200 backdrop-blur-sm">
                ⚖️ AI-Powered Legal Management
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-blue-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-6 leading-tight"
            >
              Legal Contract Management
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto leading-relaxed font-light mb-8"
            >
              Create, analyze, and manage your professional agreements with AI assistance
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                onClick={() => setSelectedTab("generator")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-600/50"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Contract
              </Button>
              <Button
                onClick={() => setSelectedTab("analyzer")}
                variant="outline"
                className="border-blue-400/50 text-blue-200 hover:bg-blue-600/20 px-8 py-6 text-lg font-semibold rounded-xl backdrop-blur-sm"
              >
                <Scale className="w-5 h-5 mr-2" />
                Analyze
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <motion.div
          className="flex-1 space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={setSelectedTab} className="space-y-10">
            <motion.div variants={itemVariants}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-4 p-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/20">
                {[
                  { value: "contracts", icon: FileText, label: "Contracts", shortLabel: "Docs" },
                  { value: "generator", icon: Sparkles, label: "Contract Generator", shortLabel: "Generate" },
                  { value: "analyzer", icon: Scale, label: "Contract Analyzer", shortLabel: "Analyze" },
                  { value: "ai-agent", icon: Brain, label: "Legal AI Agent", shortLabel: "AI Help" }
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="gap-3 text-base py-4 px-6 transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white hover:bg-slate-700/50"
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            {/* Contracts Tab */}
            <TabsContent value="contracts">
              <motion.div
                className="space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: "Total Contracts", icon: FileText, count: contracts.length, color: "blue", bgColor: "bg-blue-600/20", borderColor: "border-blue-500/30", textColor: "text-blue-300", iconBg: "bg-blue-600/30" },
                    { title: "Active Contracts", icon: CheckCircle2, count: contracts.filter(c => c.status === "active").length, color: "green", bgColor: "bg-green-600/20", borderColor: "border-green-500/30", textColor: "text-green-300", iconBg: "bg-green-600/30" },
                    { title: "Pending Review", icon: Clock, count: contracts.filter(c => c.status === "draft").length, color: "purple", bgColor: "bg-purple-600/20", borderColor: "border-purple-500/30", textColor: "text-purple-300", iconBg: "bg-purple-600/30" }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      variants={itemVariants}
                      whileHover={{ y: -5 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={`p-5 rounded-xl hover:shadow-2xl hover:shadow-${stat.color}-500/20 transition-all duration-300 group ${stat.bgColor} border ${stat.borderColor} hover:border-${stat.color}-400/50 hover:backdrop-blur-sm`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-lg ${stat.iconBg} group-hover:scale-110 transition-transform`}>
                            <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">{stat.title}</h3>
                            <p className={`text-3xl font-black ${stat.textColor} mt-1`}>
                              {stat.count}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 border border-slate-700/50 backdrop-blur p-6">
                  <div className="mb-6">
                    <h3 className="text-3xl font-black bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent mb-2">📋 Contract List</h3>
                    <p className="text-slate-400">Manage and track all your legal agreements in one place</p>
                  </div>

                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="p-16 text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Clock className="h-10 w-10 text-blue-400 mx-auto mb-4" />
                        </motion.div>
                        <p className="text-lg text-slate-400">Loading your contracts...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-blue-500/5 border-b border-slate-700/50">
                            <TableHead className="font-semibold text-slate-300 py-4">Title</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-slate-300 py-4">Type</TableHead>
                            <TableHead className="font-semibold text-slate-300 py-4">Status</TableHead>
                            <TableHead className="hidden md:table-cell font-semibold text-slate-300 py-4">Date</TableHead>
                            <TableHead className="w-[100px] py-4">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contracts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="h-60">
                                <motion.div
                                  className="flex flex-col items-center justify-center space-y-4"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.5 }}
                                >
                                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full flex items-center justify-center border border-blue-500/30">
                                    <FileText className="h-10 w-10 text-blue-400" />
                                  </div>
                                  <div className="text-center space-y-2">
                                    <p className="text-2xl font-black text-slate-100">No contracts yet</p>
                                    <p className="text-slate-400">
                                      Start by creating your first contract
                                    </p>
                                  </div>
                                  <motion.div
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                  >
                                    <Button
                                      onClick={() => setSelectedTab("generator")}
                                      className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-lg px-8 py-6 h-auto font-semibold shadow-lg hover:shadow-blue-500/50"
                                    >
                                      <Plus className="mr-2 h-5 w-5" />
                                      Create Your First Contract
                                    </Button>
                                  </motion.div>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            contracts.map((contract, index) => (
                              <motion.tr
                                key={contract.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="group hover:bg-blue-500/10 border-b border-slate-700/50 transition-colors"
                              >
                                <TableCell className="font-semibold text-slate-100 text-base py-4">
                                  {contract.title}
                                </TableCell>
                                <TableCell className="hidden md:table-cell py-4">
                                  <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-700/50 border-slate-600 text-slate-300">
                                    {contract.type || 'Legal'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-4">
                                  <Badge
                                    variant="secondary"
                                    className={`gap-2 py-1.5 px-3 ${getStatusColor(contract.status)}`}
                                  >
                                    {getStatusIcon(contract.status)}
                                    <span>{contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}</span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-slate-400 py-4">
                                  {new Date(contract.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="py-4">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600/20 text-slate-300"
                                      >
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-5 w-5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52 bg-slate-800 border-slate-700">
                                      <DropdownMenuItem
                                        onClick={() => handleViewContract(contract)}
                                        className="gap-3 py-3 cursor-pointer hover:bg-blue-600/30 text-slate-200"
                                      >
                                        <Eye className="h-5 w-5" />
                                        View Contract
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-slate-700" />
                                      <DropdownMenuItem
                                        onClick={() => handleDownloadPDF(contract)}
                                        className="gap-3 py-3 cursor-pointer hover:bg-blue-600/30 text-slate-200"
                                      >
                                        <FileDown className="h-5 w-5" />
                                        Download PDF
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDownloadText(contract)}
                                        className="gap-3 py-3 cursor-pointer hover:bg-blue-600/30 text-slate-200"
                                      >
                                        <Download className="h-5 w-5" />
                                        Download Text
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-slate-700" />
                                      <DropdownMenuItem
                                        onClick={() => handleEditContract(contract)}
                                        className="gap-3 py-3 cursor-pointer hover:bg-blue-600/30 text-slate-200"
                                      >
                                        <Edit className="h-5 w-5" />
                                        Edit Contract
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteContract(contract)}
                                        className="gap-3 py-3 cursor-pointer text-red-400 hover:bg-red-600/30"
                                      >
                                        <Trash2 className="h-5 w-5" />
                                        Delete Contract
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </motion.tr>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            {/* Generator Tab */}
            <motion.div variants={itemVariants}>
              <TabsContent value="generator">
                <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 border border-slate-700/50 backdrop-blur rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 md:p-4 bg-blue-600/30 rounded-lg">
                      <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-100">Contract Generator</h3>
                      <p className="text-sm md:text-base text-slate-400">
                        Create professional contracts with AI assistance
                      </p>
                    </div>
                  </div>
                  <ContractForm onSubmit={handleGenerateContract} isLoading={isGenerating} />
                </div>
              </TabsContent>
            </motion.div>

            {/* Analyzer Tab */}
            <motion.div variants={itemVariants}>
              <TabsContent value="analyzer">
                <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 border border-slate-700/50 backdrop-blur rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 md:p-4 bg-purple-600/30 rounded-lg">
                      <Scale className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-100">Contract Analyzer</h3>
                      <p className="text-sm md:text-base text-slate-400">
                        Analyze and review contracts with AI assistance
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste your contract text here for analysis..."
                      value={contractToAnalyze}
                      onChange={(e) => setContractToAnalyze(e.target.value)}
                      className="min-h-[150px] md:min-h-[200px] bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-500"
                    />
                    <Button
                      onClick={() => analyzeContractFunction(contractToAnalyze)}
                      disabled={isAnalyzing || !contractToAnalyze}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Contract"}
                    </Button>
                    {analysisResult && (
                      <div className="mt-4 md:mt-6 p-4 border border-slate-700 rounded-lg bg-slate-700/30">
                        <h4 className="font-semibold text-slate-100 mb-2">Analysis Results</h4>
                        <ScrollArea className="h-[200px] md:h-[300px]">
                          <div className="space-y-4">
                            <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm text-slate-300">
                              {analysisResult}
                            </pre>
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </motion.div>

            {/* AI Agent Tab */}
            <motion.div variants={itemVariants}>
              <TabsContent value="ai-agent">
                <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-slate-900/40 border border-slate-700/50 backdrop-blur rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 md:p-4 bg-green-600/30 rounded-lg">
                      <Brain className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-100">Legal Artist AI Agent</h3>
                      <p className="text-sm md:text-base text-slate-400">
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
                </div>
              </TabsContent>
            </motion.div>

          </Tabs>
          {/* View Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedContract?.title}</DialogTitle>
                <DialogDescription>
                  Created on {selectedContract?.createdAt ? new Date(selectedContract.createdAt).toLocaleDateString() : 'Unknown'}
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
                      if (selectedContract?.id) {
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
                    if (selectedContract?.id) {
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
      return "bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30";
    case "pending":
      return "bg-yellow-600/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-600/30";
    case "draft":
      return "bg-slate-600/20 text-slate-300 border border-slate-500/30 hover:bg-slate-600/30";
    default:
      return "bg-slate-600/20 text-slate-300 border border-slate-500/30 hover:bg-slate-600/30";
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