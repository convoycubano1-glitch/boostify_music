/**
 * Admin User Management Routes
 * 
 * Gestión de usuarios, roles y permisos desde el panel de administración
 * Solo accesible por administradores
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, userRoles, subscriptions } from '../db/schema';
import { eq, desc, sql, like, or, and, isNull } from 'drizzle-orm';
import { isAdminEmail } from '../../shared/constants';

const router = Router();

/**
 * Middleware para verificar acceso de admin
 */
function requireAdmin(req: Request, res: Response, next: Function) {
  const userEmail = req.user?.email;
  
  if (!userEmail || !isAdminEmail(userEmail)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    });
  }
  
  next();
}

// Aplicar middleware a todas las rutas
router.use(requireAdmin);

/**
 * GET /api/admin/users - Obtener lista de usuarios con roles y suscripciones
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      search = '', 
      role = '',
      subscription = '' 
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    
    // Construir query base
    let query = db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        clerkId: users.clerkId,
        createdAt: users.createdAt,
        role: userRoles.role,
        permissions: userRoles.permissions,
        roleGrantedAt: userRoles.grantedAt,
        subscriptionPlan: subscriptions.plan,
        subscriptionStatus: subscriptions.status,
        subscriptionEnd: subscriptions.currentPeriodEnd,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId));
    
    // Aplicar filtros
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      );
    }
    
    if (role) {
      conditions.push(eq(userRoles.role, role as string));
    }
    
    if (subscription) {
      if (subscription === 'none') {
        conditions.push(isNull(subscriptions.plan));
      } else {
        conditions.push(eq(subscriptions.plan, subscription as string));
      }
    }
    
    // Ejecutar query con filtros
    const usersData = await query
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limitNum)
      .offset(offset);
    
    // Contar total
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = totalResult[0]?.count || 0;
    
    res.json({
      success: true,
      users: usersData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Error fetching users' });
  }
});

/**
 * GET /api/admin/users/:id - Obtener detalle de usuario
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    const userData = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        clerkId: users.clerkId,
        createdAt: users.createdAt,
        role: userRoles.role,
        permissions: userRoles.permissions,
        roleGrantedAt: userRoles.grantedAt,
        roleGrantedBy: userRoles.grantedBy,
        subscriptionId: subscriptions.id,
        subscriptionPlan: subscriptions.plan,
        subscriptionStatus: subscriptions.status,
        subscriptionStart: subscriptions.currentPeriodStart,
        subscriptionEnd: subscriptions.currentPeriodEnd,
        stripeCustomerId: subscriptions.stripeCustomerId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .leftJoin(subscriptions, eq(users.id, subscriptions.userId))
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userData.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: userData[0]
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Error fetching user' });
  }
});

/**
 * POST /api/admin/users/:id/role - Asignar o actualizar rol de usuario
 */
router.post('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { role, permissions = [] } = req.body;
    const adminUserId = req.user?.id;
    
    // Validar rol
    const validRoles = ['user', 'moderator', 'support', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }
    
    // Verificar que el usuario existe
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (userExists.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Verificar si ya tiene un rol asignado
    const existingRole = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .limit(1);
    
    if (existingRole.length > 0) {
      // Actualizar rol existente
      await db
        .update(userRoles)
        .set({
          role,
          permissions,
          grantedBy: adminUserId,
          updatedAt: new Date()
        })
        .where(eq(userRoles.userId, userId));
    } else {
      // Crear nuevo rol
      await db
        .insert(userRoles)
        .values({
          userId,
          role,
          permissions,
          grantedBy: adminUserId,
          grantedAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    res.json({
      success: true,
      message: `Role '${role}' assigned to user ${userId}`
    });
    
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ success: false, error: 'Error assigning role' });
  }
});

/**
 * DELETE /api/admin/users/:id/role - Remover rol de usuario (volver a 'user')
 */
router.delete('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    await db
      .delete(userRoles)
      .where(eq(userRoles.userId, userId));
    
    res.json({
      success: true,
      message: `Role removed from user ${userId}, reverted to default 'user' role`
    });
    
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ success: false, error: 'Error removing role' });
  }
});

/**
 * POST /api/admin/users/:id/subscription - Asignar suscripción manualmente
 */
router.post('/users/:id/subscription', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { plan, status = 'active', durationDays = 30 } = req.body;
    
    // Validar plan
    const validPlans = ['free', 'creator', 'professional', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` 
      });
    }
    
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    // Verificar si ya tiene suscripción
    const existingSub = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    
    if (existingSub.length > 0) {
      // Actualizar suscripción existente
      await db
        .update(subscriptions)
        .set({
          plan,
          status,
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
          updatedAt: now
        })
        .where(eq(subscriptions.userId, userId));
    } else {
      // Crear nueva suscripción
      await db
        .insert(subscriptions)
        .values({
          userId,
          plan,
          status,
          currentPeriodStart: now,
          currentPeriodEnd: endDate,
          cancelAtPeriodEnd: false,
          interval: 'monthly',
          isTrial: false,
          createdAt: now,
          updatedAt: now
        });
    }
    
    res.json({
      success: true,
      message: `Subscription '${plan}' assigned to user ${userId} until ${endDate.toISOString()}`
    });
    
  } catch (error) {
    console.error('Error assigning subscription:', error);
    res.status(500).json({ success: false, error: 'Error assigning subscription' });
  }
});

/**
 * GET /api/admin/roles - Obtener estadísticas de roles
 */
router.get('/roles', async (req: Request, res: Response) => {
  try {
    // Contar usuarios por rol
    const roleStats = await db
      .select({
        role: userRoles.role,
        count: sql<number>`count(*)::int`
      })
      .from(userRoles)
      .groupBy(userRoles.role);
    
    // Contar usuarios sin rol asignado
    const usersWithoutRole = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .leftJoin(userRoles, eq(users.id, userRoles.userId))
      .where(isNull(userRoles.id));
    
    // Total de usuarios
    const totalUsers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    
    res.json({
      success: true,
      stats: {
        byRole: roleStats,
        usersWithoutRole: usersWithoutRole[0]?.count || 0,
        totalUsers: totalUsers[0]?.count || 0
      },
      availableRoles: [
        { value: 'user', label: 'User', description: 'Standard user access' },
        { value: 'moderator', label: 'Moderator', description: 'Can moderate content and users' },
        { value: 'support', label: 'Support', description: 'Customer support access' },
        { value: 'admin', label: 'Admin', description: 'Full administrative access' }
      ],
      availablePermissions: [
        'manage_users',
        'manage_content',
        'manage_subscriptions',
        'view_analytics',
        'manage_artists',
        'manage_courses',
        'manage_payments',
        'view_accounting',
        'api_access',
        'export_data'
      ]
    });
    
  } catch (error) {
    console.error('Error fetching role stats:', error);
    res.status(500).json({ success: false, error: 'Error fetching role stats' });
  }
});

/**
 * GET /api/admin/subscriptions/stats - Estadísticas de suscripciones
 */
router.get('/subscriptions/stats', async (req: Request, res: Response) => {
  try {
    // Contar por plan
    const planStats = await db
      .select({
        plan: subscriptions.plan,
        status: subscriptions.status,
        count: sql<number>`count(*)::int`
      })
      .from(subscriptions)
      .groupBy(subscriptions.plan, subscriptions.status);
    
    // Total activas
    const activeCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));
    
    res.json({
      success: true,
      stats: {
        byPlanAndStatus: planStats,
        totalActive: activeCount[0]?.count || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ success: false, error: 'Error fetching subscription stats' });
  }
});

export default router;
