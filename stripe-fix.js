/**
 * Solución para el error de checkout de invitados
 * 
 * Reemplazar las líneas 438-459 con este código:
 */

// Variable para almacenar el ID de cliente de Stripe y los datos del usuario
let customerId = null;
let userData = null;

// Solo intentar obtener información del usuario si está autenticado
if (userId) {
  // Obtener información del usuario de Firestore
  const userSnap = await db.collection('users').doc(userId).get();
  userData = userSnap.data();
  
  // Verificar si el usuario ya tiene un customerID en Stripe
  customerId = userData?.stripeCustomerId;
  
  if (!customerId) {
    // Crear un nuevo cliente en Stripe si no existe
    const customer = await stripe.customers.create({
      email: userData?.email || undefined,
      name: userData?.displayName || undefined,
      metadata: { firebaseUserId: userId }
    });
    
    customerId = customer.id;
    
    // Guardar el customerId en Firestore
    await db.collection('users').doc(userId).update({
      stripeCustomerId: customerId
    });
  }
}
// Para compras como invitado, no se requiere customerId ni registro de usuario