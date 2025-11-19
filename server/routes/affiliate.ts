import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { auth, db, FieldValue } from '../firebase';
import { z } from 'zod';

// Tipos de Firestore Admin
type Timestamp = FirebaseFirestore.Timestamp;
type DocumentData = FirebaseFirestore.DocumentData;

/**
 * Función para obtener el ID del usuario de forma segura
 * Si no hay usuario autenticado, devuelve un ID de prueba
 * @param req Solicitud HTTP
 * @returns ID del usuario o ID de prueba
 */
function getUserId(req: Request): string {
  return req.user?.id || "test-user-id";
}

// Interfaces para tipos de Firestore
interface AffiliateStats {
  totalClicks: number;
  conversions: number;
  earnings: number;
  pendingPayment: number;
}

interface AffiliateData {
  id: string;
  userId: string;
  name: string;
  bio: string;
  email?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  level: string;
  stats: AffiliateStats;
  createdAt: Timestamp;
}

interface AffiliateProduct {
  id: string;
  name: string;
  description?: string;
  url?: string;
  commissionRate: number;
  category?: string;
  imageUrl?: string;
}

/**
 * Genera un URL de afiliado con los parámetros de seguimiento
 */
function generateAffiliateUrl(baseUrl: string, affiliateId: string, linkId: string, utmParams: any): string {
  try {
    // Generar URL final - simplificado para redirección interna
    const trackingUrl = `/api/affiliate/track/${linkId}`;
    return trackingUrl;
  } catch (error) {
    console.error('Error al generar URL de afiliado:', error);
    return `/api/affiliate/track/${linkId}`;
  }
}

const router = express.Router();

// Esquema de validación para registro de afiliado
const affiliateRegistrationSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  bio: z.string().min(10, { message: "La biografía debe tener al menos 10 caracteres" }).max(500),
  email: z.string().email({ message: "Email inválido" }).optional(),
  website: z.string().url().optional().or(z.literal('')),
  socialMedia: z.object({
    instagram: z.string().optional().or(z.literal("")),
    twitter: z.string().optional().or(z.literal("")),
    youtube: z.string().optional().or(z.literal("")),
    tiktok: z.string().optional().or(z.literal(""))
  }).optional(),
  categories: z.array(z.string()).min(1, { message: "Debes seleccionar al menos una categoría" }),
  paymentMethod: z.enum(["paypal", "bank_transfer", "crypto"], { 
    required_error: "Debes seleccionar un método de pago" 
  }),
  paymentEmail: z.string().email({ message: "Email de pago inválido" }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones"
  }),
  dataProcessingAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar el acuerdo de procesamiento de datos"
  }),
});

type AffiliateRegistration = z.infer<typeof affiliateRegistrationSchema>;

// Esquema para creación de enlaces de afiliado
const affiliateLinkSchema = z.object({
  productId: z.string(),
  campaign: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

type AffiliateLink = z.infer<typeof affiliateLinkSchema>;

/**
 * GET /api/affiliate/me
 * Obtiene la información del afiliado actual
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(404).json({ success: false, message: 'No eres un afiliado registrado' });
    }
    
    // Obtener los enlaces de afiliado del usuario
    const linksSnapshot = await db.collection('affiliateLinks')
      .where('affiliateId', '==', userId)
      .get();
    
    const links = linksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
    
    const affiliateData = {
      id: affiliateDoc.id,
      ...affiliateDoc.data(),
      links
    };
    
    return res.status(200).json({ 
      success: true, 
      data: affiliateData 
    });
  } catch (error: any) {
    console.error('Error al obtener datos de afiliado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener datos de afiliado', 
      error: error.message 
    });
  }
});

/**
 * POST /api/affiliate/register
 * Registrar como afiliado
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Para fines de desarrollo, si no hay user autenticado, usamos un ID de usuario de prueba
    const userId = req.user?.id || "test-user-id";

    // Validar datos de entrada
    const validationResult = affiliateRegistrationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos', 
        errors: validationResult.error.format() 
      });
    }

    const data = validationResult.data;
    
    // Verificar si el usuario ya es un afiliado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (affiliateDoc.exists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ya estás registrado como afiliado' 
      });
    }
    
    // Obtener info del usuario desde Firebase Auth
    let userEmail = data.email; // Usar el email del formulario por defecto
    try {
      if (userId !== "test-user-id") {
        const userRecord = await auth.getUser(userId);
        userEmail = userRecord.email || data.email;
      }
    } catch (e) {
      console.log('Usuario de prueba, usando email del formulario');
    }
    
    // Crear el documento de afiliado
    await affiliateRef.set({
      ...data,
      userId: userId,
      email: userEmail,
      status: "pending", // pending, approved, rejected
      createdAt: FieldValue.serverTimestamp(),
      stats: {
        totalClicks: 0,
        conversions: 0,
        earnings: 0,
        pendingPayment: 0,
      },
      level: "Básico", // Básico, Plata, Oro, Platino
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'Solicitud de afiliado enviada correctamente',
      data: { id: userId }
    });
  } catch (error: any) {
    console.error('Error al registrar afiliado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al registrar afiliado', 
      error: error.message 
    });
  }
});

/**
 * GET /api/affiliate/products
 * Obtiene productos disponibles para afiliados
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    // Para fines de desarrollo, si no hay user autenticado, usamos un ID de usuario de prueba
    const userId = req.user?.id || "test-user-id";

    // Verificar si el usuario es un afiliado aprobado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    const affiliateData = affiliateDoc.data();
    if (affiliateData?.status !== 'approved' && affiliateData?.status !== 'pending') {
      return res.status(403).json({ 
        success: false, 
        message: 'Tu cuenta de afiliado no está activa' 
      });
    }
    
    // Obtener productos disponibles para afiliados
    const productsSnapshot = await db.collection('affiliateProducts').get();
    
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return res.status(200).json({ 
      success: true, 
      data: products 
    });
  } catch (error: any) {
    console.error('Error al obtener productos para afiliados:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener productos', 
      error: error.message 
    });
  }
});

/**
 * POST /api/affiliate/links
 * Crear un nuevo enlace de afiliado
 */
router.post('/links', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    // Validar datos de entrada
    const validationResult = affiliateLinkSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos inválidos', 
        errors: validationResult.error.format() 
      });
    }

    const data = validationResult.data;
    
    // Verificar si el usuario es un afiliado aprobado
    // Usamos el ID de usuario estandarizado
    const userId = req.user?.id || "test-user-id";
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    // Verificar si el producto existe
    const productRef = db.collection('affiliateProducts').doc(data.productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }
    
    const productData = productDoc.data();
    
    // Crear el enlace de afiliado
    const linkData = {
      affiliateId: userId,
      productId: data.productId,
      productName: productData?.name,
      productUrl: productData?.url,
      commissionRate: productData?.commissionRate,
      campaign: data.campaign || '',
      utmParams: {
        source: data.utmSource || 'boostify_affiliate',
        medium: data.utmMedium || 'affiliate',
        campaign: data.utmCampaign || data.campaign || 'partner',
      },
      clicks: 0,
      conversions: 0,
      earnings: 0,
      createdAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = await db.collection('affiliateLinks').add(linkData);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Enlace de afiliado creado correctamente',
      data: { 
        id: docRef.id,
        ...linkData,
        url: generateAffiliateUrl(productData?.url || '', userId, docRef.id, linkData.utmParams)
      }
    });
  } catch (error: any) {
    console.error('Error al crear enlace de afiliado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al crear enlace de afiliado', 
      error: error.message 
    });
  }
});

/**
 * GET /api/affiliate/links
 * Obtiene los enlaces de afiliado del usuario
 */
router.get('/links', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    // Verificar si el usuario es un afiliado
    const userId = getUserId(req);
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    // Obtener los enlaces de afiliado del usuario
    const linksSnapshot = await db.collection('affiliateLinks')
      .where('affiliateId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const links = await Promise.all(linksSnapshot.docs.map(async (linkDoc) => {
      const linkData = linkDoc.data();
      
      // Obtener datos actualizados del producto
      let productData: any = { name: linkData.productName, url: linkData.productUrl };
      
      try {
        const productRef = db.collection('affiliateProducts').doc(linkData.productId);
        const productDoc = await productRef.get();
        if (productDoc.exists) {
          productData = productDoc.data() || productData;
        }
      } catch (err) {
        console.error('Error al obtener datos del producto:', err);
      }
      
      return {
        id: linkDoc.id,
        ...linkData,
        createdAt: linkData.createdAt?.toDate?.() || new Date(),
        product: {
          id: linkData.productId,
          name: productData.name || linkData.productName,
          url: productData.url || linkData.productUrl,
          imageUrl: productData.imageUrl,
          commissionRate: productData.commissionRate || linkData.commissionRate
        },
        url: generateAffiliateUrl(
          linkData.productUrl || '', 
          userId, 
          linkDoc.id, 
          linkData.utmParams
        )
      };
    }));
    
    return res.status(200).json({ 
      success: true, 
      data: links 
    });
  } catch (error: any) {
    console.error('Error al obtener enlaces de afiliado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener enlaces de afiliado', 
      error: error.message 
    });
  }
});

/**
 * DELETE /api/affiliate/links/:id
 * Elimina un enlace de afiliado
 */
router.delete('/links/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const linkId = req.params.id;
    
    // Verificar si el enlace existe y pertenece al usuario
    const linkRef = db.collection('affiliateLinks').doc(linkId);
    const linkDoc = await linkRef.get();
    
    if (!linkDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enlace no encontrado' 
      });
    }
    
    const linkData = linkDoc.data();
    if (linkData?.affiliateId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para eliminar este enlace' 
      });
    }
    
    // Eliminar el enlace
    await linkRef.delete();
    
    return res.status(200).json({ 
      success: true, 
      message: 'Enlace eliminado correctamente' 
    });
  } catch (error: any) {
    console.error('Error al eliminar enlace de afiliado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar enlace de afiliado', 
      error: error.message 
    });
  }
});

/**
 * GET /api/affiliate/track/:linkId
 * Registra un clic en un enlace de afiliado y redirecciona
 * Esta ruta no requiere autenticación para permitir el seguimiento de enlaces
 */
router.get('/track/:linkId', async (req: Request, res: Response) => {
  try {
    const linkId = req.params.linkId;
    
    // Verificar si el enlace existe
    const linkRef = db.collection('affiliateLinks').doc(linkId);
    const linkDoc = await linkRef.get();
    
    if (!linkDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enlace no encontrado' 
      });
    }
    
    const linkData = linkDoc.data();
    
    // Registrar el clic
    await linkRef.update({
      clicks: FieldValue.increment(1)
    });
    
    // Registrar la analítica del clic
    await db.collection('affiliateClicks').add({
      linkId,
      affiliateId: linkData?.affiliateId,
      productId: linkData?.productId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer || '',
      timestamp: FieldValue.serverTimestamp()
    });
    
    // Actualizar el total de clics en el afiliado
    const affiliateRef = db.collection('affiliates').doc(linkData?.affiliateId);
    await affiliateRef.update({
      "stats.totalClicks": FieldValue.increment(1)
    });
    
    // Construir la URL de redirección
    let redirectUrl;
    try {
      redirectUrl = new URL(linkData?.productUrl || '');
      
      // Añadir parámetros UTM
      if (linkData?.utmParams) {
        if (linkData.utmParams.source) {
          redirectUrl.searchParams.append('utm_source', linkData.utmParams.source);
        }
        if (linkData.utmParams.medium) {
          redirectUrl.searchParams.append('utm_medium', linkData.utmParams.medium);
        }
        if (linkData.utmParams.campaign) {
          redirectUrl.searchParams.append('utm_campaign', linkData.utmParams.campaign);
        }
      }
      
      // Añadir identificadores de afiliado
      redirectUrl.searchParams.append('aff_id', linkData?.affiliateId || '');
      redirectUrl.searchParams.append('aff_link', linkId);
    } catch (error) {
      console.error('Error al construir URL de redirección:', error);
      return res.status(400).json({ 
        success: false, 
        message: 'URL de producto inválida' 
      });
    }
    
    // Redireccionar al usuario
    return res.redirect(redirectUrl.toString());
  } catch (error: any) {
    console.error('Error al registrar clic en enlace de afiliado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al procesar enlace de afiliado', 
      error: error.message 
    });
  }
});

/**
 * POST /api/affiliate/conversions
 * Registra una conversión de afiliado (puede ser llamado desde un webhook)
 */
router.post('/conversions', async (req: Request, res: Response) => {
  try {
    const { affiliateId, linkId, productId, orderId, amount } = req.body;
    
    if (!affiliateId || !productId || !orderId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos incompletos para registrar conversión' 
      });
    }
    
    // Verificar si el afiliado existe
    const affiliateRef = db.collection('affiliates').doc(affiliateId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Afiliado no encontrado' 
      });
    }
    
    // Obtener la tasa de comisión
    let commissionRate = 0.1; // Tasa por defecto (10%)
    
    // Si tenemos un ID de enlace, usar su tasa de comisión
    if (linkId) {
      const linkRef = db.collection('affiliateLinks').doc(linkId);
      const linkDoc = await linkRef.get();
      
      if (linkDoc.exists) {
        const linkData = linkDoc.data();
        commissionRate = linkData?.commissionRate || commissionRate;
        
        // Actualizar estadísticas del enlace
        await linkRef.update({
          conversions: FieldValue.increment(1),
          earnings: FieldValue.increment(amount * commissionRate)
        });
      }
    }
    
    // Calcular la comisión
    const commission = amount * commissionRate;
    
    // Registrar la conversión
    const conversionRef = await db.collection('affiliateConversions').add({
      affiliateId,
      linkId,
      productId,
      orderId,
      amount,
      commission,
      commissionRate,
      status: "pending", // pending, paid, cancelled
      createdAt: FieldValue.serverTimestamp()
    });
    
    // Actualizar estadísticas del afiliado
    await affiliateRef.update({
      "stats.conversions": FieldValue.increment(1),
      "stats.earnings": FieldValue.increment(commission),
      "stats.pendingPayment": FieldValue.increment(commission)
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'Conversión registrada correctamente',
      data: {
        id: conversionRef.id,
        commission,
        status: "pending"
      }
    });
  } catch (error: any) {
    console.error('Error al registrar conversión:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al registrar conversión', 
      error: error.message 
    });
  }
});

/**
 * GET /api/affiliate/earnings
 * Obtiene el historial de ganancias del afiliado
 */
router.get('/earnings', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    
    // Verificar si el usuario es un afiliado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    // Obtener las conversiones del afiliado
    const conversionsSnapshot = await db.collection('affiliateConversions')
      .where('affiliateId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const conversions = conversionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
    
    // Obtener los clics del afiliado (limitados a los últimos 100)
    const clicksSnapshot = await db.collection('affiliateClicks')
      .where('affiliateId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();
    
    const clicks = clicksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || new Date()
    }));
    
    // Calcular estadísticas mensuales
    const stats = calculateMonthlyEarnings(conversions);
    
    // Agregar información sobre el próximo pago
    const affiliateData = affiliateDoc.data();
    const nextPayment = {
      date: getNextPaymentDate(),
      amount: affiliateData?.stats?.pendingPayment || 0
    };
    
    return res.status(200).json({
      success: true,
      data: {
        conversions,
        clicks,
        monthly: stats,
        nextPayment,
        stats: affiliateData?.stats
      }
    });
  } catch (error: any) {
    console.error('Error al obtener historial de ganancias:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener historial de ganancias', 
      error: error.message 
    });
  }
});

/**
 * PATCH /api/affiliate/settings/payment
 * Actualiza la configuración de pago del afiliado
 */
router.patch('/settings/payment', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const {
      paymentMethod,
      paymentEmail,
      bankDetails,
      cryptoAddress,
      minPayoutAmount,
      autoPayoutEnabled
    } = req.body;

    // Verificar si el usuario es un afiliado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }

    // Actualizar la configuración de pago
    await affiliateRef.update({
      paymentSettings: {
        paymentMethod,
        paymentEmail,
        bankDetails,
        cryptoAddress,
        minPayoutAmount: minPayoutAmount || 50,
        autoPayoutEnabled: autoPayoutEnabled !== undefined ? autoPayoutEnabled : true,
        updatedAt: FieldValue.serverTimestamp()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Configuración de pago actualizada correctamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar configuración de pago:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de pago',
      error: error.message
    });
  }
});

/**
 * GET /api/affiliate/stats
 * Obtiene estadísticas resumidas del afiliado
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    
    // Verificar si el usuario es un afiliado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }

    const affiliateData = affiliateDoc.data();

    // Obtener número de links activos
    const linksSnapshot = await db.collection('affiliateLinks')
      .where('affiliateId', '==', userId)
      .get();
    
    // Obtener conversiones del último mes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const recentConversionsSnapshot = await db.collection('affiliateConversions')
      .where('affiliateId', '==', userId)
      .where('createdAt', '>=', lastMonth)
      .get();

    return res.status(200).json({
      success: true,
      data: {
        stats: affiliateData?.stats || {
          totalClicks: 0,
          conversions: 0,
          earnings: 0,
          pendingPayment: 0
        },
        activeLinks: linksSnapshot.size,
        recentConversions: recentConversionsSnapshot.size,
        level: affiliateData?.level || 'Básico',
        status: affiliateData?.status || 'pending'
      }
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

/**
 * POST /api/affiliate/coupons
 * Crear cupón de descuento exclusivo para afiliado
 */
router.post('/coupons', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const { code, discount, type, expiresAt, productIds } = req.body;

    // Verificar si el usuario es un afiliado aprobado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists || affiliateDoc.data()?.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo afiliados aprobados pueden crear cupones' 
      });
    }

    // Verificar que el código no exista
    const existingCoupon = await db.collection('affiliateCoupons')
      .where('code', '==', code)
      .get();
    
    if (!existingCoupon.empty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Este código de cupón ya existe' 
      });
    }

    // Crear el cupón
    const couponData = {
      affiliateId: userId,
      code: code.toUpperCase(),
      discount: discount || 10,
      type: type || 'percentage', // 'percentage' o 'fixed'
      productIds: productIds || [],
      usageCount: 0,
      usageLimit: req.body.usageLimit || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: true,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('affiliateCoupons').add(couponData);

    return res.status(201).json({
      success: true,
      message: 'Cupón creado correctamente',
      data: { id: docRef.id, ...couponData }
    });
  } catch (error: any) {
    console.error('Error al crear cupón:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear cupón',
      error: error.message
    });
  }
});

/**
 * GET /api/affiliate/coupons
 * Obtener cupones del afiliado
 */
router.get('/coupons', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);

    const couponsSnapshot = await db.collection('affiliateCoupons')
      .where('affiliateId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const coupons = couponsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    return res.status(200).json({
      success: true,
      data: coupons
    });
  } catch (error: any) {
    console.error('Error al obtener cupones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener cupones',
      error: error.message
    });
  }
});

/**
 * POST /api/affiliate/promotions
 * Crear promoción especial para afiliado
 */
router.post('/promotions', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const { name, description, productIds, bonusCommission, startDate, endDate, requirements } = req.body;

    // Verificar si el usuario es un afiliado aprobado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists || affiliateDoc.data()?.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo afiliados aprobados pueden crear promociones' 
      });
    }

    const promotionData = {
      affiliateId: userId,
      name,
      description,
      productIds: productIds || [],
      bonusCommission: bonusCommission || 5, // Comisión adicional en %
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      requirements: requirements || {
        minSales: 0,
        minRevenue: 0
      },
      active: true,
      stats: {
        sales: 0,
        revenue: 0,
        bonusEarned: 0
      },
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('affiliatePromotions').add(promotionData);

    return res.status(201).json({
      success: true,
      message: 'Promoción creada correctamente',
      data: { id: docRef.id, ...promotionData }
    });
  } catch (error: any) {
    console.error('Error al crear promoción:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear promoción',
      error: error.message
    });
  }
});

/**
 * GET /api/affiliate/promotions
 * Obtener promociones del afiliado
 */
router.get('/promotions', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);

    const promotionsSnapshot = await db.collection('affiliatePromotions')
      .where('affiliateId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const promotions = promotionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      startDate: doc.data().startDate?.toDate?.() || new Date(),
      endDate: doc.data().endDate?.toDate?.() || null
    }));

    return res.status(200).json({
      success: true,
      data: promotions
    });
  } catch (error: any) {
    console.error('Error al obtener promociones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener promociones',
      error: error.message
    });
  }
});

/**
 * POST /api/affiliate/links/:id/qr
 * Generar código QR para un enlace de afiliado
 */
router.post('/links/:id/qr', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const linkId = req.params.id;
    const { size = 300, color = '#000000', backgroundColor = '#FFFFFF' } = req.body;

    // Verificar que el enlace existe y pertenece al usuario
    const linkRef = db.collection('affiliateLinks').doc(linkId);
    const linkDoc = await linkRef.get();
    
    if (!linkDoc.exists || linkDoc.data()?.affiliateId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Enlace no encontrado o no autorizado' 
      });
    }

    const linkData = linkDoc.data();
    const trackingUrl = `${req.protocol}://${req.get('host')}/api/affiliate/track/${linkId}`;

    // Generar URL de código QR usando API pública
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(trackingUrl)}&color=${color.replace('#', '')}&bgcolor=${backgroundColor.replace('#', '')}`;

    // Guardar información del QR
    await linkRef.update({
      qrCode: {
        url: qrCodeUrl,
        size,
        color,
        backgroundColor,
        generatedAt: FieldValue.serverTimestamp()
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        qrCodeUrl,
        trackingUrl,
        linkId
      }
    });
  } catch (error: any) {
    console.error('Error al generar código QR:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar código QR',
      error: error.message
    });
  }
});

/**
 * POST /api/affiliate/referrals
 * Registrar un referido de segundo nivel
 */
router.post('/referrals', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const { referredUserId, referredEmail } = req.body;

    // Verificar si el usuario es un afiliado aprobado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists || affiliateDoc.data()?.status !== 'approved') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo afiliados aprobados pueden referir usuarios' 
      });
    }

    // Crear el referido
    const referralData = {
      referrerId: userId,
      referredUserId: referredUserId || null,
      referredEmail: referredEmail,
      status: 'pending', // pending, active, converted
      level: 2, // Nivel de referido
      commissionEarned: 0,
      createdAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('affiliateReferrals').add(referralData);

    return res.status(201).json({
      success: true,
      message: 'Referido registrado correctamente',
      data: { id: docRef.id, ...referralData }
    });
  } catch (error: any) {
    console.error('Error al registrar referido:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar referido',
      error: error.message
    });
  }
});

/**
 * GET /api/affiliate/referrals
 * Obtener referidos del afiliado
 */
router.get('/referrals', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);

    const referralsSnapshot = await db.collection('affiliateReferrals')
      .where('referrerId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const referrals = referralsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    // Calcular estadísticas
    const stats = {
      total: referrals.length,
      active: referrals.filter((r: any) => r.status === 'active').length,
      converted: referrals.filter((r: any) => r.status === 'converted').length,
      totalEarned: referrals.reduce((sum: number, r: any) => sum + (r.commissionEarned || 0), 0)
    };

    return res.status(200).json({
      success: true,
      data: {
        referrals,
        stats
      }
    });
  } catch (error: any) {
    console.error('Error al obtener referidos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener referidos',
      error: error.message
    });
  }
});

/**
 * GET /api/affiliate/badges
 * Obtener badges/logros del afiliado
 */
router.get('/badges', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);

    // Obtener datos del afiliado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No eres un afiliado registrado' 
      });
    }

    const affiliateData = affiliateDoc.data();
    const stats = affiliateData?.stats || {};

    // Definir badges disponibles
    const allBadges = [
      {
        id: 'first_sale',
        name: 'Primera Venta',
        description: 'Realizaste tu primera venta como afiliado',
        icon: '🎯',
        earned: stats.conversions >= 1,
        requirement: '1 conversión',
        progress: Math.min(stats.conversions, 1)
      },
      {
        id: 'sales_10',
        name: 'Vendedor Emergente',
        description: 'Alcanzaste 10 ventas',
        icon: '🚀',
        earned: stats.conversions >= 10,
        requirement: '10 conversiones',
        progress: Math.min(stats.conversions, 10)
      },
      {
        id: 'sales_50',
        name: 'Vendedor Estrella',
        description: 'Alcanzaste 50 ventas',
        icon: '⭐',
        earned: stats.conversions >= 50,
        requirement: '50 conversiones',
        progress: Math.min(stats.conversions, 50)
      },
      {
        id: 'sales_100',
        name: 'Vendedor Elite',
        description: 'Alcanzaste 100 ventas',
        icon: '👑',
        earned: stats.conversions >= 100,
        requirement: '100 conversiones',
        progress: Math.min(stats.conversions, 100)
      },
      {
        id: 'earnings_1000',
        name: 'Primer Millar',
        description: 'Ganaste $1,000 en comisiones',
        icon: '💰',
        earned: stats.earnings >= 1000,
        requirement: '$1,000 en ganancias',
        progress: Math.min(stats.earnings, 1000)
      },
      {
        id: 'earnings_5000',
        name: 'Generador de Ingresos',
        description: 'Ganaste $5,000 en comisiones',
        icon: '💎',
        earned: stats.earnings >= 5000,
        requirement: '$5,000 en ganancias',
        progress: Math.min(stats.earnings, 5000)
      },
      {
        id: 'clicks_1000',
        name: 'Influencer',
        description: 'Generaste 1,000 clics en tus enlaces',
        icon: '🔥',
        earned: stats.totalClicks >= 1000,
        requirement: '1,000 clics',
        progress: Math.min(stats.totalClicks, 1000)
      },
      {
        id: 'referrer',
        name: 'Reclutador',
        description: 'Referiste a 5 afiliados exitosos',
        icon: '🤝',
        earned: false, // Requiere lógica adicional de referidos
        requirement: '5 referidos activos',
        progress: 0
      }
    ];

    // Obtener badges ya desbloqueados del usuario
    const earnedBadges = allBadges.filter(badge => badge.earned);
    const lockedBadges = allBadges.filter(badge => !badge.earned);

    return res.status(200).json({
      success: true,
      data: {
        earnedBadges,
        lockedBadges,
        totalBadges: allBadges.length,
        earnedCount: earnedBadges.length
      }
    });
  } catch (error: any) {
    console.error('Error al obtener badges:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener badges',
      error: error.message
    });
  }
});

/**
 * GET /api/affiliate/marketing-materials
 * Obtener materiales de marketing disponibles
 */
router.get('/marketing-materials', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);

    // Verificar si el usuario es un afiliado
    const affiliateRef = db.collection('affiliates').doc(userId);
    const affiliateDoc = await affiliateRef.get();
    
    if (!affiliateDoc.exists) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }

    const materials = [
      {
        id: 'banner_1',
        type: 'banner',
        name: 'Banner Principal 728x90',
        description: 'Banner horizontal para sitios web',
        dimensions: '728x90',
        url: '/assets/marketing/banner-728x90.png',
        downloadUrl: '/api/affiliate/download/banner-728x90.png'
      },
      {
        id: 'banner_2',
        type: 'banner',
        name: 'Banner Cuadrado 300x250',
        description: 'Banner para sidebar',
        dimensions: '300x250',
        url: '/assets/marketing/banner-300x250.png',
        downloadUrl: '/api/affiliate/download/banner-300x250.png'
      },
      {
        id: 'social_1',
        type: 'social',
        name: 'Post Instagram',
        description: 'Imagen para Instagram 1080x1080',
        dimensions: '1080x1080',
        url: '/assets/marketing/instagram-post.png',
        downloadUrl: '/api/affiliate/download/instagram-post.png'
      },
      {
        id: 'email_1',
        type: 'template',
        name: 'Plantilla de Email',
        description: 'Template HTML para campañas de email',
        format: 'HTML',
        url: '/assets/marketing/email-template.html',
        downloadUrl: '/api/affiliate/download/email-template.html'
      },
      {
        id: 'video_1',
        type: 'video',
        name: 'Video Promocional',
        description: 'Video promocional de 30 segundos',
        duration: '30s',
        url: '/assets/marketing/promo-video.mp4',
        downloadUrl: '/api/affiliate/download/promo-video.mp4'
      }
    ];

    return res.status(200).json({
      success: true,
      data: materials
    });
  } catch (error: any) {
    console.error('Error al obtener materiales de marketing:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener materiales de marketing',
      error: error.message
    });
  }
});

/**
 * POST /api/affiliate/notifications/subscribe
 * Suscribirse a notificaciones de afiliado
 */
router.post('/notifications/subscribe', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = getUserId(req);
    const { channels, preferences } = req.body;

    // Actualizar preferencias de notificación
    const affiliateRef = db.collection('affiliates').doc(userId);
    await affiliateRef.update({
      notificationPreferences: {
        channels: channels || ['email', 'in_app'],
        newSale: preferences?.newSale !== undefined ? preferences.newSale : true,
        newClick: preferences?.newClick !== undefined ? preferences.newClick : false,
        paymentProcessed: preferences?.paymentProcessed !== undefined ? preferences.paymentProcessed : true,
        newPromotion: preferences?.newPromotion !== undefined ? preferences.newPromotion : true,
        weeklyReport: preferences?.weeklyReport !== undefined ? preferences.weeklyReport : true,
        updatedAt: FieldValue.serverTimestamp()
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Preferencias de notificación actualizadas'
    });
  } catch (error: any) {
    console.error('Error al actualizar notificaciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar notificaciones',
      error: error.message
    });
  }
});

/**
 * Calcula la fecha del próximo pago de afiliados (ejemplo: día 15 del mes siguiente)
 */
function getNextPaymentDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  return nextMonth;
}

/**
 * Calcula las ganancias mensuales basadas en las conversiones
 */
function calculateMonthlyEarnings(conversions: any[]): Record<string, number> {
  const monthlyEarnings: Record<string, number> = {};
  
  conversions.forEach(conversion => {
    const date = conversion.createdAt;
    if (!date) return;
    
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyEarnings[monthKey]) {
      monthlyEarnings[monthKey] = 0;
    }
    
    monthlyEarnings[monthKey] += conversion.commission || 0;
  });
  
  return monthlyEarnings;
}

export default router;
