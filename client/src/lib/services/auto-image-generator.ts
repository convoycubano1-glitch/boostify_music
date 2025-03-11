/**
 * Servicio para generar imágenes automatizadas basadas en transcripciones
 * 
 * Este servicio analiza el contenido de transcripciones de audio y genera imágenes
 * relevantes automáticamente usando la API Flux.
 */

import axios from 'axios';

export interface AutoImageGenerationOptions {
  transcript: string;
  numImages?: number;
  style?: string;
  audioFileName?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  file?: File;
}

export class AutoImageGeneratorService {
  /**
   * Genera imágenes automáticamente basadas en una transcripción
   * 
   * @param options Opciones para la generación, incluyendo la transcripción
   * @returns Promesa con un array de imágenes generadas
   */
  static async generateImagesFromTranscript(options: AutoImageGenerationOptions): Promise<GeneratedImage[]> {
    const { transcript, numImages = 5, style = 'cinematic', audioFileName } = options;
    
    try {
      console.log(`Generando ${numImages} imágenes basadas en transcripción`);
      
      // Extraer palabras clave/temas de la transcripción
      const prompts = this.generatePromptsFromTranscript(transcript, numImages, style, audioFileName);
      
      // Array para almacenar las imágenes generadas
      const generatedImages: GeneratedImage[] = [];
      
      // Para cada prompt, generar una imagen
      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        
        try {
          console.log(`Generando imagen ${i+1} con prompt: ${prompt}`);
          
          // Llamar a la API para generar la imagen
          const response = await axios.post('/api/flux/generate-image', {
            prompt: prompt,
            negativePrompt: 'deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated',
            modelType: 'Qubico/flux1-dev',
            taskType: 'txt2img'
          });
          
          // Si tenemos taskId, necesitamos hacer polling
          if (response.data.taskId) {
            // En un caso real, haríamos polling hasta completar
            // Aquí simplificamos esperando un tiempo fijo
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Verificar el estado
            const statusResponse = await axios.get(`/api/flux/status?taskId=${response.data.taskId}`);
            
            // Si está completado, obtener la URL de la imagen
            if (statusResponse.data.success && 
                statusResponse.data.data && 
                statusResponse.data.data.output && 
                statusResponse.data.data.output.image_url) {
              
              const imageUrl = statusResponse.data.data.output.image_url;
              
              // Convertir URL a File para mantener compatibilidad
              try {
                const imageResponse = await fetch(imageUrl);
                const blob = await imageResponse.blob();
                const file = new File([blob], `generated-${i+1}.jpg`, { type: 'image/jpeg' });
                
                generatedImages.push({
                  url: imageUrl,
                  prompt: prompt,
                  file: file
                });
              } catch (error) {
                console.error('Error convirtiendo imagen a File:', error);
              }
            }
          }
        } catch (error) {
          console.error(`Error generando imagen ${i+1}:`, error);
          // Continuar con la siguiente imagen en caso de error
        }
      }
      
      // Si no se generaron imágenes suficientes, usar imágenes predefinidas
      if (generatedImages.length < numImages) {
        console.log('No se generaron suficientes imágenes, usando presets');
        
        const presetImageUrls = [
          '/assets/music-visualization-1.jpg',
          '/assets/music-visualization-2.jpg',
          '/assets/music-visualization-3.jpg',
          '/assets/music-visualization-4.jpg',
          '/assets/music-visualization-5.jpg'
        ];
        
        // Añadir imágenes predefinidas hasta completar
        for (let i = generatedImages.length; i < numImages; i++) {
          try {
            const imageUrl = presetImageUrls[i % presetImageUrls.length];
            const imageResponse = await fetch(imageUrl);
            const blob = await imageResponse.blob();
            const file = new File([blob], `preset-${i+1}.jpg`, { type: 'image/jpeg' });
            
            generatedImages.push({
              url: imageUrl,
              prompt: prompts[i] || `Visualización musical estilo ${style}`,
              file: file
            });
          } catch (error) {
            console.error(`Error con imagen preset ${i+1}:`, error);
          }
        }
      }
      
      return generatedImages;
    } catch (error) {
      console.error('Error en generación automática de imágenes:', error);
      return [];
    }
  }
  
  /**
   * Genera prompts para imágenes basados en una transcripción
   * 
   * @param transcript La transcripción del audio
   * @param numPrompts Número de prompts a generar
   * @param style Estilo visual para las imágenes
   * @param audioFileName Nombre del archivo de audio para contexto
   * @returns Array de prompts generados
   */
  private static generatePromptsFromTranscript(
    transcript: string, 
    numPrompts: number, 
    style: string,
    audioFileName?: string
  ): string[] {
    const prompts: string[] = [];
    
    // Extraer líneas significativas de la transcripción
    const lines = transcript
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10);
    
    // Si la transcripción tiene suficientes líneas, usarlas para generar prompts
    if (lines.length >= numPrompts / 2) {
      for (let i = 0; i < Math.min(numPrompts, lines.length); i++) {
        const line = lines[i];
        prompts.push(`Music video scene: ${line}, professional ${style} style, artistic lighting, high quality, detailed`);
      }
    }
    
    // Si necesitamos más prompts, generar basados en el nombre del archivo o patrones generales
    if (prompts.length < numPrompts) {
      const songTitle = audioFileName ? 
        audioFileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ') : 
        'song';
      
      const additionalPrompts = [
        `${style} music video scene for "${songTitle}", professional lighting, artistic visualizations`,
        `Concert atmosphere for "${songTitle}", ${style} style, professional grade`,
        `Musical performance backdrop, ${style} interpretation of "${songTitle}", atmospheric lighting`,
        `${style} visualization for music rhythm, abstract representation, high detail`,
        `Sound waves visualization in ${style} style, professional music video, artistic rendering`
      ];
      
      for (let i = 0; i < numPrompts - prompts.length; i++) {
        prompts.push(additionalPrompts[i % additionalPrompts.length]);
      }
    }
    
    return prompts.slice(0, numPrompts);
  }
}