import { Router } from 'express';
import type { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = Router();

// Middleware para verificar autenticación con Replit Auth
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    console.error('❌ Usuario no autenticado en ruta de transcripción');
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida. Por favor inicia sesión.'
    });
  }
  
  console.log('✅ Usuario autenticado:', (req.user as any)?.id || 'unknown');
  next();
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY2
});

// Ruta de prueba para verificar la API key (con autenticación)
router.get('/test-connection', requireAuth, async (req: Request, res: Response) => {
  try {
    console.log('🧪 Probando conexión con OpenAI...');
    console.log('📋 API Key presente:', !!process.env.OPENAI_API_KEY2);
    console.log('📋 Primeros caracteres:', process.env.OPENAI_API_KEY2?.substring(0, 20) + '...');
    
    // Intentar listar modelos como prueba simple
    const models = await openai.models.list();
    console.log('✅ Conexión exitosa con OpenAI');
    
    return res.json({
      success: true,
      message: 'Conexión exitosa con OpenAI',
      modelCount: models.data.length
    });
  } catch (error: any) {
    console.error('❌ Error probando conexión:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      type: error.constructor.name
    });
  }
});

router.post('/transcribe', requireAuth, async (req: Request, res: Response) => {
  // Aumentar el timeout de esta ruta a 15 minutos para archivos grandes
  req.setTimeout(900000); // 15 minutos en milisegundos
  res.setTimeout(900000);
  
  try {
    const userId = (req.user as any)?.id;
    console.log('🎤 Solicitud de transcripción recibida');
    console.log('👤 Usuario:', userId);
    console.log('📋 OpenAI API Key2 configurada:', !!process.env.OPENAI_API_KEY2);
    
    if (!process.env.OPENAI_API_KEY2) {
      console.error('❌ Error: OPENAI_API_KEY2 no está configurada');
      return res.status(500).json({
        success: false,
        error: 'OPENAI_API_KEY2 no configurada en el servidor'
      });
    }

    if (!req.files || !(req.files as any).audio) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ningún archivo de audio'
      });
    }

    const filesObj = req.files as any;
    const audioFile = Array.isArray(filesObj.audio) 
      ? filesObj.audio[0] 
      : filesObj.audio;

    const allowedTypes = [
      'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 
      'audio/x-m4a', 'audio/aac', 'audio/flac', 'audio/ogg'
    ];
    const fileType = audioFile.mimetype.toLowerCase();
    const fileName = audioFile.name.toLowerCase();

    const isValidAudio = allowedTypes.includes(fileType) || 
                         fileType.includes('audio') ||
                         fileName.endsWith('.wav') || 
                         fileName.endsWith('.mp3') ||
                         fileName.endsWith('.m4a') ||
                         fileName.endsWith('.aac') ||
                         fileName.endsWith('.flac') ||
                         fileName.endsWith('.ogg');

    if (!isValidAudio) {
      return res.status(400).json({
        success: false,
        error: 'Formato de audio no soportado. Se permiten formatos de audio comunes.'
      });
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (audioFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'El archivo de audio es demasiado grande. Máximo 100MB.'
      });
    }

    console.log(`🎵 Transcribiendo audio: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`📁 Archivo temporal en: ${audioFile.tempFilePath}`);
    console.log(`📝 Nombre del archivo: ${audioFile.name}`);
    console.log(`🏷️ MIME type: ${audioFile.mimetype}`);

    // Extraer la extensión del archivo original
    const fileExtension = path.extname(audioFile.name).toLowerCase();
    
    // Crear una ruta temporal con la extensión correcta
    const tempPathWithExtension = audioFile.tempFilePath + fileExtension;
    
    // Renombrar el archivo temporal para que tenga la extensión correcta
    fs.renameSync(audioFile.tempFilePath, tempPathWithExtension);
    
    console.log(`📂 Archivo renombrado a: ${tempPathWithExtension}`);

    // Reintentar hasta 5 veces con timeout más largo
    let transcription;
    let retries = 5;
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt} de ${retries}...`);
        
        // Crear un nuevo stream en cada intento
        const fileStream = fs.createReadStream(tempPathWithExtension);
        
        transcription = await openai.audio.transcriptions.create({
          file: fileStream,
          model: 'whisper-1',
          language: 'es',
          response_format: 'verbose_json'
        }, {
          timeout: 300000, // 5 minutos de timeout por solicitud
          maxRetries: 0 // Desactivar reintentos internos para controlarlos nosotros
        });
        
        console.log(`✅ Transcripción exitosa en intento ${attempt}`);
        break; // Éxito, salir del loop
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Error en intento ${attempt}:`, error.message);
        console.error(`📝 Error code:`, error.code);
        console.error(`📝 Error type:`, error.constructor.name);
        
        // Si es el último intento, lanzar el error
        if (attempt === retries) {
          throw error;
        }
        
        // Si es un error de conexión, esperar antes de reintentar
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || 
            error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' ||
            error.message?.includes('Connection') || error.message?.includes('network')) {
          const waitTime = attempt * 3000; // 3s, 6s, 9s, 12s
          console.log(`⏳ Esperando ${waitTime/1000}s antes de reintentar...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // Si no es error de conexión, no reintentar
          throw error;
        }
      }
    }
    
    if (!transcription) {
      throw lastError || new Error('No se pudo completar la transcripción');
    }
    
    console.log('✅ Transcripción completada exitosamente');

    // Limpiar el archivo temporal renombrado
    if (fs.existsSync(tempPathWithExtension)) {
      fs.unlinkSync(tempPathWithExtension);
    }

    return res.json({
      success: true,
      transcription: {
        text: transcription.text,
        duration: (transcription as any).duration || null,
        language: (transcription as any).language || 'es'
      }
    });

  } catch (error: any) {
    console.error('❌ Error en transcripción:', error);
    console.error('📝 Detalles del error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    let errorMessage = 'Error al transcribir el audio';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

export default router;
