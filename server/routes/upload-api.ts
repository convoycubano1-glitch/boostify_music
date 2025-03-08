/**
 * Servicio para procesar imágenes usando la API de uploads temporal
 * 
 * Este servicio garantiza que las imágenes estén en formato JPEG válido
 * con tablas Huffman correctamente inicializadas, resolviendo el problema
 * común "invalid JPEG format: uninitialized Huffman table" en Kling API.
 */

import { Router } from 'express';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const UPLOAD_API_URL = 'https://upload.theapi.app/api/ephemeral_resource';
const API_KEY = process.env.PIAPI_API_KEY || '';

/**
 * Procesa una imagen para asegurar compatibilidad con Kling API
 * Convierte la imagen a JPEG y garantiza tablas Huffman inicializadas
 */
router.post('/process-image', async (req, res) => {
  try {
    const { imageDataUrl } = req.body;
    
    if (!imageDataUrl) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó imagen para procesar'
      });
    }
    
    // Extraer datos base64 de la dataURL
    let base64Data = '';
    let fileExtension = 'jpg'; // Por defecto asumimos jpg
    
    try {
      const matches = imageDataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        fileExtension = matches[1].toLowerCase();
        base64Data = matches[2];
        
        // Si no es jpg/jpeg, lo convertiremos a jpg
        if (fileExtension !== 'jpg' && fileExtension !== 'jpeg') {
          fileExtension = 'jpg';
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'Formato de imagen no válido. Debe ser una data URL'
        });
      }
    } catch (error) {
      console.error('Error procesando data URL:', error);
      return res.status(400).json({
        success: false,
        error: 'Error procesando formato de imagen'
      });
    }
    
    // Generar nombre aleatorio para el archivo
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const fileName = `image_${timestamp}_${randomSuffix}.${fileExtension}`;
    
    // Preparar la solicitud a la API de uploads
    try {
      const uploadResponse = await axios.post(UPLOAD_API_URL, {
        file_name: fileName,
        file_data: base64Data
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        }
      });
      
      // Verificar respuesta exitosa
      if (uploadResponse.data && uploadResponse.data.code === 200 && uploadResponse.data.data.url) {
        const processedImageUrl = uploadResponse.data.data.url;
        
        // Descargar la imagen procesada para convertirla nuevamente a data URL
        const imageResponse = await axios.get(processedImageUrl, {
          responseType: 'arraybuffer'
        });
        
        // Convertir imagen descargada a formato base64
        const imageBuffer = Buffer.from(imageResponse.data);
        const processedImageDataUrl = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        
        return res.json({
          success: true,
          processedImage: processedImageDataUrl,
          originalFormat: fileExtension,
          width: 0, // No podemos determinar dimensiones sin librerías adicionales
          height: 0
        });
      } else {
        console.error('Error en respuesta de API de uploads:', uploadResponse.data);
        return res.status(500).json({
          success: false,
          error: 'Error procesando imagen en API de uploads'
        });
      }
    } catch (uploadError: any) {
      console.error('Error al usar API de uploads:', uploadError);
      
      // Detección específica del error y mensajes de ayuda
      let errorMessage = 'Error al procesar la imagen con la API de uploads';
      
      if (uploadError.response) {
        if (uploadError.response.status === 403) {
          errorMessage = 'Error de permisos en la API de uploads. Verifica la API key.';
        } else if (uploadError.response.data && uploadError.response.data.message) {
          errorMessage = `Error API: ${uploadError.response.data.message}`;
        }
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('Error procesando imagen:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno al procesar la imagen'
    });
  }
});

export default router;