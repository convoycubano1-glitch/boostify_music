import { Router } from 'express';
import type { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/transcribe', async (req: Request, res: Response) => {
  // Aumentar el timeout de esta ruta a 10 minutos
  req.setTimeout(600000); // 10 minutos en milisegundos
  res.setTimeout(600000);
  
  try {
    console.log('🎤 Solicitud de transcripción recibida');
    console.log('📋 OpenAI API Key configurada:', !!process.env.OPENAI_API_KEY);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ Error: OpenAI API key no está configurada');
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key no configurada en el servidor'
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

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (audioFile.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'El archivo de audio es demasiado grande. Máximo 50MB.'
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

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPathWithExtension),
      model: 'whisper-1',
      language: 'es',
      response_format: 'verbose_json'
    });
    
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
