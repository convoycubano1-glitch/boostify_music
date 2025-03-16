import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { auth, db } from '../firebase';

/**
 * Función para obtener el ID del usuario de forma segura
 * Si no hay usuario autenticado, devuelve un ID de prueba
 * @param req Solicitud HTTP
 * @returns ID del usuario o ID de prueba
 */
function getUserId(req: Request): string {
  return req.user?.id || "test-user-id";
}
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  increment,
  Timestamp,
  DocumentData,
  CollectionReference,
  deleteDoc
} from 'firebase/firestore';
import { z } from 'zod';

const router = express.Router();

// Esquema de validación para registro de afiliado
const affiliateRegistrationSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  socialMedia: z.object({
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
  }).optional(),
  promotionChannels: z.array(z.string()),
  categories: z.array(z.string()),
  experience: z.string(),
  paymentMethod: z.string(),
  taxId: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "Debes aceptar los términos y condiciones"
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
    const affiliateRef = doc(db, "affiliates", userId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (!affiliateDoc.exists()) {
      return res.status(404).json({ success: false, message: 'No eres un afiliado registrado' });
    }
    
    // Obtener los enlaces de afiliado del usuario
    const linksRef = collection(db, "affiliateLinks");
    const q = query(linksRef, where("affiliateId", "==", userId));
    const linksSnapshot = await getDocs(q);
    
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
    const affiliateRef = doc(db, "affiliates", userId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (affiliateDoc.exists()) {
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
    await setDoc(affiliateRef, {
      ...data,
      userId: userId,
      email: userEmail,
      status: "pending", // pending, approved, rejected
      createdAt: serverTimestamp(),
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
    const affiliateRef = doc(db, "affiliates", userId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (!affiliateDoc.exists()) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    const affiliateData = affiliateDoc.data();
    if (affiliateData.status !== 'approved' && affiliateData.status !== 'pending') {
      return res.status(403).json({ 
        success: false, 
        message: 'Tu cuenta de afiliado no está activa' 
      });
    }
    
    // Obtener productos disponibles para afiliados
    const productsRef = collection(db, "affiliateProducts");
    const productsSnapshot = await getDocs(productsRef);
    
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
    const affiliateRef = doc(db, "affiliates", userId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (!affiliateDoc.exists()) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    // Verificar si el producto existe
    const productRef = doc(db, "affiliateProducts", data.productId);
    const productDoc = await getDoc(productRef);
    
    if (!productDoc.exists()) {
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
      productName: productData.name,
      productUrl: productData.url,
      commissionRate: productData.commissionRate,
      campaign: data.campaign || '',
      utmParams: {
        source: data.utmSource || 'boostify_affiliate',
        medium: data.utmMedium || 'affiliate',
        campaign: data.utmCampaign || data.campaign || 'partner',
      },
      clicks: 0,
      conversions: 0,
      earnings: 0,
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "affiliateLinks"), linkData);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Enlace de afiliado creado correctamente',
      data: { 
        id: docRef.id,
        ...linkData,
        url: generateAffiliateUrl(productData.url, userId, docRef.id, linkData.utmParams)
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
    const affiliateRef = doc(db, "affiliates", userId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (!affiliateDoc.exists()) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    // Obtener los enlaces de afiliado del usuario
    const linksRef = collection(db, "affiliateLinks");
    const q = query(
      linksRef, 
      where("affiliateId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const linksSnapshot = await getDocs(q);
    
    const links = await Promise.all(linksSnapshot.docs.map(async (linkDoc) => {
      const linkData = linkDoc.data();
      
      // Obtener datos actualizados del producto
      let productData: DocumentData = { name: linkData.productName, url: linkData.productUrl };
      
      try {
        const productRef = doc(db, "affiliateProducts", linkData.productId);
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          productData = productDoc.data();
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
          linkData.productUrl, 
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
    const linkRef = doc(db, "affiliateLinks", linkId);
    const linkDoc = await getDoc(linkRef);
    
    if (!linkDoc.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enlace no encontrado' 
      });
    }
    
    const linkData = linkDoc.data();
    if (linkData.affiliateId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para eliminar este enlace' 
      });
    }
    
    // Eliminar el enlace
    await deleteDoc(doc(db, "affiliateLinks", linkId));
    
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
    const linkRef = doc(db, "affiliateLinks", linkId);
    const linkDoc = await getDoc(linkRef);
    
    if (!linkDoc.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'Enlace no encontrado' 
      });
    }
    
    const linkData = linkDoc.data();
    
    // Registrar el clic
    await updateDoc(linkRef, {
      clicks: increment(1)
    });
    
    // Registrar la analítica del clic
    await addDoc(collection(db, "affiliateClicks"), {
      linkId,
      affiliateId: linkData.affiliateId,
      productId: linkData.productId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer || '',
      timestamp: serverTimestamp()
    });
    
    // Actualizar el total de clics en el afiliado
    const affiliateRef = doc(db, "affiliates", linkData.affiliateId);
    await updateDoc(affiliateRef, {
      "stats.totalClicks": increment(1)
    });
    
    // Construir la URL de redirección
    const redirectUrl = new URL(linkData.productUrl);
    
    // Añadir parámetros UTM
    if (linkData.utmParams) {
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
    redirectUrl.searchParams.append('aff_id', linkData.affiliateId);
    redirectUrl.searchParams.append('aff_link', linkId);
    
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
    const affiliateRef = doc(db, "affiliates", affiliateId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (!affiliateDoc.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'Afiliado no encontrado' 
      });
    }
    
    // Obtener la tasa de comisión
    let commissionRate = 0.1; // Tasa por defecto (10%)
    
    // Si tenemos un ID de enlace, usar su tasa de comisión
    if (linkId) {
      const linkRef = doc(db, "affiliateLinks", linkId);
      const linkDoc = await getDoc(linkRef);
      
      if (linkDoc.exists()) {
        const linkData = linkDoc.data();
        commissionRate = linkData.commissionRate || commissionRate;
        
        // Actualizar estadísticas del enlace
        await updateDoc(linkRef, {
          conversions: increment(1),
          earnings: increment(amount * commissionRate)
        });
      }
    }
    
    // Calcular la comisión
    const commission = amount * commissionRate;
    
    // Registrar la conversión
    const conversionRef = await addDoc(collection(db, "affiliateConversions"), {
      affiliateId,
      linkId,
      productId,
      orderId,
      amount,
      commission,
      commissionRate,
      status: "pending", // pending, paid, cancelled
      createdAt: serverTimestamp()
    });
    
    // Actualizar estadísticas del afiliado
    await updateDoc(affiliateRef, {
      "stats.conversions": increment(1),
      "stats.earnings": increment(commission),
      "stats.pendingPayment": increment(commission)
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'Conversión registrada correctamente',
      data: { 
        id: conversionRef.id,
        commission
      }
    });
  } catch (error: any) {
    console.error('Error al registrar conversión de afiliado:', error);
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
    const affiliateRef = doc(db, "affiliates", userId);
    const affiliateDoc = await getDoc(affiliateRef);
    
    if (!affiliateDoc.exists()) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos de afiliado' 
      });
    }
    
    // Obtener conversiones del afiliado
    const conversionsRef = collection(db, "affiliateConversions");
    const q = query(
      conversionsRef, 
      where("affiliateId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const conversionsSnapshot = await getDocs(q);
    
    const conversions = conversionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
    
    // Obtener historial de pagos
    const paymentsRef = collection(db, "affiliatePayments");
    const paymentsQuery = query(
      paymentsRef, 
      where("affiliateId", "==", req.user.id),
      orderBy("createdAt", "desc")
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      paidAt: doc.data().paidAt?.toDate?.() || null
    }));
    
    // Calcular estadísticas de ganancias
    const affiliateData = affiliateDoc.data();
    const earningsStats = {
      total: affiliateData.stats?.earnings || 0,
      pending: affiliateData.stats?.pendingPayment || 0,
      conversions: affiliateData.stats?.conversions || 0,
      nextPaymentDate: getNextPaymentDate(),
      monthlyEarnings: calculateMonthlyEarnings(conversions)
    };
    
    return res.status(200).json({ 
      success: true, 
      data: {
        stats: earningsStats,
        conversions,
        payments
      }
    });
  } catch (error: any) {
    console.error('Error al obtener ganancias de afiliado:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener ganancias', 
      error: error.message 
    });
  }
});

/**
 * Calcula la fecha del próximo pago de afiliados (ejemplo: día 15 del mes siguiente)
 */
function getNextPaymentDate(): Date {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  return nextMonth;
}

/**
 * Calcula las ganancias mensuales basadas en las conversiones
 */
function calculateMonthlyEarnings(conversions: any[]): Record<string, number> {
  const monthlyEarnings: Record<string, number> = {};
  
  // Agrupar por mes
  conversions.forEach(conversion => {
    const date = conversion.createdAt;
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!monthlyEarnings[monthKey]) {
      monthlyEarnings[monthKey] = 0;
    }
    
    monthlyEarnings[monthKey] += conversion.commission;
  });
  
  return monthlyEarnings;
}

/**
 * Genera un URL de afiliado con los parámetros de seguimiento
 */
function generateAffiliateUrl(baseUrl: string, affiliateId: string, linkId: string, utmParams: any): string {
  try {
    // Crear URL base de seguimiento (/api/affiliate/track/:linkId)
    // En producción debería usar la URL completa del sitio
    const trackUrl = `/api/affiliate/track/${linkId}`;
    return trackUrl;
  } catch (error) {
    console.error('Error al generar URL de afiliado:', error);
    return baseUrl;
  }
}

import { deleteDoc } from 'firebase/firestore';
export default router;