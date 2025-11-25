import { motion } from "framer-motion";
import { TrendingUp, Users, Zap, Briefcase, Stethoscope, BookOpen, BarChart3, Rocket } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const statVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
};

export function AurenovaSection() {
  const stats = [
    { value: "30", label: "Platforms", icon: <Zap className="w-6 h-6" /> },
    { value: "1.3M+", label: "Potential Users", icon: <Users className="w-6 h-6" /> },
    { value: "$3.5B+", label: "Valuation Potential", icon: <TrendingUp className="w-6 h-6" /> },
    { value: "10x", label: "Hardware Multiplier", icon: <Rocket className="w-6 h-6" /> }
  ];

  const divisions = [
    {
      title: "Aurenova Health Group",
      description: "Telemedicine, AI diagnostics, biometric wearables",
      users: "80K - 500K",
      icon: <Stethoscope className="w-8 h-8" />,
      color: "from-red-500 to-pink-500",
      platforms: ["Mediscan AI", "TeleCareX", "BioAnalytics Pro", "CareSync360"]
    },
    {
      title: "Aurenova Education Group",
      description: "AI learning, XR education, adaptive courseware",
      users: "100K - 500K",
      icon: <BookOpen className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
      platforms: ["LearnMatrix", "TeachAI Studio", "LangFlow", "CampusHub XR"]
    },
    {
      title: "Aurenova Business Automation",
      description: "Enterprise AI, CRM automation, corporate intelligence",
      users: "50K - 300K",
      icon: <Briefcase className="w-8 h-8" />,
      color: "from-green-500 to-emerald-500",
      platforms: ["AutoFlow CRM", "LeadWave", "FinanceIQ", "SecureDocs"]
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-orange-500 to-red-500 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-6"
          >
            <Rocket className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-400">OMNIA Ecosystem</span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Aurenova Systems Group
            </span>
          </motion.h2>

          <motion.p variants={itemVariants} className="text-xl text-white/70 max-w-2xl mx-auto">
            The most advanced holding in OMNIA ecosystem. 30 platforms across health, education, and enterprise automation.
          </motion.p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={statVariants}
              whileHover={{ y: -8 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:border-orange-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-orange-400">{stat.icon}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-white/60">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Divisions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {divisions.map((division, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${division.color} opacity-0 group-hover:opacity-20 rounded-xl blur-xl transition-all duration-300`} />
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 hover:border-orange-500/50 transition-all relative h-full flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${division.color} text-white`}>
                    {division.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{division.title}</h3>
                  </div>
                </div>

                <p className="text-white/70 text-sm mb-4 flex-1">{division.description}</p>

                <div className="mb-4 pb-4 border-b border-white/10">
                  <div className="text-sm text-orange-400 font-semibold mb-2">Potential Users</div>
                  <div className="text-2xl font-bold text-white">{division.users}</div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-white/60 uppercase tracking-widest mb-2">Key Platforms</div>
                  <div className="flex flex-wrap gap-2">
                    {division.platforms.map((platform, j) => (
                      <span
                        key={j}
                        className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/20"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Hardware Multiplier */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-8 mb-16"
        >
          <div className="flex items-start gap-6">
            <div className="p-3 rounded-lg bg-orange-500/20">
              <BarChart3 className="w-8 h-8 text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Hardware Integration Potential</h3>
              <p className="text-white/70 mb-4">
                Specialized hardware devices can multiply valuation by 5-10x. Target sectors include medical devices, wearable biometrics, XR education devices, and IoT enterprise solutions.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {["Medical Devices", "Biometric Wearables", "XR Devices", "IoT Sensors"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-orange-300">
                    <Zap className="w-4 h-4" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Valuation Projection */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 mb-12"
        >
          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-bold">User Base Projection</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Minimum Base</span>
                <span className="text-2xl font-bold text-green-400">200,000</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "20%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/5 border border-white/10 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-bold">Valuation Potential</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Estimated MRR</span>
                <span className="text-2xl font-bold text-orange-400">$19.8M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Valuation Range</span>
                <span className="text-2xl font-bold text-orange-400">$3.5B+</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 gap-2"
          >
            Explore Aurenova Ecosystem
            <TrendingUp className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
