import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIModelsManager } from "@/components/admin/ai-models-manager";
import {
  Users,
  CreditCard,
  Mail,
  UserX,
  Star,
  RefreshCcw,
  Settings,
  Download,
  UserCheck,
  Brain,
  Wand2
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2
    }
  }
};

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState("subscriptions");
  const { user } = useAuth();

  // Mock data - replace with actual API calls
  const subscriptionData = {
    activeSubscriptions: 150,
    totalRevenue: 15000,
    recentCancellations: 5
  };

  const affiliateData = {
    totalAffiliates: 45,
    activeAffiliates: 32,
    totalCommissions: 2500
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-6">
            {/* Hero Section */}
            <motion.section
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative rounded-xl overflow-hidden mb-12 bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-background p-8"
            >
              <div className="relative">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-4xl md:text-5xl font-bold mb-4"
                >
                  Panel de Administración
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-xl text-muted-foreground max-w-2xl"
                >
                  Gestiona suscripciones, afiliados, modelos de IA y más desde un solo lugar
                </motion.p>
              </div>
            </motion.section>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid grid-cols-4 max-w-[800px] mb-8">
                {[
                  { value: "subscriptions", icon: <CreditCard />, label: "Suscripciones" },
                  { value: "affiliates", icon: <Star />, label: "Afiliados" },
                  { value: "ai-models", icon: <Brain />, label: "Modelos IA" },
                  { value: "data", icon: <Mail />, label: "Datos y Emails" }
                ].map(tab => (
                  <motion.div
                    key={tab.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <TabsTrigger value={tab.value} className="data-[state=active]:bg-orange-500">
                      {tab.icon && <span className="w-4 h-4 mr-2">{tab.icon}</span>}
                      {tab.label}
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={containerVariants}
                >
                  {/* Suscripciones Tab */}
                  <TabsContent value="subscriptions">
                    <motion.div
                      variants={containerVariants}
                      className="grid md:grid-cols-3 gap-6 mb-8"
                    >
                      {[
                        {
                          icon: <Users />,
                          title: "Suscripciones Activas",
                          value: subscriptionData.activeSubscriptions
                        },
                        {
                          icon: <CreditCard />,
                          title: "Ingresos Totales",
                          value: `$${subscriptionData.totalRevenue}`
                        },
                        {
                          icon: <UserX />,
                          title: "Cancelaciones Recientes",
                          value: subscriptionData.recentCancellations
                        }
                      ].map((stat, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          whileHover="hover"
                          variants={cardVariants}
                        >
                          <Card className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-orange-500/10 rounded-lg">
                                {stat.icon}
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                <p className="text-2xl font-bold">{stat.value}</p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-semibold">Gestión de Suscripciones</h3>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm">
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              Actualizar
                            </Button>
                          </motion.div>
                        </div>

                        <div className="space-y-6">
                          {/* Add subscription management table/list here */}
                          <div className="text-center text-muted-foreground">
                            Tabla de suscripciones se implementará aquí
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* Afiliados Tab */}
                  <TabsContent value="affiliates">
                    <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-6 mb-8">
                      {[
                        { icon: <Users />, title: "Total Afiliados", value: affiliateData.totalAffiliates },
                        { icon: <UserCheck />, title: "Afiliados Activos", value: affiliateData.activeAffiliates },
                        { icon: <CreditCard />, title: "Comisiones Totales", value: `$${affiliateData.totalCommissions}` }
                      ].map((stat, index) => (
                        <motion.div key={index} variants={itemVariants} whileHover="hover" variants={cardVariants}>
                          <Card className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-orange-500/10 rounded-lg">{stat.icon}</div>
                              <div>
                                <p className="text-sm text-muted-foreground">{stat.title}</p>
                                <p className="text-2xl font-bold">{stat.value}</p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-semibold">Programa de Afiliados</h3>
                          <div className="flex gap-2">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Exportar
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Configuración
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          {/* Add affiliate management table/list here */}
                          <div className="text-center text-muted-foreground">
                            Tabla de afiliados se implementará aquí
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* Nueva Tab de Modelos IA */}
                  <TabsContent value="ai-models">
                    <motion.div variants={containerVariants}>
                      <div className="grid md:grid-cols-3 gap-6 mb-8">
                        {[
                          { icon: <Brain />, title: "Modelos Activos", value: 8 },
                          { icon: <Wand2 />, title: "Generaciones AI", value: "2.5K" },
                          { icon: <Settings />, title: "Configuraciones", value: 12 }
                        ].map((stat, index) => (
                          <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover="hover"
                            variants={cardVariants}
                          >
                            <Card className="p-6">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-lg">{stat.icon}</div>
                                <div>
                                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                                  <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                      <AIModelsManager />
                    </motion.div>
                  </TabsContent>

                  {/* Datos y Emails Tab */}
                  <TabsContent value="data">
                    <motion.div variants={itemVariants}>
                      <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-semibold">Gestión de Datos y Emails</h3>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Exportar Datos
                            </Button>
                          </motion.div>
                        </div>

                        <div className="space-y-6">
                          {/* Add email and data management interface here */}
                          <div className="text-center text-muted-foreground">
                            Interface de gestión de datos se implementará aquí
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}