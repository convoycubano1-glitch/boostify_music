/**
 * Boostify · Artist Financial Enablement
 * 
 * Landing page for artist financial infrastructure services.
 * Financial services are provided by Omnia and its specialized partners.
 * Boostify does not provide tax, legal, or lending services directly.
 */

import { useState } from "react";
import { Header } from "../components/layout/header";
import { 
  ArrowRight, CheckCircle2, XCircle, Zap, Building2, CreditCard, 
  TrendingUp, Shield, Eye, DollarSign, BarChart3, Sparkles,
  ChevronRight, Star, Users, Target, Lock, Globe
} from "lucide-react";

// ============================================================
// PRICING TIERS
// ============================================================

const TIERS = [
  {
    id: "readiness",
    name: "Financial Readiness",
    price: "$99",
    priceMax: "$149",
    type: "one-time",
    color: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    icon: Eye,
    features: [
      "Financial diagnosis",
      "Structure recommendation",
      "Personal roadmap",
      "Enablement system access",
    ],
    cta: "Start Here",
    popular: false,
  },
  {
    id: "business",
    name: "Artist Business Setup",
    price: "$299",
    priceMax: "$499",
    type: "one-time",
    color: "from-violet-500 to-purple-600",
    borderColor: "border-violet-500/40",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-400",
    icon: Building2,
    features: [
      "Formal business structure",
      "Income organization",
      "Tax preparation",
      "Credit foundation setup",
    ],
    cta: "Get Structured",
    popular: true,
  },
  {
    id: "growth",
    name: "Growth & Capital",
    price: "$49",
    priceMax: "$99",
    type: "/month",
    color: "from-blue-500 to-cyan-600",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    icon: TrendingUp,
    features: [
      "Continuous monitoring",
      "Quarterly adjustments",
      "Capital preparation",
      "Partner coordination",
    ],
    cta: "Scale Up",
    popular: false,
  },
];

// ============================================================
// STEPS
// ============================================================

const STEPS = [
  {
    num: "01",
    title: "Create & Monetize",
    desc: "You create and monetize with Boostify",
    icon: Sparkles,
  },
  {
    num: "02", 
    title: "Get Identified",
    desc: "Boostify identifies when you're ready for financial structuring",
    icon: Target,
  },
  {
    num: "03",
    title: "Get Connected",
    desc: "You're connected to Omnia's financial infrastructure",
    icon: Globe,
  },
  {
    num: "04",
    title: "Secure Delivery",
    desc: "Services are delivered outside the platform, securely",
    icon: Lock,
  },
];

// ============================================================
// SERVICES CARDS
// ============================================================

const SERVICES = [
  {
    icon: DollarSign,
    title: "Income Structuring",
    desc: "Organize how you get paid as an artist or brand",
    gradient: "from-emerald-500/20 to-green-500/5",
  },
  {
    icon: Building2,
    title: "Business Setup Guidance",
    desc: "From individual to company-ready",
    gradient: "from-violet-500/20 to-purple-500/5",
  },
  {
    icon: BarChart3,
    title: "Tax Readiness",
    desc: "Preparation, not confusion",
    gradient: "from-orange-500/20 to-amber-500/5",
  },
  {
    icon: CreditCard,
    title: "Credit & Capital Readiness",
    desc: "Build the profile banks and partners expect",
    gradient: "from-blue-500/20 to-cyan-500/5",
  },
  {
    icon: TrendingUp,
    title: "Long-term Financial Clarity",
    desc: "Know where you stand, always",
    gradient: "from-pink-500/20 to-rose-500/5",
  },
];

// ============================================================
// COMPONENT
// ============================================================

export default function FinancialEnablementPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* ===== 1. HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-black to-black" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/10 blur-[120px]" />
        
        <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8">
            <Zap size={14} className="text-violet-400" />
            <span className="text-xs font-medium text-violet-300 tracking-wide uppercase">
              Artist Financial Enablement
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Turn your art into{" "}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              a real business.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Boostify helps artists structure, protect, and scale their income — beyond music and visuals.
          </p>

          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-violet-600/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
          >
            Get Financially Ready
            <ArrowRight size={20} />
          </a>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-12 text-white/30 text-xs">
            <div className="flex items-center gap-1.5">
              <Shield size={14} />
              <span>Secure & Compliant</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Users size={14} />
              <span>1,200+ Artists</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Star size={14} />
              <span>Powered by Omnia</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. THE PROBLEM ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Most artists make money.{" "}
              <span className="text-white/40">Few build stability.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "You earn, but taxes are unclear",
              "You get paid, but don't build credit",
              "You grow, but everything is informal",
              "You create value, but can't access capital",
            ].map((problem, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-red-500/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle size={16} className="text-red-400" />
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. THE PROMISE ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            We help artists operate like{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              real companies.
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Boostify connects you with the infrastructure needed to formalize your career — from income organization to financial readiness.
          </p>
        </div>
      </section>

      {/* ===== 4. WHAT YOU GET ===== */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">What you get</h2>
            <p className="text-white/40 text-sm">Infrastructure, not promises.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((service, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${service.gradient} border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <service.icon size={22} className="text-white/70" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. HOW IT WORKS ===== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">How it works</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="relative group">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
                )}
                
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-5">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 group-hover:from-violet-500/30 group-hover:to-purple-600/20 transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <step.icon size={28} className="text-violet-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 6. PRICING ===== */}
      <section id="pricing" className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/15 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Choose your level</h2>
            <p className="text-white/40 text-sm">Start where you are. Scale when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-2xl border ${
                  tier.popular ? "border-violet-500/50" : "border-white/[0.08]"
                } bg-white/[0.02] overflow-hidden transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.04]`}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500" />
                )}

                <div className="p-7">
                  {tier.popular && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-semibold uppercase tracking-wider mb-4">
                      <Star size={10} /> Most Popular
                    </div>
                  )}

                  <div className={`w-11 h-11 rounded-xl ${tier.bgColor} flex items-center justify-center mb-4`}>
                    <tier.icon size={20} className={tier.textColor} />
                  </div>

                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-white/30 text-sm">– {tier.priceMax}</span>
                  </div>
                  <p className="text-white/30 text-xs mb-6">{tier.type}</p>

                  <div className="space-y-3 mb-8">
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <CheckCircle2 size={15} className={tier.textColor} />
                        <span className="text-sm text-white/70">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setSelectedTier(tier.id)}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-600/20"
                        : "bg-white/[0.06] hover:bg-white/[0.1] text-white/80 border border-white/[0.08]"
                    }`}
                  >
                    {tier.cta}
                    <ChevronRight size={14} className="inline ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing summary table */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 text-white/40 font-medium">Level</th>
                    <th className="text-left p-4 text-white/40 font-medium">Price</th>
                    <th className="text-left p-4 text-white/40 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/[0.04]">
                    <td className="p-4 text-white/70">Financial Readiness</td>
                    <td className="p-4 text-emerald-400 font-medium">$99 – $149</td>
                    <td className="p-4 text-white/40">One-time</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="p-4 text-white/70">Business Setup</td>
                    <td className="p-4 text-violet-400 font-medium">$299 – $499</td>
                    <td className="p-4 text-white/40">One-time</td>
                  </tr>
                  <tr className="border-b border-white/[0.04]">
                    <td className="p-4 text-white/70">Growth & Capital</td>
                    <td className="p-4 text-blue-400 font-medium">$49 – $99</td>
                    <td className="p-4 text-white/40">Monthly</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-white/40 text-xs">Backend Services</td>
                    <td className="p-4 text-white/30 text-xs">Variable</td>
                    <td className="p-4 text-white/30 text-xs">Via Omnia</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 7. WHO IS THIS FOR ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For */}
            <div className="p-8 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/[0.12]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle2 size={22} className="text-emerald-400" />
                For artists who:
              </h3>
              <div className="space-y-4">
                {[
                  "Generate income from their art",
                  "Want to grow long-term",
                  "Want to stop improvising",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-white/70 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Not for */}
            <div className="p-8 rounded-2xl bg-red-500/[0.04] border border-red-500/[0.12]">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <XCircle size={22} className="text-red-400" />
                Not for:
              </h3>
              <div className="space-y-4">
                {[
                  "Hobbyists with no revenue",
                  "Quick-money seekers",
                  "People looking for guarantees",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="text-white/50 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8. POWERED BY OMNIA ===== */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
            <Shield size={14} className="text-white/40" />
            <span className="text-xs text-white/40 tracking-wide">Operated by Third-party Partners</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Powered by <span className="text-violet-400">Omnia</span> Financial Infrastructure
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xl mx-auto mb-8">
            Financial services are provided by Omnia and its specialized partners.
            Boostify does not provide tax, legal, or lending services directly.
          </p>

          <div className="flex items-center justify-center gap-8 text-white/30 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500/60" />
              <span>Clarity</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500/60" />
              <span>Trust</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500/60" />
              <span>Compliance</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 9. FINAL CTA ===== */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/20 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to operate like{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              a professional?
            </span>
          </h2>

          <a
            href="#pricing"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-lg transition-all duration-300 shadow-lg shadow-violet-600/25 hover:shadow-violet-500/40 hover:scale-[1.02]"
          >
            Start Financial Enablement
            <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* ===== FOOTER LEGAL ===== */}
      <footer className="py-8 px-4 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/20 text-xs leading-relaxed">
            Boostify is a creative technology platform. Financial, tax, and capital services 
            are provided by third-party partners through Omnia. No financial outcomes are guaranteed.
          </p>
        </div>
      </footer>
    </div>
  );
}
