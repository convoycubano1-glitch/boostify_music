import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TrendingUp, Send, Percent, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MOCK_INVESTORS = [
  {
    id: 1,
    name: 'Tech Venture Capital',
    email: 'tvc@example.com',
    investmentType: 'equity',
    investmentAmount: 500000,
    investmentDate: '2024-01-15',
    expectedReturn: 25,
    expectedReturnAmount: 125000,
    interestRate: 0,
    totalPaidOut: 50000,
    pendingPayment: 75000,
    paymentMethod: 'wire',
    paymentStatus: 'paid',
    paymentFrequency: 'quarterly',
    status: 'active',
    lastPaymentDate: '2025-10-15'
  },
  {
    id: 2,
    name: 'Angel Investor Network',
    email: 'ain@example.com',
    investmentType: 'revenue_share',
    investmentAmount: 250000,
    investmentDate: '2024-06-20',
    expectedReturn: 30,
    expectedReturnAmount: 75000,
    interestRate: 0,
    totalPaidOut: 18000,
    pendingPayment: 57000,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'pending',
    paymentFrequency: 'monthly',
    status: 'active',
    lastPaymentDate: '2025-11-01'
  },
  {
    id: 3,
    name: 'Strategic Partners LLC',
    email: 'sp@example.com',
    investmentType: 'loan',
    investmentAmount: 300000,
    investmentDate: '2024-03-10',
    expectedReturn: 8,
    expectedReturnAmount: 24000,
    interestRate: 5,
    totalPaidOut: 35000,
    pendingPayment: 10000,
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    paymentFrequency: 'semi_annual',
    status: 'active',
    lastPaymentDate: '2025-10-01'
  }
];

const investmentChartData = [
  { month: 'Jan', invested: 500000, paid: 0, earned: 0 },
  { month: 'Feb', invested: 500000, paid: 0, earned: 5000 },
  { month: 'Mar', invested: 800000, paid: 12000, earned: 15000 },
  { month: 'Apr', invested: 800000, paid: 12000, earned: 18000 },
  { month: 'May', invested: 800000, paid: 25000, earned: 22000 },
  { month: 'Jun', invested: 1050000, paid: 25000, earned: 28000 },
  { month: 'Jul', invested: 1050000, paid: 38000, earned: 35000 },
  { month: 'Aug', invested: 1050000, paid: 50000, earned: 40000 },
  { month: 'Sep', invested: 1050000, paid: 50000, earned: 42000 },
  { month: 'Oct', invested: 1050000, paid: 103000, earned: 50000 },
  { month: 'Nov', invested: 1050000, paid: 103000, earned: 55000 },
];

export function InvestorSessions() {
  const [selectedInvestor, setSelectedInvestor] = useState<typeof MOCK_INVESTORS[0] | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'partial':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'equity':
        return 'bg-purple-500/20 text-purple-300';
      case 'debt':
        return 'bg-red-500/20 text-red-300';
      case 'revenue_share':
        return 'bg-green-500/20 text-green-300';
      case 'loan':
        return 'bg-blue-500/20 text-blue-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  const totalInvested = MOCK_INVESTORS.reduce((sum, i) => sum + parseFloat(i.investmentAmount.toString()), 0);
  const totalPaidOut = MOCK_INVESTORS.reduce((sum, i) => sum + parseFloat(i.totalPaidOut.toString()), 0);
  const totalPending = MOCK_INVESTORS.reduce((sum, i) => sum + parseFloat(i.pendingPayment.toString()), 0);
  const expectedReturns = MOCK_INVESTORS.reduce((sum, i) => sum + parseFloat(i.expectedReturnAmount.toString()), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Total Invested</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-400">${(totalInvested / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Paid Out</p>
            <p className="text-2xl md:text-3xl font-bold text-green-400">${(totalPaidOut / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Pending</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-400">${(totalPending / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Expected Returns</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-400">${(expectedReturns / 1000).toFixed(0)}k</p>
          </CardContent>
        </Card>
      </div>

      {/* Investment Growth Chart */}
      <Card className="bg-slate-900/50 border-slate-700 w-full">
        <CardHeader>
          <CardTitle className="text-orange-400 text-sm md:text-base">Investment Growth & Payouts</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <LineChart data={investmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} formatter={(value: any) => `$${value.toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="invested" stroke="#8B5CF6" strokeWidth={2} name="Total Invested" />
              <Line type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2} name="Paid Out" />
              <Line type="monotone" dataKey="earned" stroke="#F59E0B" strokeWidth={2} name="Earnings" />
            </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Investors Table */}
      <Card className="bg-slate-900/50 border-slate-700 w-full">
        <CardHeader>
          <CardTitle className="text-orange-400 text-sm md:text-base">Investor Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6 overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full text-xs md:text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/30">
                <tr>
                  <th className="text-left p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Investor</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Type</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Investment</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Paid</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Pending</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Expected</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Freq</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Status</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Pay</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INVESTORS.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-2 md:p-3 text-white font-medium text-xs md:text-sm whitespace-nowrap">{inv.name}</td>
                    <td className="p-2 md:p-3 text-center">
                      <Badge className={`${getTypeColor(inv.investmentType)} text-xs`} variant="outline">
                        {inv.investmentType.substring(0, 3)}
                      </Badge>
                    </td>
                    <td className="p-2 md:p-3 text-center text-white font-semibold text-xs md:text-sm whitespace-nowrap">${(inv.investmentAmount / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-green-300 text-xs md:text-sm whitespace-nowrap">${(inv.totalPaidOut / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-yellow-300 text-xs md:text-sm whitespace-nowrap">${(inv.pendingPayment / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-blue-300 text-xs md:text-sm whitespace-nowrap">${(inv.expectedReturnAmount / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-slate-300 capitalize text-xs whitespace-nowrap">{inv.paymentFrequency.substring(0, 4)}</td>
                    <td className="p-2 md:p-3 text-center">
                      <Badge className={`${getStatusColor(inv.paymentStatus)} text-xs`}>
                        {inv.paymentStatus}
                      </Badge>
                    </td>
                    <td className="p-2 md:p-3 text-center">
                      <Button size="sm" variant="ghost" className="text-orange-400 hover:bg-orange-500/10 p-1">
                        <Send className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Investor Details */}
      {selectedInvestor && (
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm md:text-base">Investment Details: {selectedInvestor.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Email</p>
                <p className="text-white font-mono">{selectedInvestor.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Investment Type</p>
                <Badge className={getTypeColor(selectedInvestor.investmentType)}>
                  {selectedInvestor.investmentType}
                </Badge>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Payment Method</p>
                <Badge className="bg-blue-500/20 text-blue-300 capitalize">{selectedInvestor.paymentMethod}</Badge>
              </div>
              {selectedInvestor.interestRate > 0 && (
                <div>
                  <p className="text-slate-400 text-sm">Interest Rate</p>
                  <p className="text-white text-lg font-bold flex items-center gap-2">
                    <Percent className="h-5 w-5 text-orange-400" />
                    {selectedInvestor.interestRate}%
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Expected Return</p>
                <p className="text-white text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  {selectedInvestor.expectedReturn}%
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Payment Frequency</p>
                <p className="text-white font-mono capitalize flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-400" />
                  {selectedInvestor.paymentFrequency}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Next Payment</p>
                <p className="text-white font-mono">2025-12-15</p>
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Send className="h-4 w-4 mr-2" />
                Send Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
