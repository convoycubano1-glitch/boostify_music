/**
 * Script para generar artistas aleatorios con metadata completa
 * y guardarlos en Firestore para su uso en otras herramientas
 */

import { db } from '../server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';
import axios from 'axios';

/**
 * Genera un ID único con prefijo
 * @param prefix Prefijo para el ID
 * @returns ID único
 */
function generateId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${randomPart}`;
}

/**
 * Genera una duración aleatoria en formato MM:SS
 * @returns Duración en formato de string
 */
function generateRandomDuration(): string {
  const minutes = Math.floor(Math.random() * 5) + 2; // Entre 2 y 6 minutos
  const seconds = Math.floor(Math.random() * 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Genera una descripción artística usando OpenRouter
 * @param prompt El prompt para generar la descripción
 * @returns Descripción generada o descripción de fallback si hay error
 */
async function generateAIDescription(prompt: string): Promise<string> {
  try {
    const openRouterKey = process.env.VITE_OPENROUTER_API_KEY || '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';
    
    if (!openRouterKey) {
      console.warn('No se encontró la API key de OpenRouter, usando descripción generada localmente');
      return '';
    }
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en describir artistas musicales con detalles físicos, estilísticos y de personalidad. Genera descripciones realistas, diversas y detalladas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content.trim();
    } else {
      console.warn('Respuesta vacía de OpenRouter, usando descripción generada localmente');
      return '';
    }
  } catch (error) {
    console.error('Error al generar descripción con OpenRouter:', error);
    return '';
  }
}

/**
 * Genera un artista aleatorio con todos los datos necesarios
 * @returns Datos del artista generado
 */
export async function generateRandomArtist() {
  // Usar semilla aleatoria para tener consistencia por artista
  const seed = Math.floor(Math.random() * 10000);
  faker.seed(seed);

  // Géneros musicales disponibles
  const musicGenres = [
    'Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 
    'Classical', 'Country', 'Folk', 'Reggae', 'Blues',
    'Metal', 'Punk', 'Alternative', 'Indie', 'Latin',
    'K-Pop', 'J-Pop', 'Trap', 'Techno', 'House', 'EDM',
    'Soul', 'Funk', 'Disco', 'Synthwave', 'Lo-Fi', 'Ambient'
  ];

  // Seleccionar 1-3 géneros musicales aleatorios
  const selectedGenres = faker.helpers.arrayElements(
    musicGenres, 
    faker.number.int({ min: 1, max: 3 })
  );

  // Generar un nombre de artista
  const useRealName = faker.datatype.boolean();
  const artistName = useRealName 
    ? `${faker.person.firstName()} ${faker.person.lastName()}`
    : faker.word.words({ count: { min: 1, max: 3 } }).replace(/^\w/, c => c.toUpperCase());

  // Datos del plan de suscripción - Siempre generamos un plan
  const SUBSCRIPTION_PLANS = [
    { name: "Basic", price: 59.99 },
    { name: "Pro", price: 99.99 },
    { name: "Enterprise", price: 149.99 }
  ];
  const selectedPlan = faker.helpers.arrayElement(SUBSCRIPTION_PLANS);
  
  // Datos de videos generados - 30% probabilidad de tener videos
  const videoPrice = 199;
  const hasVideos = faker.datatype.boolean(0.3); // 30% de probabilidad según lo solicitado
  const videosGenerated = hasVideos ? faker.number.int({ min: 1, max: 5 }) : 0;
  const totalVideoSpend = videoPrice * videosGenerated;
  
  // Datos de cursos comprados - 5% probabilidad de tener cursos
  const hasCourses = faker.datatype.boolean(0.05); // 5% de probabilidad según lo solicitado
  const coursesData = generateRandomCourses(faker, hasCourses); // Solo fuerza cursos si la probabilidad lo permite
  const totalCourseSpend = coursesData.reduce((total, course) => total + course.price, 0);

  // Generar título del álbum
  const albumTitle = faker.music.songName();

  // Número de canciones en el álbum (entre 5 y 12)
  const songCount = faker.number.int({ min: 5, max: 12 });

  // Generar canciones
  const songs = Array.from({ length: songCount }, () => ({
    title: faker.music.songName(),
    duration: generateRandomDuration(),
    composers: faker.helpers.arrayElements(
      [artistName, faker.person.fullName(), faker.person.fullName()],
      faker.number.int({ min: 1, max: 3 })
    ),
    explicit: faker.datatype.boolean(0.3) // 30% de probabilidad de ser explícito
  }));

  // Seleccionar una canción aleatoria como single
  const singleIndex = faker.number.int({ min: 0, max: songs.length - 1 });
  const single = {
    title: songs[singleIndex].title,
    duration: songs[singleIndex].duration
  };

  // Generar fecha de lanzamiento (entre 3 meses en el pasado y 6 meses en el futuro)
  const now = new Date();
  const releaseDate = faker.date.between({
    from: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
    to: new Date(now.getFullYear(), now.getMonth() + 6, now.getDate())
  });
  
  // Generar nombre de usuario para redes sociales
  const socialHandle = artistName.toLowerCase().replace(/\s+/g, '_');
  const boostifySocialHandle = `boostify_${socialHandle}`;

  // Generar colores para el esquema de color
  const colors = [
    'Negro', 'Blanco', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja',
    'Púrpura', 'Rosa', 'Turquesa', 'Plateado', 'Dorado', 'Neón'
  ];
  const selectedColors = faker.helpers.arrayElements(colors, faker.number.int({ min: 2, max: 4 }));
  
  // Características físicas detalladas con mayor diversidad
  // Expandir opciones de género
  const genderOptions = faker.helpers.arrayElement([
    { value: 'Mujer', probability: 0.45 },
    { value: 'Hombre', probability: 0.45 },
    { value: 'No binario', probability: 0.05 },
    { value: 'Género fluido', probability: 0.05 }
  ]);
  const gender = genderOptions.value;
  
  // Expandir opciones de edad para incluir adolescentes y personas mayores
  const ageOptions = faker.helpers.arrayElement([
    { value: 'adolescente (14-19 años)', probability: 0.15 },
    { value: 'joven (20-30 años)', probability: 0.4 },
    { value: 'de mediana edad (30-45 años)', probability: 0.3 },
    { value: 'maduro (45-60 años)', probability: 0.1 },
    { value: 'senior (60+ años)', probability: 0.05 }
  ]);
  const age = ageOptions.value;
  
  // Ajustar altura según edad
  const isAdolescent = age.includes('adolescente');
  const height = faker.number.int({ 
    min: isAdolescent ? 150 : 160, 
    max: isAdolescent ? 185 : 190 
  });
  
  const eyeColor = faker.helpers.arrayElement(['marrón oscuro', 'marrón claro', 'verde', 'azul', 'avellana', 'gris', 'ámbar', 'heterocromía (ojos de diferente color)']);
  const skinTone = faker.helpers.arrayElement(['clara', 'media', 'morena', 'oscura', 'olivácea', 'bronceada', 'pálida']);
  const facialFeatures = faker.helpers.arrayElements([
    'rasgos angulosos', 'rasgos suaves', 'pómulos pronunciados', 'mandíbula definida',
    'rostro ovalado', 'rostro redondo', 'cejas expresivas', 'labios gruesos', 'labios finos',
    'mirada penetrante', 'expresión serena', 'sonrisa carismática', 'mirada intensa',
    'nariz respingada', 'nariz aguileña', 'hoyuelos', 'pecas', 'lunar distintivo'
  ], { min: 2, max: 4 });
  
  // Generar descripción del estilo visual
  const fashionStyles = [
    'minimalista', 'elegante', 'urbano', 'vintage', 'futurista',
    'vanguardista', 'retro', 'clásico', 'alternativo', 'casual',
    'formal', 'ecléctico', 'cyberpunk', 'bohemio', 'grunge'
  ];
  const accessories = [
    'gafas de sol', 'sombreros', 'joyería statement', 'guantes',
    'cadenas', 'piercings', 'tatuajes visibles', 'maquillaje dramático',
    'pañuelos', 'bufandas', 'bandanas', 'relojes', 'botas'
  ];
  const hairStyles = [
    'cabello largo', 'cabello corto', 'cabello teñido', 'rastas',
    'undercut', 'afro', 'cabello rizado', 'cabello liso', 'mullet',
    'mohawk', 'cabello trenzado'
  ];

  const selectedFashion = faker.helpers.arrayElement(fashionStyles);
  const selectedAccessory = faker.helpers.arrayElement(accessories);
  const selectedHairStyle = faker.helpers.arrayElement(hairStyles);
  const hairColor = faker.helpers.arrayElement(['negro', 'castaño oscuro', 'castaño claro', 'rubio', 'pelirrojo', 'gris', 'teñido de azul', 'teñido de verde', 'teñido de morado', 'teñido de rosa']);
  const bodyType = faker.helpers.arrayElement(['delgado', 'atlético', 'musculoso', 'robusto', 'curvilíneo']);

  // Generar descripciones con OpenRouter para mayor diversidad
  // Preparamos primero las descripciones locales como respaldo
  const defaultLookDescription = `${gender} ${age} de ${height}cm de altura con complexión ${bodyType}. Tiene ojos ${eyeColor}, piel ${skinTone} y ${facialFeatures.join(', ')}. Su cabello es ${hairColor} con estilo ${selectedHairStyle}. Suele lucir ${selectedAccessory} como accesorio distintivo. Viste con estilo ${selectedFashion} usando principalmente colores ${selectedColors.join(', ')} que reflejan su identidad musical. Su presencia escénica es ${faker.helpers.arrayElement(['magnética', 'intensa', 'relajada', 'enigmática', 'extravagante', 'minimalista'])}.`;

  const defaultBiography = `${artistName} es un${gender === 'Mujer' ? 'a' : gender === 'No binario' || gender === 'Género fluido' ? 'x' : ''} talentoso${gender === 'Mujer' ? 'a' : gender === 'No binario' || gender === 'Género fluido' ? 'x' : ''} artista de ${selectedGenres.join(', ')} originario${gender === 'Mujer' ? 'a' : gender === 'No binario' || gender === 'Género fluido' ? 'x' : ''} de ${faker.location.city()}, ${faker.location.country()}. Conocido${gender === 'Mujer' ? 'a' : gender === 'No binario' || gender === 'Género fluido' ? 'x' : ''} por sus composiciones únicas y su ${faker.helpers.arrayElement(['potente', 'melódica', 'emotiva', 'versátil', 'distintiva'])} voz, ha logrado cautivar audiencias en todo el mundo. Su música explora temas de ${faker.helpers.arrayElements(['amor', 'identidad', 'sociedad', 'política', 'naturaleza', 'tecnología', 'existencialismo', 'cultura urbana'], faker.number.int({ min: 1, max: 3 })).join(', ')}.`;

  // Intentar generar descripciones con OpenRouter para mayor diversidad
  let detailedLookDescription = defaultLookDescription;
  let biography = defaultBiography;
  
  // Prompt para la descripción física
  const lookPrompt = `Genera una descripción física detallada y creativa para un artista musical con estas características:
- Género: ${gender}
- Edad: ${age}
- Altura: ${height}cm
- Complexión: ${bodyType}
- Ojos: ${eyeColor}
- Piel: ${skinTone}
- Cabello: ${hairColor}, estilo ${selectedHairStyle}
- Estilo de moda: ${selectedFashion}
- Accesorios: ${selectedAccessory}
- Colores preferidos: ${selectedColors.join(', ')}
- Música: ${selectedGenres.join(', ')}

Escribe en tercera persona, entre 100-150 palabras, destacando rasgos únicos y apariencia escénica. Usa lenguaje vívido y descriptivo que capture la esencia visual del artista.`;

  // Prompt para la biografía
  const bioPrompt = `Genera una biografía creativa para ${artistName}, un artista musical con estas características:
- Género: ${gender}
- Edad: ${age}
- Géneros musicales: ${selectedGenres.join(', ')}
- Ciudad de origen: ${faker.location.city()}, ${faker.location.country()}
- Estilo visual: ${selectedFashion}, con colores ${selectedColors.join(', ')}
- Temas explorados: ${faker.helpers.arrayElements(['amor', 'identidad', 'sociedad', 'política', 'naturaleza', 'tecnología', 'existencialismo', 'cultura urbana'], faker.number.int({ min: 1, max: 3 })).join(', ')}

Escribe en tercera persona, entre 100-150 palabras, destacando su historia personal, influencias, logros y estilo musical único. Usa un tono que refleje su género musical.`;

  try {
    // Intentar obtener descripciones de OpenRouter
    const lookDescriptionAI = await generateAIDescription(lookPrompt);
    const biographyAI = await generateAIDescription(bioPrompt);
    
    // Usar las descripciones de AI si las recibimos correctamente
    if (lookDescriptionAI && lookDescriptionAI.length > 50) {
      detailedLookDescription = lookDescriptionAI;
    }
    
    if (biographyAI && biographyAI.length > 50) {
      biography = biographyAI;
    }
  } catch (error) {
    console.warn('Error al generar descripciones con OpenRouter, usando descripciones locales.', error);
    // Mantenemos las descripciones por defecto
  }

  // Generar videos 
  const videos = generateRandomVideos(faker, videosGenerated);

  // Construir el objeto completo del artista
  const artistData = {
    id: generateId("ART"),
    name: artistName,
    biography: biography,
    album: {
      id: generateId("ALB"),
      name: albumTitle,
      release_date: releaseDate.toISOString().split('T')[0],
      songs: songs,
      single: single
    },
    look: {
      description: detailedLookDescription,
      color_scheme: selectedColors.join(', ')
    },
    music_genres: selectedGenres,
    image_prompts: {
      artist_look: `${gender} ${age} con ${selectedHairStyle} ${hairColor}, ${selectedAccessory}, estilo ${selectedFashion}, complexión ${bodyType}, ojos ${eyeColor}, piel ${skinTone}, ${facialFeatures[0]}, colores predominantes ${selectedColors.slice(0, 2).join(' y ')}, ambiente de ${faker.helpers.arrayElement(['estudio', 'escenario', 'urbano', 'natural', 'futurista'])}`,
      album_cover: `Portada de álbum de ${selectedGenres.join(' y ')}, estética ${selectedFashion}, colores ${selectedColors.join(', ')}, concepto visual que representa ${faker.helpers.arrayElement(['emociones intensas', 'paisajes abstractos', 'simbolismo minimalista', 'collage fotográfico', 'ilustración digital'])}`,
      promotional: `${gender} en pose ${faker.helpers.arrayElement(['natural', 'dinámica', 'pensativa', 'artística', 'poderosa'])}, ambiente ${faker.helpers.arrayElement(['urbano', 'de estudio', 'escénico', 'natural', 'abstracto'])}, iluminación ${faker.helpers.arrayElement(['cálida', 'fría', 'de alto contraste', 'dramática', 'suave'])}`
    },
    social_media: {
      twitter: {
        handle: boostifySocialHandle,
        url: `https://twitter.com/${boostifySocialHandle}`
      },
      instagram: {
        handle: boostifySocialHandle,
        url: `https://instagram.com/${boostifySocialHandle}`
      },
      tiktok: {
        handle: boostifySocialHandle,
        url: `https://tiktok.com/@${boostifySocialHandle}`
      },
      youtube: {
        handle: boostifySocialHandle,
        url: `https://youtube.com/@${boostifySocialHandle}`
      },
      spotify: {
        handle: boostifySocialHandle,
        url: `https://open.spotify.com/artist/${boostifySocialHandle}`
      }
    },
    password: {
      value: `${faker.internet.password({ length: 12, memorable: true, pattern: /[A-Za-z0-9_@]/ })}`,
      last_updated: new Date().toISOString().split('T')[0]
    },
    management: {
      email: "info@boostifymusic.com",
      phone: "+14707983684"
    },
    subscription: {
      plan: selectedPlan.name,
      price: selectedPlan.price,
      status: faker.helpers.arrayElement(['active', 'trial', 'expired']),
      startDate: faker.date.past().toISOString().split('T')[0],
      renewalDate: faker.date.future().toISOString().split('T')[0]
    },
    purchases: {
      videos: {
        count: videosGenerated,
        totalSpent: totalVideoSpend,
        lastPurchase: videosGenerated > 0 ? faker.date.recent().toISOString().split('T')[0] : null,
        videos: videos
      },
      courses: {
        count: coursesData.length,
        totalSpent: totalCourseSpend,
        lastPurchase: coursesData.length > 0 ? faker.date.recent().toISOString().split('T')[0] : null,
        courses: coursesData
      }
    }
  };

  return artistData;
}

/**
 * Genera datos de cursos aleatorios
 * @param faker Instancia de Faker
 * @param forceAtLeastOne Si es true, garantiza al menos un curso
 * @returns Array de cursos comprados
 */
function generateRandomCourses(faker: any, forceAtLeastOne: boolean = false) {
  // Si no hay que forzar cursos, devolver un array vacío
  if (!forceAtLeastOne) {
    return [];
  }

  // Si forzamos cursos, generar entre 1 y 3 cursos
  const courseCount = faker.number.int({ min: 1, max: 3 });
  const courses = [];
  
  const COURSE_TITLES = [
    "Producción Musical Avanzada",
    "Marketing Digital para Músicos",
    "Composición para Bandas Sonoras",
    "Técnicas Vocales Profesionales",
    "Distribución Musical en la Era Digital",
    "Masterización de Audio",
    "Estrategias de Lanzamiento Musical",
    "Armonía y Teoría Musical",
    "Creación de Beats"
  ];
  
  for (let i = 0; i < courseCount; i++) {
    const price = faker.number.int({ min: 149, max: 299 });
    const title = faker.helpers.arrayElement(COURSE_TITLES);
    
    courses.push({
      id: generateId("CRS"),
      title,
      price,
      purchaseDate: faker.date.past().toISOString().split('T')[0],
      progress: faker.number.int({ min: 0, max: 100 }),
      completed: faker.datatype.boolean(0.4) // 40% de probabilidad que esté completado
    });
  }
  
  return courses;
}

/**
 * Genera datos de videos aleatorios
 * @param faker Instancia de Faker
 * @param count Cantidad de videos
 * @returns Array de videos generados
 */
function generateRandomVideos(faker: any, count: number) {
  const videos = [];
  
  const VIDEO_TYPES = [
    "Visualizador de audio",
    "Video musical completo",
    "Teaser promocional",
    "Lyric video",
    "Behind the scenes"
  ];
  
  for (let i = 0; i < count; i++) {
    videos.push({
      id: generateId("VID"),
      title: faker.music.songName(),
      type: faker.helpers.arrayElement(VIDEO_TYPES),
      duration: `${faker.number.int({ min: 1, max: 5 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, '0')}`,
      creationDate: faker.date.past().toISOString().split('T')[0],
      resolution: faker.helpers.arrayElement(["720p", "1080p", "4K"]),
      price: 199
    });
  }
  
  return videos;
}

// Esta implementación ha sido migrada al archivo server/routes/artist-generator.ts
// Mantenemos la firma de la función para compatibilidad
async function saveArtistToFirestore(artistData: any): Promise<string> {
  throw new Error('Esta función ha sido migrada al archivo server/routes/artist-generator.ts');
}

/**
 * Función principal que genera y guarda un artista
 */
async function main() {
  try {
    console.log('Generando artista aleatorio...');
    const artistData = await generateRandomArtist();
    console.log('Datos del artista generados:', JSON.stringify(artistData, null, 2));
    
    console.log('Guardando artista en Firestore...');
    const firestoreId = await saveArtistToFirestore(artistData);
    console.log(`Artista guardado exitosamente con ID de Firestore: ${firestoreId}`);
    
    return { artistData, firestoreId };
  } catch (error) {
    console.error('Error en el proceso de generación de artista:', error);
    throw error;
  }
}

// Ejecutar el script si es llamado directamente
// Usando la forma de módulos ES para detectar si es el archivo principal
// En lugar de require.main === module que es específico de CommonJS
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main()
    .then(() => {
      console.log('Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en el proceso:', error);
      process.exit(1);
    });
}

// Exportar funciones para uso en otros archivos
// Nota: generateRandomArtist ya está exportado directamente arriba
export {
  saveArtistToFirestore,
  main as generateArtist
};