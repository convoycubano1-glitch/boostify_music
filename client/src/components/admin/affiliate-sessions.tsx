import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { TrendingUp, Send, Users, Percent } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const MOCK_AFFILIATES = [
  {
    id: 1,
    name: 'Digital Marketing Pro',
    email: 'dmp@example.com',
    commissionRate: 15,
    totalSales: 45000,
    totalCommission: 6750,
    amountPaid: 4000,
    amountPending: 2750,
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    referrals: 23,
    conversions: 8,
    conversionRate: 34.78,
    lastPaymentDate: '2025-11-01'
  },
  {
    id: 2,
    name: 'Content Creator Elite',
    email: 'cce@example.com',
    commissionRate: 20,
    totalSales: 32000,
    totalCommission: 6400,
    amountPaid: 3200,
    amountPending: 3200,
    paymentMethod: 'paypal',
    paymentStatus: 'pending',
    referrals: 18,
    conversions: 6,
    conversionRate: 33.33,
    lastPaymentDate: '2025-10-20'
  },
  {
    id: 3,
    name: 'Music Industry Network',
    email: 'min@example.com',
    commissionRate: 12,
    totalSales: 68000,
    totalCommission: 8160,
    amountPaid: 6500,
    amountPending: 1660,
    paymentMethod: 'bank_transfer',
    paymentStatus: 'paid',
    referrals: 34,
    conversions: 11,
    conversionRate: 32.35,
    lastPaymentDate: '2025-11-10'
  },
];

const affiliateChartData = [
  { month: 'Jul', sales: 5000, commission: 750, paid: 500 },
  { month: 'Aug', sales: 7200, commission: 1080, paid: 800 },
  { month: 'Sep', sales: 8900, commission: 1335, paid: 1000 },
  { month: 'Oct', sales: 11200, commission: 1680, paid: 1500 },
  { month: 'Nov', sales: 12700, commission: 1905, paid: 1900 },
];

export function AffiliateSessions() {
  const [selectedAffiliate, setSelectedAffiliate] = useState<typeof MOCK_AFFILIATES[0] | null>(null);

  const totalCommission = MOCK_AFFILIATES.reduce((sum, a) => sum + parseFloat(a.totalCommission.toString()), 0);
  const totalPaid = MOCK_AFFILIATES.reduce((sum, a) => sum + parseFloat(a.amountPaid.toString()), 0);
  const totalPending = MOCK_AFFILIATES.reduce((sum, a) => sum + parseFloat(a.amountPending.toString()), 0);
  const totalReferrals = MOCK_AFFILIATES.reduce((sum, a) => sum + a.referrals, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Total Commission</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-400">${(totalCommission / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Paid Out</p>
            <p className="text-2xl md:text-3xl font-bold text-green-400">${(totalPaid / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Pending</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-400">${(totalPending / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4 md:pt-6 text-center">
            <p className="text-slate-400 text-xs md:text-sm mb-2">Referrals</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-400">{totalReferrals}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales & Commission Chart */}
      <Card className="bg-slate-900/50 border-slate-700 w-full">
        <CardHeader>
          <CardTitle className="text-orange-400 text-sm md:text-base">Affiliate Sales & Commissions</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <BarChart data={affiliateChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} formatter={(value: any) => `$${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="sales" fill="#FF8C00" name="Sales" />
              <Bar dataKey="commission" fill="#10B981" name="Commission" />
              <Bar dataKey="paid" fill="#3B82F6" name="Paid Out" />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card className="bg-slate-900/50 border-slate-700 w-full">
        <CardHeader>
          <CardTitle className="text-orange-400 text-sm md:text-base">Affiliate Payouts</CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6 overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full text-xs md:text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/30">
                <tr>
                  <th className="text-left p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Affiliate</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Comm%</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Sales</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Earned</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Paid</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Pending</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Refs</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Status</th>
                  <th className="text-center p-2 md:p-3 text-slate-400 whitespace-nowrap text-xs md:text-sm">Pay</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_AFFILIATES.map((aff) => (
                  <tr key={aff.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="p-2 md:p-3 text-white font-medium text-xs md:text-sm whitespace-nowrap">{aff.name}</td>
                    <td className="p-2 md:p-3 text-center"><Badge className="bg-orange-500/20 text-orange-300 text-xs">{aff.commissionRate}%</Badge></td>
                    <td className="p-2 md:p-3 text-center text-white text-xs md:text-sm whitespace-nowrap">${(aff.totalSales / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-white font-semibold text-xs md:text-sm whitespace-nowrap">${(aff.totalCommission / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-green-300 text-xs md:text-sm whitespace-nowrap">${(aff.amountPaid / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-yellow-300 text-xs md:text-sm whitespace-nowrap">${(aff.amountPending / 1000).toFixed(0)}k</td>
                    <td className="p-2 md:p-3 text-center text-blue-300 font-bold text-xs md:text-sm">{aff.referrals}</td>
                    <td className="p-2 md:p-3 text-center">
                      <Badge className={`${getStatusColor(aff.paymentStatus)} text-xs`}>
                        {aff.paymentStatus}
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

      {/* Affiliate Details */}
      {selectedAffiliate && (
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 border border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-400 text-sm md:text-base">Affiliate Details: {selectedAffiliate.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Email</p>
                <p className="text-white font-mono text-xs">{selectedAffiliate.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Commission Rate</p>
                <p className="text-white font-bold flex items-center gap-2">
                  <Percent className="h-5 w-5 text-orange-400" />
                  {selectedAffiliate.commissionRate}%
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Payment Method</p>
                <Badge className="bg-blue-500/20 text-blue-300 capitalize">{selectedAffiliate.paymentMethod}</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400 text-sm">Total Referrals</p>
                <p className="text-white text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-400" />
                  {selectedAffiliate.referrals}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Conversion Rate</p>
                <p className="text-white text-lg font-bold">{selectedAffiliate.conversionRate}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Last Payment</p>
                <p className="text-white font-mono text-sm">{selectedAffiliate.lastPaymentDate}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-green-300 text-sm">Total Earned</p>
                <p className="text-2xl font-bold text-green-400">${selectedAffiliate.totalCommission.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-yellow-300 text-sm">Pending Payout</p>
                <p className="text-2xl font-bold text-yellow-400">${selectedAffiliate.amountPending.toLocaleString()}</p>
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Send className="h-4 w-4 mr-2" />
                Send Payout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
