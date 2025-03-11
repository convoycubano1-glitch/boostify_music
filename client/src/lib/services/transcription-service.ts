/**
 * Servicio de transcripción usando OpenAI Whisper
 * Proporciona transcripción de audio real utilizando la API de OpenAI
 */

import axios from 'axios';

/**
 * Servicio para transcribir archivos de audio a texto
 * Utiliza el servicio Whisper de OpenAI para transcripción precisa
 */
export class TranscriptionService {
  /**
   * Transcribe un archivo de audio usando la API de OpenAI
   * 
   * @param audioFile El archivo de audio a transcribir
   * @returns Promesa con el texto transcrito
   */
  static async transcribeAudio(audioFile: File): Promise<string> {
    try {
      // Crear objeto FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      
      console.log("Iniciando transcripción real con OpenAI Whisper...");
      
      // Realizar la petición al endpoint de transcripción
      const response = await axios.post('/api/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Verificar si la respuesta contiene texto transcrito
      if (response.data && response.data.text) {
        console.log("Transcripción completada exitosamente");
        return response.data.text;
      } else {
        throw new Error("No se recibió texto en la respuesta de transcripción");
      }
    } catch (error) {
      console.error("Error en el servicio de transcripción:", error);
      throw new Error(`Error al transcribir el audio: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}