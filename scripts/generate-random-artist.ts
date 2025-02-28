/**
 * Script para generar artistas aleatorios con metadata completa
 * y guardarlos en Firestore para su uso en otras herramientas
 */

import { db } from '../server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { faker } from '@faker-js/faker';

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
 * Genera un artista aleatorio con todos los datos necesarios
 * @returns Datos del artista generado
 */
export function generateRandomArtist() {
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

  const fashionDescription = `Estilo ${selectedFashion} con ${selectedHairStyle}, ${selectedAccessory} y ropa que refleja su identidad musical.`;

  // Generar biografía basada en los géneros y estilo
  const biography = `${artistName} es un${faker.person.gender() === 'female' ? 'a' : ''} talentoso${faker.person.gender() === 'female' ? 'a' : ''} artista de ${selectedGenres.join(', ')} originario${faker.person.gender() === 'female' ? 'a' : ''} de ${faker.location.city()}, ${faker.location.country()}. Conocido${faker.person.gender() === 'female' ? 'a' : ''} por sus composiciones únicas y su ${faker.helpers.arrayElement(['potente', 'melódica', 'emotiva', 'versátil', 'distintiva'])} voz, ha logrado cautivar audiencias en todo el mundo. Su música explora temas de ${faker.helpers.arrayElements(['amor', 'identidad', 'sociedad', 'política', 'naturaleza', 'tecnología', 'existencialismo', 'cultura urbana'], faker.number.int({ min: 1, max: 3 })).join(', ')}.`;

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
      description: fashionDescription,
      color_scheme: selectedColors.join(', ')
    },
    music_genres: selectedGenres,
    image_prompts: {
      artist_look: `${faker.person.gender() === 'female' ? 'Mujer' : 'Hombre'} ${faker.helpers.arrayElement(['joven', 'maduro', 'de mediana edad'])} con ${selectedHairStyle}, ${selectedAccessory}, estilo ${selectedFashion}, colores predominantes ${selectedColors.slice(0, 2).join(' y ')}, ambiente de ${faker.helpers.arrayElement(['estudio', 'escenario', 'urbano', 'natural', 'futurista'])}`,
      album_cover: `Portada de álbum de ${selectedGenres.join(' y ')}, estética ${selectedFashion}, colores ${selectedColors.join(', ')}, concepto visual que representa ${faker.helpers.arrayElement(['emociones intensas', 'paisajes abstractos', 'simbolismo minimalista', 'collage fotográfico', 'ilustración digital'])}`,
      promotional: `${faker.person.gender() === 'female' ? 'Artista femenina' : 'Artista masculino'} en pose ${faker.helpers.arrayElement(['natural', 'dinámica', 'pensativa', 'artística', 'poderosa'])}, ambiente ${faker.helpers.arrayElement(['urbano', 'de estudio', 'escénico', 'natural', 'abstracto'])}, iluminación ${faker.helpers.arrayElement(['cálida', 'fría', 'de alto contraste', 'dramática', 'suave'])}`
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
      email: `management@${artistName.toLowerCase().replace(/\s+/g, '')}.com`,
      phone: faker.phone.number()
    }
  };

  return artistData;
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
    const artistData = generateRandomArtist();
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