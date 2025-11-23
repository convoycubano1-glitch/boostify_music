import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Sparkles, Loader, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface Analysis {
  analysis: string;
  metrics: {
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    completionRate: string;
    transactionCount: number;
  };
}

export function AdminAgent() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState('30');

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      const data = await response.json();
      if (data.success && data.metrics) {
        setAnalysis(data);
      } else {
        setError('Invalid response format from server');
      }
    } catch (error) {
      setError('Failed to run analysis. Please try again.');
      console.error('Error running analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseAnalysis = (text: string) => {
    const sections = text.split(/\*\*([^*]+)\*\*/);
    const parsed: any[] = [];
    for (let i = 1; i < sections.length; i += 2) {
      parsed.push({
        title: sections[i],
        content: sections[i + 1]?.trim() || ''
      });
    }
    return parsed;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-orange-400" />
            Financial AI Agent
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Gemini-powered analysis of your business metrics</p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row w-full md:w-auto">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-full sm:w-40 bg-slate-800 border-orange-500/20 hover:border-orange-500/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={runAnalysis} disabled={loading} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 w-full sm:w-auto">
            {loading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="pt-6 text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Cards */}
      {analysis && analysis.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">${analysis.metrics.totalRevenue}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Expenses</p>
              <p className="text-2xl font-bold text-red-400">${analysis.metrics.totalExpenses}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Net Profit</p>
              <p className="text-2xl font-bold text-blue-400">${analysis.metrics.netProfit}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-400">{analysis.metrics.completionRate}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="pt-6">
              <p className="text-slate-400 text-sm mb-1">Transactions</p>
              <p className="text-2xl font-bold text-yellow-400">{analysis.metrics.transactionCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && analysis.analysis && (
        <div className="space-y-4">
          {parseAnalysis(analysis.analysis).map((section, idx) => (
            <Card key={idx} className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {section.title.includes('Alert') && <AlertCircle className="h-5 w-5 text-red-400" />}
                  {section.title.includes('Growth') && <TrendingUp className="h-5 w-5 text-green-400" />}
                  {section.title.includes('Opportunit') && <Lightbulb className="h-5 w-5 text-yellow-400" />}
                  {section.title.includes('Health') && <CheckCircle className="h-5 w-5 text-blue-400" />}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {section.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!analysis && !loading && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-12 w-12 text-yellow-400 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400">Click "Run Analysis" to get AI-powered insights about your business</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
