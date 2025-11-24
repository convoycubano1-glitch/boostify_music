import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Play, Pause, RotateCcw } from 'lucide-react';

interface Operation {
  id: string;
  type: 'marketing' | 'development' | 'operations' | 'infrastructure';
  description: string;
  amount: number;
  timestamp: number;
  completed: boolean;
}

export default function FundsSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [totalFunds, setTotalFunds] = useState(1000000);
  const [spent, setSpent] = useState(0);
  const [fundAllocation] = useState({
    marketing: 0.60,
    development: 0.30,
    operations: 0.07,
    infrastructure: 0.03
  });

  const operationTypes = {
    marketing: {
      label: 'Marketing',
      items: [
        { desc: 'Instagram Ad Campaign', cost: 5000 },
        { desc: 'YouTube Influencer Partnership', cost: 8000 },
        { desc: 'Billboard Advertising', cost: 12000 },
        { desc: 'Social Media Content Creation', cost: 3000 },
        { desc: 'Email Marketing Campaign', cost: 2000 },
        { desc: 'Podcast Sponsorship', cost: 6000 },
      ]
    },
    development: {
      label: 'Development',
      items: [
        { desc: 'API Development & Optimization', cost: 15000 },
        { desc: 'Mobile App Enhancement', cost: 20000 },
        { desc: 'AI Integration', cost: 25000 },
        { desc: 'Database Infrastructure', cost: 18000 },
        { desc: 'Security Audit', cost: 10000 },
        { desc: 'Performance Testing', cost: 8000 },
      ]
    },
    operations: {
      label: 'Operations',
      items: [
        { desc: 'Customer Support Team', cost: 4000 },
        { desc: 'Legal Compliance', cost: 3000 },
        { desc: 'HR & Administration', cost: 2500 },
      ]
    },
    infrastructure: {
      label: 'Infrastructure',
      items: [
        { desc: 'Server Hosting & CDN', cost: 5000 },
        { desc: 'Cloud Services', cost: 3000 },
        { desc: 'Backup Systems', cost: 2000 },
      ]
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const categories = (Object.keys(operationTypes) as Array<keyof typeof operationTypes>);
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      const items = operationTypes[randomCategory].items;
      const randomItem = items[Math.floor(Math.random() * items.length)];

      const newOp: Operation = {
        id: Math.random().toString(),
        type: randomCategory,
        description: randomItem.desc,
        amount: randomItem.cost,
        timestamp: Date.now(),
        completed: false
      };

      setOperations(prev => [newOp, ...prev.slice(0, 19)]);
      
      setSpent(prev => {
        const newSpent = prev + randomItem.cost;
        return newSpent > totalFunds ? totalFunds : newSpent;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning, totalFunds]);

  const getColor = (type: string) => {
    switch(type) {
      case 'marketing': return 'from-blue-500 to-blue-600';
      case 'development': return 'from-purple-500 to-purple-600';
      case 'operations': return 'from-green-500 to-green-600';
      case 'infrastructure': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getLabel = (type: string) => {
    return operationTypes[type as keyof typeof operationTypes]?.label || type;
  };

  const remaining = totalFunds - spent;
  const percentageSpent = (spent / totalFunds) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-orange-500" />
            Funds Allocation Simulator
          </h1>
          <p className="text-white/70">Real-time transparency of how Boostify invests your funds</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left: Fund Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Fund Status */}
            <Card className="p-6 bg-black/40 border-orange-500/20">
              <h2 className="text-xl font-bold text-white mb-6">Investment Overview</h2>
              
              {/* Total Fund Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/70 font-medium">Total Fund Distribution</span>
                  <span className="text-orange-400 font-bold">${(spent).toLocaleString()} / ${(totalFunds).toLocaleString()}</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentageSpent}%` }}
                  ></div>
                </div>
                <div className="text-sm text-white/50 mt-2">{percentageSpent.toFixed(1)}% allocated</div>
              </div>

              {/* Allocation Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(fundAllocation).map(([key, percentage]) => (
                  <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-white/60 mb-1">{getLabel(key)}</div>
                    <div className="text-lg font-bold text-white">{(percentage * 100).toFixed(0)}%</div>
                    <div className="text-xs text-white/40 mt-1">${((totalFunds * percentage) / 1000).toFixed(0)}k</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Controls */}
            <div className="flex gap-4">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-all flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause Simulation
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Start Simulation
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setOperations([]);
                  setSpent(0);
                  setIsRunning(false);
                }}
                className="px-4 py-3 rounded-lg bg-white/10 text-white font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </button>
            </div>

            {/* Operations Feed */}
            <Card className="p-6 bg-black/40 border-orange-500/20 max-h-96 overflow-y-auto">
              <h2 className="text-lg font-bold text-white mb-4">Real-Time Operations</h2>
              <div className="space-y-2">
                {operations.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Click "Start Simulation" to begin</p>
                  </div>
                ) : (
                  operations.map((op) => (
                    <div
                      key={op.id}
                      className={`p-3 rounded-lg border-l-4 bg-black/40 animate-fadeIn ${
                        op.type === 'marketing' ? 'border-l-blue-500 bg-blue-500/5' :
                        op.type === 'development' ? 'border-l-purple-500 bg-purple-500/5' :
                        op.type === 'operations' ? 'border-l-green-500 bg-green-500/5' :
                        'border-l-orange-500 bg-orange-500/5'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold text-white">{op.description}</div>
                          <div className="text-xs text-white/50 mt-1">{getLabel(op.type)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-orange-400">-${op.amount.toLocaleString()}</div>
                          <div className="text-xs text-white/40">
                            {new Date(op.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right: Summary Cards */}
          <div className="space-y-4">
            {/* Remaining */}
            <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <div className="text-white/70 text-sm mb-2">Remaining Budget</div>
              <div className="text-3xl font-bold text-green-400">${(remaining).toLocaleString()}</div>
              <div className="text-xs text-white/50 mt-2">{((remaining/totalFunds)*100).toFixed(1)}% available</div>
            </Card>

            {/* Total Spent */}
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-600/5 border-orange-500/20">
              <div className="text-white/70 text-sm mb-2">Total Spent</div>
              <div className="text-3xl font-bold text-orange-400">${(spent).toLocaleString()}</div>
              <div className="text-xs text-white/50 mt-2">{percentageSpent.toFixed(1)}% of budget</div>
            </Card>

            {/* Category Breakdown */}
            <Card className="p-6 bg-black/40 border-white/10">
              <h3 className="text-sm font-bold text-white mb-4">Budget Allocation</h3>
              <div className="space-y-3">
                {Object.entries(fundAllocation).map(([key, percentage]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">{getLabel(key)}</span>
                      <span className="text-white font-semibold">{(percentage * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getColor(key)} rounded-full`}
                        style={{ width: `${percentage * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Transparency Badge */}
            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/20">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white/70">100% Transparency</span>
              </div>
              <p className="text-xs text-white/50 mt-2">All operations tracked in real-time</p>
            </Card>
          </div>
        </div>

        {/* Info Section */}
        <Card className="p-6 bg-black/40 border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">How Fund Allocation Works</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">60% Marketing</h4>
              <p className="text-sm text-white/70">User acquisition, brand awareness, and growth campaigns across digital channels</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">30% Development</h4>
              <p className="text-sm text-white/70">AI features, platform improvements, security, and scalability infrastructure</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">7% Operations</h4>
              <p className="text-sm text-white/70">Customer support, legal compliance, and administrative functions</p>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">3% Infrastructure</h4>
              <p className="text-sm text-white/70">Server hosting, CDN, cloud services, and system backups</p>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
