/**
 * Este archivo contiene únicamente los datos simulados para las conversiones de voz
 * Se separa de firebase-storage.ts y firebase-storage-mock.ts para evitar ciclos de importación
 */

import { Timestamp } from "firebase/firestore";
import { VoiceConversionRecord } from "./audio-mastering-types";

/**
 * Genera datos simulados para pruebas de conversión de voz
 * @returns Lista de conversiones simuladas
 */
export function getMockVoiceData(): VoiceConversionRecord[] {
  // Fecha actual
  const now = new Date();
  
  // Timestamps para diferentes momentos
  const timestamps = {
    now: Timestamp.fromDate(now),
    yesterday: Timestamp.fromDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
    twoDaysAgo: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
    fiveDaysAgo: Timestamp.fromDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
  };
  
  // Lista de modelos de voz para simular diferentes conversiones
  const voiceModels = [
    { id: 1, name: "Male Warm Pop" },
    { id: 2, name: "Female Smooth Pop" },
    { id: 3, name: "Male Gritty Rock" },
    { id: 4, name: "Female LoFi" },
    { id: 5, name: "Male Deep Bass" }
  ];
  
  // URLs de ejemplo reales para la demostración
  const simulatedUrls = {
    originalUrl: "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/demoFiles%2Foriginal_audio_sample.mp3?alt=media&token=f2c5a9d6-b3e7-4f8g-9h0i-jk1l2m3n4o5p",
    resultUrl1: "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/demoFiles%2Fmastered_audio_sample.mp3?alt=media&token=93a82642-59e3-406c-a7b6-8d4cc3b5c6a8",
    resultUrl2: "https://firebasestorage.googleapis.com/v0/b/artist-boost.appspot.com/o/demoFiles%2Fvoice_conversion_sample.mp3?alt=media&token=1be2a3c4-5d6e-7f8g-9h0i-jk1l2m3n4o5p"
  };
  
  // Generar conversiones simuladas
  return [
    {
      id: "conv-001",
      userId: "demo-user",
      fileName: "original_recording.wav",
      modelId: voiceModels[0].id,
      modelName: voiceModels[0].name,
      originalFileUrl: simulatedUrls.originalUrl,
      resultFileUrl: simulatedUrls.resultUrl1,
      createdAt: timestamps.yesterday,
      completedAt: Timestamp.fromDate(new Date(timestamps.yesterday.toMillis() + 30 * 60 * 1000)),
      status: "completed",
      settings: {
        conversionStrength: 0.8,
        modelVolumeMix: 0.7,
        pitchShift: 0,
        usePreprocessing: true,
        usePostprocessing: true,
      },
      progress: 100,
      duration: "3:42"
    },
    {
      id: "conv-002",
      userId: "demo-user",
      fileName: "studio_vocals.wav",
      modelId: voiceModels[1].id,
      modelName: voiceModels[1].name,
      originalFileUrl: simulatedUrls.originalUrl,
      resultFileUrl: simulatedUrls.resultUrl2,
      createdAt: timestamps.now,
      completedAt: null,
      status: "running",
      settings: {
        conversionStrength: 0.9,
        modelVolumeMix: 0.8,
        pitchShift: -1,
        usePreprocessing: true,
        usePostprocessing: false,
      },
      progress: 65,
      duration: "2:58"
    },
    {
      id: "conv-003",
      userId: "demo-user",
      fileName: "ballad_cover.wav",
      modelId: voiceModels[2].id,
      modelName: voiceModels[2].name,
      originalFileUrl: simulatedUrls.originalUrl,
      resultFileUrl: null,
      createdAt: timestamps.fiveDaysAgo,
      completedAt: null,
      status: "failed",
      settings: {
        conversionStrength: 0.75,
        modelVolumeMix: 0.6,
        pitchShift: 2,
        usePreprocessing: false,
        usePostprocessing: true,
      },
      progress: 0,
      duration: "4:12"
    },
    {
      id: "conv-004",
      userId: "demo-user",
      fileName: "live_performance.wav",
      modelId: voiceModels[3].id,
      modelName: voiceModels[3].name,
      originalFileUrl: simulatedUrls.originalUrl,
      resultFileUrl: simulatedUrls.resultUrl1,
      createdAt: timestamps.twoDaysAgo,
      completedAt: Timestamp.fromDate(new Date(timestamps.twoDaysAgo.toMillis() + 45 * 60 * 1000)),
      status: "completed",
      settings: {
        conversionStrength: 1.0,
        modelVolumeMix: 0.9,
        pitchShift: 0,
        usePreprocessing: true,
        usePostprocessing: true,
      },
      progress: 100,
      duration: "5:33"
    },
    {
      id: "conv-005",
      userId: "demo-user",
      fileName: "acoustic_demo.wav",
      modelId: voiceModels[4].id,
      modelName: voiceModels[4].name,
      originalFileUrl: simulatedUrls.originalUrl,
      resultFileUrl: simulatedUrls.resultUrl2,
      createdAt: Timestamp.fromDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
      completedAt: Timestamp.fromDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000)),
      status: "completed",
      settings: {
        conversionStrength: 0.85,
        modelVolumeMix: 0.75,
        pitchShift: -2,
        usePreprocessing: true,
        usePostprocessing: true,
      },
      progress: 100,
      duration: "3:18"
    }
  ];
}