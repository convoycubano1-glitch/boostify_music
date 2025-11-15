/**
 * Rutas para Artist Wallet - Sistema de ganancias y créditos
 */
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { artistWallet, salesTransactions, walletTransactions } from '../../db/schema';
import { eq, desc, and, sql, gte } from 'drizzle-orm';

const router = Router();

/**
 * Obtener balance actual del wallet del artista
 */
router.get('/balance/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    // Buscar o crear wallet del artista
    let wallet = await db.query.artistWallet.findFirst({
      where: eq(artistWallet.userId, userId)
    });

    // Si no existe, crearlo
    if (!wallet) {
      const [newWallet] = await db.insert(artistWallet).values({
        userId,
        balance: '0',
        totalEarnings: '0',
        totalSpent: '0',
        currency: 'usd'
      }).returning();
      wallet = newWallet;
    }

    return res.json({
      success: true,
      wallet: {
        balance: parseFloat(wallet.balance),
        totalEarnings: parseFloat(wallet.totalEarnings),
        totalSpent: parseFloat(wallet.totalSpent),
        currency: wallet.currency,
        updatedAt: wallet.updatedAt
      }
    });
  } catch (error: any) {
    console.error('Error fetching wallet balance:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch wallet balance'
    });
  }
});

/**
 * Obtener historial de ganancias (últimos 30 días)
 */
router.get('/earnings-history/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const days = parseInt(req.query.days as string) || 30;
    
    // Calcular fecha límite
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - days);

    // Obtener ventas completadas
    const sales = await db.select()
      .from(salesTransactions)
      .where(
        and(
          eq(salesTransactions.artistId, userId),
          eq(salesTransactions.status, 'completed'),
          gte(salesTransactions.createdAt, limitDate)
        )
      )
      .orderBy(desc(salesTransactions.createdAt));

    // Agrupar por día para el gráfico
    const dailyEarnings = sales.reduce((acc: any[], sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.earnings += parseFloat(sale.artistEarning);
        existing.sales += 1;
      } else {
        acc.push({
          date,
          earnings: parseFloat(sale.artistEarning),
          sales: 1
        });
      }
      
      return acc;
    }, []);

    // Calcular totales
    const totalEarnings = sales.reduce((sum, sale) => sum + parseFloat(sale.artistEarning), 0);
    const totalSales = sales.length;

    return res.json({
      success: true,
      data: {
        dailyEarnings: dailyEarnings.reverse(), // Orden cronológico
        totalEarnings,
        totalSales,
        period: `${days} días`
      }
    });
  } catch (error: any) {
    console.error('Error fetching earnings history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch earnings history'
    });
  }
});

/**
 * Obtener transacciones del wallet
 */
router.get('/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 50;

    const transactions = await db.select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(limit);

    return res.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        amount: parseFloat(t.amount),
        balanceBefore: parseFloat(t.balanceBefore),
        balanceAfter: parseFloat(t.balanceAfter)
      }))
    });
  } catch (error: any) {
    console.error('Error fetching wallet transactions:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transactions'
    });
  }
});

/**
 * Obtener estadísticas de ventas
 */
router.get('/sales-stats/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    // Ventas totales
    const allSales = await db.select()
      .from(salesTransactions)
      .where(eq(salesTransactions.artistId, userId));

    const completedSales = allSales.filter(s => s.status === 'completed');
    const pendingSales = allSales.filter(s => s.status === 'pending');

    // Producto más vendido
    const productSales = completedSales.reduce((acc: any, sale) => {
      const product = sale.productName;
      if (!acc[product]) {
        acc[product] = { count: 0, earnings: 0 };
      }
      acc[product].count += sale.quantity;
      acc[product].earnings += parseFloat(sale.artistEarning);
      return acc;
    }, {});

    const topProduct = Object.entries(productSales)
      .sort((a: any, b: any) => b[1].count - a[1].count)[0];

    return res.json({
      success: true,
      stats: {
        totalSales: completedSales.length,
        pendingSales: pendingSales.length,
        totalRevenue: completedSales.reduce((sum, s) => sum + parseFloat(s.saleAmount), 0),
        totalEarnings: completedSales.reduce((sum, s) => sum + parseFloat(s.artistEarning), 0),
        topProduct: topProduct ? {
          name: topProduct[0],
          sales: topProduct[1].count,
          earnings: topProduct[1].earnings
        } : null
      }
    });
  } catch (error: any) {
    console.error('Error fetching sales stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sales stats'
    });
  }
});

export default router;
