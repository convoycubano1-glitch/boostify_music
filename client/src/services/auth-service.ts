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
import { useLocation } from 'wouter';

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
   * Intenta iniciar sesión con Google usando un enfoque optimizado.
   * Si estamos en un entorno móvil o con políticas restrictivas, usa redirect directamente.
   * En caso contrario, intenta popup primero y usa redirect como fallback.
   * @param redirectPath Ruta a la que redirigir después de una autenticación exitosa
   */
  async signInWithGoogle(redirectPath: string = '/dashboard'): Promise<User | null> {
    try {
      // Limpiar cualquier intento anterior que pudiera haber quedado
      sessionStorage.removeItem('auth_redirect_attempt');
      
      // Almacenar la ruta de redirección para usarla después de la autenticación
      sessionStorage.setItem('auth_redirect_path', redirectPath);
      
      // Generar un proveedor específico para esta sesión para evitar problemas de caché
      const sessionProvider = new GoogleAuthProvider();
      
      // Configuración mejorada para reducir errores
      sessionProvider.setCustomParameters({
        prompt: 'select_account',
        // Los siguientes parámetros ayudan a reducir errores con dispositivos móviles y navegadores
        // que tienen políticas de popup estrictas
        'include_granted_scopes': 'true',
      });
      
      // Usar popup en desktop (mejor experiencia) o redirect en mobile (más confiable)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // En dispositivos móviles, usar directamente redirect
        console.log('AuthService: Móvil detectado, usando directamente redirect');
        sessionStorage.setItem('auth_redirect_attempt', 'true');
        await signInWithRedirect(this.auth, sessionProvider);
        return null; // La página se recargará después de la redirección
      }
      
      try {
        // En desktop, intentar primero con popup
        console.log('AuthService: Intentando autenticación con popup');
        const result = await signInWithPopup(this.auth, sessionProvider);
        console.log('AuthService: Autenticación con popup exitosa');
        
        // Si llegamos aquí, el popup fue exitoso
        if (typeof window !== 'undefined') {
          window.location.href = redirectPath;
        }
        
        return result.user;
      } catch (popupError: any) {
        console.warn('AuthService: Error en popup, usando redirect como fallback');
        
        // Si hay un error con popup, usar redirect como fallback
        sessionStorage.setItem('auth_redirect_attempt', 'true');
        await signInWithRedirect(this.auth, sessionProvider);
        return null; // La página se recargará después de la redirección
      }
    } catch (error) {
      console.error('AuthService: Error general en autenticación:', error);
      
      // Limpiar las banderas para evitar problemas en futuros intentos
      sessionStorage.removeItem('auth_redirect_attempt');
      sessionStorage.removeItem('auth_redirect_path');
      
      throw error;
    }
  }
  
  /**
   * Verifica si hay un resultado de redirección pendiente (después de loginWithRedirect)
   * Este método debe llamarse al iniciar la aplicación para manejar el flujo de redirección
   */
  async checkRedirectResult(): Promise<User | null> {
    // Limpiar cualquier estado previo que pudiera causar problemas
    try {
      console.log('AuthService: Verificando resultado de redirección');
      
      try {
        // Intentamos recuperar el resultado de la redirección de manera segura
        // Utilizamos una función directa en lugar de Promise.race que puede causar errores
        let result = null;
        
        // Establecer un timeout con setTimeout
        const timeoutId = setTimeout(() => {
          console.warn('Timeout al obtener resultado de redirección, continuando con flujo normal');
        }, 5000);
        
        try {
          // Intenta obtener el resultado de redirección
          result = await getRedirectResult(this.auth);
          // Limpiar el timeout si obtenemos un resultado
          clearTimeout(timeoutId);
        } catch (redirectError) {
          clearTimeout(timeoutId);
          console.error('Error directo al obtener resultado de redirección:', redirectError);
          // Propagar el error para ser manejado en el bloque catch
          throw redirectError;
        }
        
        // Si tenemos un resultado válido con usuario
        if (result && result.user) {
          console.log('AuthService: Redirección exitosa, usuario autenticado:', result.user.email);
          
          // Limpiar banderas de redirección
          const redirectPath = sessionStorage.getItem('auth_redirect_path') || '/dashboard';
          sessionStorage.removeItem('auth_redirect_path');
          sessionStorage.removeItem('auth_redirect_attempt');
          
          // Manejar redirección
          if (typeof window !== 'undefined') {
            window.location.href = redirectPath;
          }
          
          return result.user;
        } else {
          // Verificar si estábamos en medio de un intento de redirección
          const wasAttemptingRedirect = sessionStorage.getItem('auth_redirect_attempt') === 'true';
          
          // Limpiar banderas
          sessionStorage.removeItem('auth_redirect_attempt');
          
          if (wasAttemptingRedirect) {
            console.log('AuthService: Intento de redirección detectado pero sin resultado');
          } else {
            console.log('AuthService: No hay redirección en progreso');
          }
          
          return null;
        }
      } catch (error: any) {
        console.error('Error específico al obtener resultado de redirección:', error);
        
        // Casos especiales para errores conocidos
        if (error.code === 'auth/internal-error') {
          console.warn('Error interno de Firebase Auth detectado, limpiando estado de sesión...');
          
          // Limpiar el estado completo para intentar recuperarnos
          await this.clearAuthState();
          
          // Verificar si el usuario ya está autenticado a pesar del error
          const currentUser = this.auth.currentUser;
          if (currentUser) {
            console.log('Usuario ya autenticado a pesar del error:', currentUser.email);
            return currentUser;
          }
        }
        
        // Limpiar banderas para evitar bucles
        sessionStorage.removeItem('auth_redirect_attempt');
        sessionStorage.removeItem('auth_redirect_path');
        
        return null;
      }
    } catch (generalError) {
      console.error('Error general al procesar redirección:', generalError);
      
      // Limpiar todas las banderas
      sessionStorage.removeItem('auth_redirect_attempt');
      sessionStorage.removeItem('auth_redirect_path');
      
      // Verificar si hay un usuario autenticado a pesar del error
      const fallbackUser = this.auth.currentUser;
      if (fallbackUser) {
        console.log('Usuario autenticado recuperado tras error:', fallbackUser.email);
        return fallbackUser;
      }
      
      return null;
    }
  }
  
  /**
   * Cierra la sesión actual del usuario
   */
  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      await this.clearAuthState();
      console.log('AuthService: Sesión cerrada correctamente');
      
      // Redirigir a la página principal después de cerrar sesión
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('AuthService: Error al cerrar sesión:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }
}

// Exportar una instancia única del servicio
export const authService = new AuthService();