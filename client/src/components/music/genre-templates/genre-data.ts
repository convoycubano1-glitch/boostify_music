import { MusicGenreTemplate } from "./genre-template-selector";

/**
 * Plantillas predefinidas para diferentes géneros musicales
 * Cada plantilla contiene:
 * - ID único para identificación
 * - Nombre y descripción del género
 * - Prompt predeterminado optimizado para el género
 * - Etiquetas sugeridas para ese estilo musical
 * - Parámetros musicales (tempo, tonalidad, instrumentos, etc.)
 */
export const musicGenreTemplates: MusicGenreTemplate[] = [
  // Pop
  {
    id: "pop",
    name: "Pop",
    description: "Música pop moderna con melodías pegadizas y estructura comercial",
    defaultPrompt: "Una canción pop moderna con melodía pegadiza, voces claras, ritmo de baile moderno, sintetizadores brillantes y estructura verso-coro-verso-coro-puente-coro",
    suggestedTags: ["pop", "commercial", "catchy", "radio", "dance"],
    tempo: 118,
    keySignature: "C Major",
    mainInstruments: ["synth", "drums", "piano", "vocals"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: true,
      outro: true
    }
  },
  
  // Rock
  {
    id: "rock",
    name: "Rock",
    description: "Rock con guitarras energéticas, batería potente y melodías impactantes",
    defaultPrompt: "Una canción de rock energética con guitarras distorsionadas, batería potente, bajo marcado, y voz masculina con actitud. Estilo similar a Foo Fighters o Green Day.",
    suggestedTags: ["rock", "guitar", "drums", "energetic", "distorted"],
    tempo: 130,
    keySignature: "E Minor",
    mainInstruments: ["electric guitar", "bass", "drums", "vocals"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: true,
      outro: true
    }
  },
  
  // Electrónica
  {
    id: "electronic",
    name: "Electrónica",
    description: "Música electrónica con ritmos pulsantes y sintetizadores atmosféricos",
    defaultPrompt: "Una pista de música electrónica con ritmo pulsante, bajos profundos, sintetizadores atmosféricos y progresión gradual. Estilo similar a Daft Punk o Calvin Harris.",
    suggestedTags: ["electronic", "dance", "edm", "synthesizer", "beats"],
    tempo: 128,
    keySignature: "F Minor",
    mainInstruments: ["synth", "drums", "bass", "effects"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: false,
      outro: true
    }
  },
  
  // Lo-Fi
  {
    id: "lofi",
    name: "Lo-Fi Hip Hop",
    description: "Beats relajados con texturas cálidas y ambiente nostálgico",
    defaultPrompt: "Un beat lo-fi hip hop relajante con piano suave, batería crujiente, samples de vinilo, bajo profundo y atmósfera nostálgica, perfecto para estudiar o relajarse.",
    suggestedTags: ["lofi", "chill", "relax", "beats", "study"],
    tempo: 85,
    keySignature: "D Minor",
    mainInstruments: ["piano", "drums", "bass", "vinyl"],
    structure: {
      intro: true,
      verse: true,
      chorus: false,
      bridge: false,
      outro: true
    }
  },
  
  // Jazz
  {
    id: "jazz",
    name: "Jazz",
    description: "Jazz suave con instrumentación sofisticada e improvisación",
    defaultPrompt: "Una pieza de jazz suave con piano elegante, contrabajo sólido, batería con escobillas, saxofón melódico y ambiente nocturno de club. Estilo similar a Miles Davis o Bill Evans.",
    suggestedTags: ["jazz", "smooth", "piano", "saxophone", "nightclub"],
    tempo: 92,
    keySignature: "Bb Major",
    mainInstruments: ["piano", "double bass", "drums", "saxophone"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: true,
      outro: true
    }
  },
  
  // Clásica
  {
    id: "classical",
    name: "Clásica",
    description: "Música clásica orquestal con composición sofisticada",
    defaultPrompt: "Una pieza orquestal clásica emotiva con cuerdas prominentes, piano delicado, arreglos armónicos sofisticados y desarrollo dinámico. Inspirado en Debussy o Chopin.",
    suggestedTags: ["classical", "orchestra", "strings", "piano", "instrumental"],
    tempo: 80,
    keySignature: "G Major",
    mainInstruments: ["orchestra", "strings", "piano", "woodwinds"],
    structure: {
      intro: true,
      verse: true,
      chorus: false,
      bridge: true,
      outro: true
    }
  },
  
  // Indie
  {
    id: "indie",
    name: "Indie",
    description: "Indie folk-rock con sonido orgánico y letras introspectivas",
    defaultPrompt: "Una canción indie folk-rock con guitarras acústicas, voz íntima y ligeramente imperfecta, armonías sutiles, batería ligera y ambiente cálido. Estilo similar a Bon Iver o Fleet Foxes.",
    suggestedTags: ["indie", "folk", "acoustic", "intimate", "organic"],
    tempo: 95,
    keySignature: "A Minor",
    mainInstruments: ["acoustic guitar", "vocals", "drums", "bass"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: true,
      outro: true
    }
  },
  
  // Ambiente
  {
    id: "ambient",
    name: "Ambient",
    description: "Música ambiental atmosférica y envolvente",
    defaultPrompt: "Una pieza ambient inmersiva con sintetizadores expansivos, texturas atmosféricas, drones sutiles, sin ritmo definido y progresión lenta. Estilo similar a Brian Eno o Stars of the Lid.",
    suggestedTags: ["ambient", "atmospheric", "relaxing", "drone", "space"],
    tempo: 70,
    keySignature: "C Major",
    mainInstruments: ["synth", "pad", "effects", "atmosphere"],
    structure: {
      intro: true,
      verse: false,
      chorus: false,
      bridge: false,
      outro: true
    }
  },
  
  // Urbano
  {
    id: "urban",
    name: "Urbano/Trap",
    description: "Trap/hip-hop moderno con beats pesados y atmósfera oscura",
    defaultPrompt: "Una pista trap/hip-hop moderna con 808s contundentes, hi-hats rápidos, melodía de sintetizador oscura, efectos vocales con autotune y ambiente urbano. Estilo similar a Travis Scott o Future.",
    suggestedTags: ["trap", "urban", "808", "autotune", "hiphop"],
    tempo: 140,
    keySignature: "G Minor",
    mainInstruments: ["808", "drums", "synth", "vocals"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: false,
      outro: true
    }
  },
  
  // Latino
  {
    id: "latin",
    name: "Latino",
    description: "Música latina con ritmos bailables y melodías vibrantes",
    defaultPrompt: "Una canción latina bailable con percusión afro-caribeña, guitarra flamenca, trompetas brillantes, bajo rítmico y voz en español apasionada. Mezcla de reggaeton y pop latino.",
    suggestedTags: ["latin", "reggaeton", "dance", "spanish", "caribbean"],
    tempo: 95,
    keySignature: "E Minor",
    mainInstruments: ["percussion", "guitar", "brass", "vocals"],
    structure: {
      intro: true,
      verse: true,
      chorus: true,
      bridge: false,
      outro: true
    }
  }
];

/**
 * Busca y devuelve una plantilla de género musical por su ID
 * @param id ID de la plantilla a buscar
 * @returns La plantilla encontrada o una plantilla por defecto
 */
export function getGenreTemplateById(id: string): MusicGenreTemplate {
  const found = musicGenreTemplates.find(template => template.id === id);
  
  if (found) {
    return found;
  }
  
  // Plantilla por defecto (pop) si no se encuentra
  return musicGenreTemplates[0];
}

/**
 * Genera un prompt detallado basado en una plantilla y parámetros adicionales
 * @param templateId ID de la plantilla base
 * @param customParams Parámetros personalizados adicionales
 * @returns Prompt detallado optimizado para generación
 */
export function getDetailedPrompt(templateId: string, customParams?: any): string {
  const template = getGenreTemplateById(templateId);
  
  // Comenzar con el prompt base de la plantilla
  let detailedPrompt = template.defaultPrompt;
  
  // Agregar información sobre estructura musical según la plantilla
  const structureParts = [];
  if (template.structure.intro) structureParts.push("intro");
  if (template.structure.verse) structureParts.push("verse");
  if (template.structure.chorus) structureParts.push("chorus");
  if (template.structure.bridge) structureParts.push("bridge");
  if (template.structure.outro) structureParts.push("outro");
  
  const structureString = structureParts.join("-");
  
  // Añadir información sobre instrumentos principales
  const instrumentsString = template.mainInstruments.join(", ");
  
  // Añadir información sobre tempo y tonalidad
  const musicInfoString = `Tempo: ${template.tempo} BPM, Key: ${template.keySignature}`;
  
  // Combinar todo en un prompt detallado
  detailedPrompt += ` Structure: ${structureString}. Instruments: ${instrumentsString}. ${musicInfoString}.`;
  
  // Agregar parámetros personalizados si se proporcionan
  if (customParams) {
    if (customParams.makeInstrumental) {
      detailedPrompt += " Make this instrumental without vocals.";
    }
    
    if (customParams.tags) {
      detailedPrompt += ` Additional style elements: ${customParams.tags}.`;
    }
    
    if (customParams.customLyrics && !customParams.generateLyrics) {
      detailedPrompt += " Use the provided custom lyrics exactly as written.";
    }
  }
  
  return detailedPrompt;
}