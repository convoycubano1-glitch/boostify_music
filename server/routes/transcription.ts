/**
 * API de transcripción que utiliza OpenAI Whisper
 * Endpoint seguro para transcribir archivos de audio a texto
 */

import express, { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Middleware para manejar archivos
router.use(fileUpload({
  limits: { fileSize: 25 * 1024 * 1024 }, // Máximo 25MB (límite de Whisper)
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

/**
 * Endpoint para transcribir audio usando OpenAI Whisper
 * Acepta un archivo de audio y devuelve su transcripción
 */
router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    if (!req.files) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se ha proporcionado ningún archivo' 
      });
    }
    
    // Manejar ambos formatos posibles de req.files
    let uploadedFile: fileUpload.UploadedFile;
    
    if (Array.isArray(req.files)) {
      // Si es un array, tomar el primer archivo
      if (req.files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No se ha proporcionado ningún archivo' 
        });
      }
      uploadedFile = req.files[0] as fileUpload.UploadedFile;
    } else {
      // Si es un objeto con clave 'file'
      if (!req.files.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No se ha proporcionado ningún archivo con el nombre "file"' 
        });
      }
      uploadedFile = req.files.file as fileUpload.UploadedFile;
    }
    
    const file = uploadedFile;
    
    // Verificar tipo de archivo (solo audio permitido)
    if (!file.mimetype.startsWith('audio/')) {
      return res.status(400).json({ 
        success: false, 
        error: 'El archivo debe ser de tipo audio' 
      });
    }
    
    console.log(`Procesando archivo de audio: ${file.name}, tamaño: ${file.size} bytes`);
    
    // Guardar temporalmente el archivo
    const tempFilePath = file.tempFilePath;
    
    // Crear objeto FormData para la API de OpenAI
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    formData.append('model', 'whisper-1');
    
    // Llamar a la API de OpenAI
    const openaiResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );
    
    // Eliminar el archivo temporal
    fs.unlinkSync(tempFilePath);
    
    // Devolver la transcripción
    return res.json({
      success: true,
      text: openaiResponse.data.text
    });
    
  } catch (error) {
    console.error('Error en transcripción:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido en la transcripción'
    });
  }
});

export default router;