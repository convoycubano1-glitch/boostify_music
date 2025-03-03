import { 
  signInWithPopup, 
  signInWithRedirect,
  GoogleAuthProvider, 
  getRedirectResult,
  signOut,
  User,
  Auth
} from 'firebase/auth';
import { auth } from '@/firebase';

/**
 * Servicio mejorado de autenticación que proporciona una capa adicional de
 * manejo de errores y reintento para resolver problemas comunes con Firebase Auth.
 */
class AuthService {
  private auth: Auth;
  private googleProvider: GoogleAuthProvider;
  
  constructor() {
    this.auth = auth;
    this.googleProvider = new GoogleAuthProvider();
    // Configuración mínima para reducir posibilidad de errores
    this.googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
  }
  
  /**
   * Limpia el estado de autenticación actual, incluyendo localStorage, sessionStorage y cookies
   */
  async clearAuthState(): Promise<void> {
    try {
      // 1. Cerrar sesión para limpiar el estado interno de Firebase Auth
      await signOut(this.auth);
      
      // 2. Limpiar almacenamiento local y de sesión
      localStorage.removeItem('firebase:authUser:' + this.auth.app.options.apiKey + ':' + window.location.hostname);
      sessionStorage.removeItem('firebase:authUser:' + this.auth.app.options.apiKey + ':' + window.location.hostname);
      
      // Limpiar cualquier otro dato relacionado con Firebase
      localStorage.removeItem('firebase:authUser');
      sessionStorage.removeItem('firebase:authUser');
      
      // 3. Limpiar cookies relacionadas con Firebase
      document.cookie.split(";").forEach(c => {
        if (c.trim().startsWith("firebaseAuth") || c.trim().startsWith("firebase:")) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        }
      });
      
      console.log('AuthService: Estado de autenticación limpiado correctamente');
    } catch (error) {
      console.error('AuthService: Error al limpiar estado de autenticación:', error);
    }
  }
  
  /**
   * Intenta iniciar sesión con Google usando primero el método popup,
   * y si falla, intenta con redirect como fallback.
   */
  async signInWithGoogle(): Promise<User | null> {
    try {
      // Primero, limpiar estado previo
      await this.clearAuthState();
      
      // Generar un proveedor específico para esta sesión para evitar problemas de caché
      const sessionProvider = new GoogleAuthProvider();
      sessionProvider.setCustomParameters({ prompt: 'select_account' });
      
      // Estrategia 1: Usar popup (preferido por mejor experiencia de usuario)
      try {
        console.log('AuthService: Intentando autenticación con popup');
        const result = await signInWithPopup(this.auth, sessionProvider);
        console.log('AuthService: Autenticación con popup exitosa');
        return result.user;
      } catch (popupError: any) {
        console.warn('AuthService: Error en autenticación con popup:', popupError);
        
        // Si el error es que el usuario cerró el popup, no intentamos redirect
        if (popupError.code === 'auth/popup-closed-by-user') {
          throw popupError;
        }
        
        // Si el error es específicamente de popup bloqueado o error interno,
        // intentamos con redirect que es más robusto
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/internal-error') {
          
          console.log('AuthService: Intentando autenticación con redirect como fallback');
          
          // Primero almacenamos información sobre el reintento para la redirección
          sessionStorage.setItem('auth_redirect_attempt', 'true');
          
          // Estrategia 2: Usar redirect como fallback
          await signInWithRedirect(this.auth, sessionProvider);
          // El control NO regresa aquí - la página se recargará después de la redirección
          return null;
        }
        
        // Si no es un error específico que podamos manejar, lo propagamos
        throw popupError;
      }
    } catch (error) {
      console.error('AuthService: Error general en autenticación:', error);
      throw error;
    }
  }
  
  /**
   * Verifica si hay un resultado de redirección pendiente (después de loginWithRedirect)
   * Este método debe llamarse al iniciar la aplicación para manejar el flujo de redirección
   */
  async checkRedirectResult(): Promise<User | null> {
    try {
      // Comprobar si estamos regresando de una redirección de autenticación
      if (sessionStorage.getItem('auth_redirect_attempt') === 'true') {
        console.log('AuthService: Verificando resultado de redirección');
        
        // Limpiar la bandera de intento
        sessionStorage.removeItem('auth_redirect_attempt');
        
        // Obtener el resultado de la redirección
        const result = await getRedirectResult(this.auth);
        if (result) {
          console.log('AuthService: Redirección exitosa, usuario autenticado');
          return result.user;
        } else {
          console.log('AuthService: No hay resultado de redirección o fue cancelado');
          return null;
        }
      }
      
      return null;
    } catch (redirectError) {
      console.error('AuthService: Error al verificar resultado de redirección:', redirectError);
      return null;
    }
  }
  
  /**
   * Cierra la sesión actual del usuario
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      this.clearAuthState();
      console.log('AuthService: Sesión cerrada correctamente');
    } catch (error) {
      console.error('AuthService: Error al cerrar sesión:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
export const authService = new AuthService();