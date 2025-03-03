/**
 * Servicio directo para interactuar con PiAPI (Hailuo)
 * 
 * Este servicio implementa una conexión directa a la API de PiAPI usando axios
 * siguiendo exactamente la estructura recomendada en la documentación.
 */
import axios from 'axios';

// Configuración base
const PIAPI_BASE_URL = 'https://api.piapi.ai/api/v1/task';
// Acceso seguro a la clave API desde el entorno
const PIAPI_API_KEY = process.env.PIAPI_API_KEY?.trim();

// Soporte para múltiples formatos de autenticación
const API_KEY_FORMATS = {
  BEARER: `Bearer ${PIAPI_API_KEY}`,
  HEADER: PIAPI_API_KEY,
  API_KEY: `api_key=${PIAPI_API_KEY}`
};

// Verificamos que la clave API esté configurada
if (!PIAPI_API_KEY) {
  console.warn('⚠️ PIAPI_API_KEY no está configurada. La generación de video no funcionará.');
}

interface VideoGenerationResult {
  success: boolean;
  taskId?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  url?: string;
}

/**
 * Genera un video usando la API de PiAPI Hailuo
 * 
 * @param prompt El texto descriptivo para generar el video
 * @param model El modelo a utilizar (t2v-01, t2v-01-director, etc.)
 * @param cameraMovements Opcional: Movimientos de cámara para agregar al prompt
 * @param imageUrl Opcional: URL de imagen para modelos image-to-video
 * @returns Objeto con el task_id para verificar el estado de la generación
 */
export async function generateVideoWithPiAPI(
  prompt: string,
  model: string = 't2v-01',
  cameraMovements?: string[],
  imageUrl?: string
): Promise<VideoGenerationResult> {
  try {
    if (!PIAPI_API_KEY) {
      return { 
        success: false, 
        error: 'PIAPI_API_KEY no está configurada. Contacta al administrador.' 
      };
    }

    console.log('📨 Enviando solicitud a PiAPI Hailuo con:', { prompt, model, cameraMovements });
    console.log('📝 API key format check:', { 
      length: PIAPI_API_KEY?.length || 0,
      firstChars: PIAPI_API_KEY?.substring(0, 3) || 'none',
      format: /^[a-zA-Z0-9_-]+$/.test(PIAPI_API_KEY || '') ? 'valid' : 'invalid'
    });

    // Verificar formatos comunes de API keys
    if (PIAPI_API_KEY && PIAPI_API_KEY.length < 10) {
      console.warn('⚠️ Clave API parece demasiado corta. Las API keys normalmente tienen 20+ caracteres');
    }

    // Preparar los datos para la solicitud según la documentación oficial de PiAPI
    // Estructura según la documentación: https://api.piapi.ai/api/v1/task
    const requestData: any = {
      model: "hailuo",               // Valor fijo requerido por PiAPI
      task_type: "video_generation", // Valor fijo requerido por PiAPI
      input: {
        prompt: prompt,
        model: model,                // modelo específico de video (t2v-01, etc.)
        expand_prompt: true
      },
      config: {
        service_mode: "public"       // Valor fijo requerido por PiAPI
      }
    };

    // Si el modelo es director y hay movimientos de cámara, formatear el prompt adecuadamente
    if (model === 't2v-01-director' && cameraMovements && cameraMovements.length > 0) {
      // El formato para movimientos de cámara es [Movimiento1,Movimiento2,Movimiento3]prompt
      requestData.input.prompt = `[${cameraMovements.join(',')}]${prompt}`;
    }

    // Si es un modelo basado en imagen y se proporciona una URL de imagen
    if (['i2v-01', 'i2v-01-live', 's2v-01'].includes(model) && imageUrl) {
      requestData.input.image_url = imageUrl;
    }

    // Imprimir la información detallada de la solicitud (sin mostrar la clave completa por seguridad)
    console.log('📨 Detalles completos de solicitud:', {
      url: PIAPI_BASE_URL,
      topLevelModel: requestData.model,
      taskType: requestData.task_type,
      inputModel: requestData.input.model,
      inputPrompt: requestData.input.prompt.substring(0, 50) + (requestData.input.prompt.length > 50 ? '...' : ''),
      serviceMode: requestData.config.service_mode,
      structuraCompleta: JSON.stringify(requestData)
    });

    // Intentar diferentes formatos de autenticación para la API
    const attempts = [
      // Intento 1: Header Authentication con X-API-Key
      async () => {
        console.log('💡 Intento 1: Autenticación con X-API-Key en header');
        return await axios.post(PIAPI_BASE_URL, requestData, {
          headers: {
            'X-API-Key': PIAPI_API_KEY,
            'Content-Type': 'application/json'
          }
        });
      },
      // Intento 2: Bearer token en Authorization
      async () => {
        console.log('💡 Intento 2: Autenticación con Bearer token');
        return await axios.post(PIAPI_BASE_URL, requestData, {
          headers: {
            'Authorization': `Bearer ${PIAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
      },
      // Intento 3: Query parameter
      async () => {
        console.log('💡 Intento 3: Autenticación con query parameter');
        return await axios.post(`${PIAPI_BASE_URL}?api_key=${PIAPI_API_KEY}`, requestData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    ];

    // Probar cada método de autenticación secuencialmente
    let lastError = null;
    for (let i = 0; i < attempts.length; i++) {
      try {
        const response = await attempts[i]();
        
        console.log(`✅ Intento ${i+1} exitoso. Formato de autenticación funcionando!`);
        console.log('📩 Respuesta de PiAPI Hailuo:', response.data);
        
        // Extraer el task_id según la estructura de respuesta de PiAPI
        let taskId = '';
        if (response.data?.data?.task_id) {
          taskId = response.data.data.task_id;
          console.log('🔑 Task ID extraído de data.data.task_id:', taskId);
        } else if (response.data?.task_id) {
          taskId = response.data.task_id;
          console.log('🔑 Task ID extraído de data.task_id:', taskId);
        } else if (response.data?.id) {
          taskId = response.data.id;
          console.log('🔑 Task ID extraído de data.id:', taskId);
        } else {
          console.warn('⚠️ No se encontró un task_id en la respuesta');
        }
        
        if (!taskId) {
          console.error('❌ No se pudo extraer un ID de tarea válido de la respuesta');
          throw new Error('Respuesta de API incorrecta: No se pudo extraer un ID de tarea');
        }
        
        return { 
          success: true, 
          taskId: taskId,
          status: 'pending'
        };
      } catch (apiError: any) {
        console.error(`❌ Error en intento ${i+1}:`, apiError.response?.data || apiError.message);
        lastError = apiError;
        // Continuamos con el siguiente intento
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error('❌ Todos los intentos de autenticación fallaron');
    return {
      success: false,
      error: lastError?.response?.data?.message || lastError?.message || 'Error en API de PiAPI'
    };

    // Este código es inalcanzable debido al return en el bloque try
    // Se mantiene temporalmente para referencia
    /*
    if (response.data && response.data.id) {
      return {
        success: true,
        taskId: response.data.id,
        status: 'pending'
      };
    } else {
      throw new Error('Respuesta de API inválida: No se recibió un ID de tarea');
    }
    */
  } catch (error: any) {
    console.error('❌ Error generando video con PiAPI:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Error desconocido al generar video'
    };
  }
}

/**
 * Verifica el estado de una tarea de generación de video
 * 
 * @param taskId ID de la tarea a verificar
 * @returns Objeto con el estado de la tarea y la URL del video si está completa
 */
export async function checkVideoGenerationStatus(taskId: string): Promise<any> {
  try {
    if (!PIAPI_API_KEY) {
      return { 
        success: false, 
        status: 'failed',
        error: 'PIAPI_API_KEY no está configurada. Contacta al administrador.' 
      };
    }

    console.log(`📨 Verificando estado de tarea de video ${taskId}`);

    // Intentar diferentes formatos de autenticación para la API, igual que en la generación
    const attempts = [
      // Intento 1: Header Authentication con X-API-Key
      async () => {
        console.log('💡 Intento 1: Verificando estado con X-API-Key en header');
        return await axios.get(`${PIAPI_BASE_URL}/${taskId}`, {
          headers: {
            'X-API-Key': PIAPI_API_KEY,
            'Content-Type': 'application/json'
          }
        });
      },
      // Intento 2: Bearer token en Authorization
      async () => {
        console.log('💡 Intento 2: Verificando estado con Bearer token');
        return await axios.get(`${PIAPI_BASE_URL}/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${PIAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
      },
      // Intento 3: Query parameter
      async () => {
        console.log('💡 Intento 3: Verificando estado con query parameter');
        return await axios.get(`${PIAPI_BASE_URL}/${taskId}?api_key=${PIAPI_API_KEY}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    ];

    // Probar cada método de autenticación secuencialmente
    let lastError = null;
    let response = null;

    for (let i = 0; i < attempts.length; i++) {
      try {
        response = await attempts[i]();
        console.log(`✅ Intento ${i+1} exitoso. Formato de autenticación funcionando!`);
        break; // Salimos del bucle si este método funcionó
      } catch (apiError: any) {
        console.error(`❌ Error en intento ${i+1}:`, apiError.response?.data || apiError.message);
        lastError = apiError;
        // Continuamos con el siguiente intento
      }
    }

    // Si todos los intentos fallaron, devolvemos un error
    if (!response) {
      console.error('❌ Todos los intentos de verificación fallaron');
      return {
        success: false,
        status: 'failed',
        error: lastError?.response?.data?.message || lastError?.message || 'Error al verificar el estado de la tarea'
      };
    }

    console.log(`📩 Estado de tarea ${taskId}:`, response.data);

    // Mapear el estado de la API a nuestro formato interno
    let status;
    let url = null;
    let error = null;

    // Interpretar el estado de la tarea según el formato de la API
    let mappedStatus: 'pending' | 'processing' | 'completed' | 'failed' = 'pending';
    
    // Estructura esperada según la documentación de PiAPI
    // Buscar en data.data.status, data.status o incluso en data directamente
    let apiStatus = '';
    if (response.data?.data?.status) {
      apiStatus = response.data.data.status;
      console.log('🔍 Usando status desde data.data.status:', apiStatus);
    } else if (response.data?.status) {
      apiStatus = response.data.status;
      console.log('🔍 Usando status desde data.status:', apiStatus);
    } else if (response.data?.code === 200 && response.data?.message === 'success') {
      // Si tenemos un código 200 pero no hay status explícito, intentamos extraerlo
      // de otras pistas en la respuesta
      if (response.data?.data?.output?.video_url || 
          response.data?.data?.output?.download_url ||
          response.data?.data?.meta?.ended_at !== '0001-01-01T00:00:00Z') {
        apiStatus = 'succeeded';
        console.log('🔍 Status inferido como "succeeded" basado en la presencia de URL de video o fecha de finalización');
      } else if (response.data?.data?.error?.message || response.data?.data?.error?.raw_message) {
        apiStatus = 'failed';
        console.log('🔍 Status inferido como "failed" basado en la presencia de mensajes de error');
      } else if (response.data?.data?.meta?.started_at && 
                response.data?.data?.meta?.started_at !== '0001-01-01T00:00:00Z') {
        apiStatus = 'processing';
        console.log('🔍 Status inferido como "processing" basado en la presencia de fecha de inicio');
      } else {
        apiStatus = 'pending';
        console.log('🔍 Status inferido como "pending" por defecto');
      }
    } else {
      console.log('⚠️ Formato de respuesta inesperado, intentando inferir estado:', response.data);
    }
    
    if (apiStatus === 'succeeded' || apiStatus === 'completed') {
      mappedStatus = 'completed';
      // Extraer la URL del video generado - buscar en múltiples ubicaciones posibles
      if (response.data?.data?.output?.video_url) {
        url = response.data.data.output.video_url;
      } else if (response.data?.result?.video_urls?.length > 0) {
        url = response.data.result.video_urls[0];
      } else if (response.data?.result?.urls?.length > 0) {
        url = response.data.result.urls[0];
      } else if (response.data?.data?.output?.download_url) {
        url = response.data.data.output.download_url;
      }
      console.log('🎬 URL de video obtenida:', url);
    } else if (apiStatus === 'failed' || apiStatus === 'error') {
      mappedStatus = 'failed';
      // Buscar mensajes de error en múltiples ubicaciones posibles
      if (response.data?.data?.error?.message) {
        error = response.data.data.error.message;
      } else if (response.data?.error?.message) {
        error = response.data.error.message;
      } else if (response.data?.data?.error) {
        error = response.data.data.error;
      } else if (response.data?.error) {
        error = response.data.error;
      } else {
        error = 'La generación del video ha fallado (sin detalles disponibles)';
      }
      console.log('❌ Error detectado:', error);
    } else if (apiStatus === 'pending' || apiStatus === 'running' || apiStatus === 'processing') {
      mappedStatus = 'processing';
      // Intentar obtener el progreso si está disponible
      let progress = '0%';
      if (response.data?.data?.output?.percent) {
        progress = response.data.data.output.percent + '%';
      } else if (response.data?.progress) {
        progress = response.data.progress + '%';
      }
      console.log('⏳ Procesamiento en curso, progreso:', progress);
    }
    
    status = mappedStatus;

    const result: VideoGenerationResult = {
      success: true,
      status,
      taskId,
      url,
      error
    };

    return result;
  } catch (error: any) {
    console.error(`❌ Error verificando estado de tarea ${taskId}:`, error);
    
    return {
      success: false,
      status: 'failed',
      error: error.response?.data?.message || error.message || 'Error al verificar el estado de la tarea'
    };
  }
}