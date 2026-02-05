/**
 * ============================================================
 * BOOSTIFY HIT MACHINE - AI LYRICS GENERATOR
 * ============================================================
 * Sistema de generación de letras de clase mundial usando OpenAI
 * Basado en la ESENCIA del género musical, no en la biografía
 * 
 * Inspirado en los mejores compositores:
 * - Max Martin (Pop hits)
 * - Pharrell Williams (Hip-hop/R&B)
 * - Dr. Dre (Rap)
 * - Martin Garrix (EDM)
 * - Taylor Swift (Country/Pop)
 */

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================
// ESENCIA DE CADA GÉNERO - Temas universales que crean hits
// ============================================================
interface GenreEssence {
  coreThemes: string[];
  emotionalPalette: string[];
  lyricalStyle: string;
  hitFormula: string;
  iconicReferences: string[];
  universalHooks: string[];
  avoidThemes: string[];
}

const GENRE_ESSENCE: Record<string, GenreEssence> = {
  'pop': {
    coreThemes: [
      'falling in love unexpectedly',
      'dancing through the night',
      'breaking free from expectations',
      'summer romance that changed everything',
      'self-empowerment and confidence',
      'the one that got away',
      'living in the moment',
      'lights, city, and dreams'
    ],
    emotionalPalette: ['euphoric', 'hopeful', 'bittersweet', 'empowered', 'nostalgic', 'carefree'],
    lyricalStyle: 'Conversational, relatable, with universal emotions. Simple but profound. Easy to sing along. Catchy phrases that stick.',
    hitFormula: 'Strong hook in first 10 seconds. Pre-chorus build. Explosive chorus. Bridge that adds new emotion. Final chorus with ad-libs.',
    iconicReferences: ['The Weeknd', 'Dua Lipa', 'Bruno Mars', 'Taylor Swift', 'Ed Sheeran', 'Ariana Grande'],
    universalHooks: ['Tonight', 'Forever', 'One more time', 'Can\'t stop', 'Never let go', 'All I need'],
    avoidThemes: ['death', 'politics', 'religion', 'violence', 'depression']
  },
  
  'hip-hop': {
    coreThemes: [
      'rising from nothing to everything',
      'real recognize real',
      'loyalty and brotherhood',
      'success and its responsibilities',
      'street wisdom and life lessons',
      'flexing achievements earned through grind',
      'protecting what\'s yours',
      'legacy and impact'
    ],
    emotionalPalette: ['confident', 'triumphant', 'reflective', 'hungry', 'authentic', 'unstoppable'],
    lyricalStyle: 'Clever wordplay, double entendres, braggadocious but authentic. Flow switches, internal rhymes. Storytelling with punchlines.',
    hitFormula: 'Hard-hitting intro. Verse with complex rhyme schemes. Melodic hook. Second verse elevates energy. Feature optional. Outro flex.',
    iconicReferences: ['Drake', 'Kendrick Lamar', 'J. Cole', 'Travis Scott', 'Future', '21 Savage'],
    universalHooks: ['On top', 'Made it', 'Real ones', 'No cap', 'We up', 'Different'],
    avoidThemes: ['explicit violence details', 'drug glorification', 'misogyny']
  },
  
  'rap': {
    coreThemes: [
      'lyrical supremacy and skill',
      'overcoming adversity and struggle',
      'speaking truth to power',
      'the art of the hustle',
      'mental warfare and chess moves',
      'from the bottom to legendary status',
      'authenticity in a fake world',
      'verbal assassination of doubters'
    ],
    emotionalPalette: ['intense', 'calculated', 'aggressive', 'introspective', 'hungry', 'legendary'],
    lyricalStyle: 'Complex multi-syllabic rhymes. Metaphors and similes. Storytelling with vivid imagery. Technical prowess. Bars that demand replay.',
    hitFormula: 'Statement intro. Dense lyrical verses. Hook that hits hard. Bridge with personal revelation. Final verse goes even harder.',
    iconicReferences: ['Eminem', 'Nas', 'Jay-Z', 'Lil Wayne', 'Kendrick Lamar', 'J.I.D'],
    universalHooks: ['Legend', 'Untouchable', 'King/Queen', 'Bars', 'Goat status', 'History'],
    avoidThemes: ['promoting violence', 'hate speech', 'explicit criminal activity']
  },
  
  'electronic': {
    coreThemes: [
      'losing yourself in the music',
      'unity on the dancefloor',
      'euphoric transcendence',
      'chasing the sunrise after an epic night',
      'connection through sound waves',
      'escaping reality into pure feeling',
      'the drop that changes everything',
      'lights and lasers painting emotions'
    ],
    emotionalPalette: ['euphoric', 'transcendent', 'energetic', 'hypnotic', 'liberating', 'connected'],
    lyricalStyle: 'Ethereal and atmospheric. Simple but impactful. Chant-like hooks. Builds tension. Release through the drop. Mantras and affirmations.',
    hitFormula: 'Atmospheric intro. Vocal hook builds. Pre-drop tension. Massive drop. Breakdown with emotional lyrics. Final drop bigger than first.',
    iconicReferences: ['Calvin Harris', 'Martin Garrix', 'Avicii', 'David Guetta', 'Zedd', 'Marshmello'],
    universalHooks: ['Feel it', 'Higher', 'Together', 'Let go', 'Tonight we', 'Forever'],
    avoidThemes: ['complex narratives', 'too many words', 'negative emotions']
  },
  
  'rock': {
    coreThemes: [
      'rebellion against the system',
      'raw emotional pain transformed into power',
      'freedom and the open road',
      'fighting for what you believe in',
      'the fire that burns within',
      'rising from the ashes',
      'us against the world',
      'living life on your own terms'
    ],
    emotionalPalette: ['defiant', 'passionate', 'raw', 'empowered', 'anthemic', 'liberated'],
    lyricalStyle: 'Raw and emotional. Anthemic choruses meant to be screamed. Imagery of fire, battle, freedom. Personal but universal.',
    hitFormula: 'Guitar riff intro. Verse builds tension. Pre-chorus lifts. Chorus explodes. Bridge introspective. Final chorus with full power.',
    iconicReferences: ['Foo Fighters', 'Imagine Dragons', 'Twenty One Pilots', 'Paramore', 'Fall Out Boy', 'Green Day'],
    universalHooks: ['We are', 'Stand up', 'Never back down', 'Burn it', 'Together', 'Alive'],
    avoidThemes: ['explicit nihilism', 'gratuitous shock value']
  },
  
  'r&b': {
    coreThemes: [
      'passionate love and desire',
      'late night confessions',
      'the chemistry that can\'t be denied',
      'healing from heartbreak through intimacy',
      'slow dancing in the moonlight',
      'soulmate connection',
      'sensual but classy romance',
      'vulnerability and trust'
    ],
    emotionalPalette: ['sensual', 'soulful', 'vulnerable', 'passionate', 'smooth', 'intimate'],
    lyricalStyle: 'Smooth and flowing. Romantic imagery. Metaphors for intimacy. Emotional vulnerability. Runs and ad-libs in delivery.',
    hitFormula: 'Smooth intro with vibe setting. Verse paints the scene. Pre-chorus builds desire. Chorus emotional payoff. Bridge reveals deeper feeling.',
    iconicReferences: ['The Weeknd', 'SZA', 'Frank Ocean', 'Usher', 'Chris Brown', 'Beyoncé'],
    universalHooks: ['All night', 'Your body', 'Close to me', 'Feel you', 'Paradise', 'Only you'],
    avoidThemes: ['explicit vulgarity', 'objectification', 'toxic relationships']
  },
  
  'reggaeton': {
    coreThemes: [
      'fiesta que no para',
      'atracción irresistible en la pista',
      'verano eterno y vibras tropicales',
      'perreo intenso hasta el amanecer',
      'conexión entre miradas',
      'noches de rumba y libertad',
      'el flow que mueve al mundo',
      'calor latino y pasión'
    ],
    emotionalPalette: ['fiestero', 'sensual', 'enérgico', 'caliente', 'libre', 'intenso'],
    lyricalStyle: 'Mezcla español/inglés. Frases pegajosas. Onomatopeyas. Referencias a bailar. Coros repetitivos y adictivos.',
    hitFormula: 'Dembow intro. Verso con flow. Pre-coro build. Coro explosivo. Segundo verso sube energía. Outro con ad-libs.',
    iconicReferences: ['Bad Bunny', 'J Balvin', 'Daddy Yankee', 'Karol G', 'Ozuna', 'Rauw Alejandro'],
    universalHooks: ['Dale', 'Baila', 'Perreo', 'Toda la noche', 'Mami', 'Fuego'],
    avoidThemes: ['misoginia explícita', 'violencia']
  },
  
  'latin': {
    coreThemes: [
      'amor apasionado bajo las estrellas',
      'ritmos que mueven el alma',
      'noches de salsa y bachata',
      'romance tropical',
      'la vida es una fiesta',
      'corazón latino orgulloso',
      'bailar como si no hubiera mañana',
      'amor que cruza fronteras'
    ],
    emotionalPalette: ['apasionado', 'alegre', 'romántico', 'nostálgico', 'festivo', 'sensual'],
    lyricalStyle: 'Poético y romántico. Metáforas de naturaleza. Ritmo en las palabras. Coros memorables. Mezcla de emociones.',
    hitFormula: 'Intro con ritmo característico. Verso cuenta historia. Coro memorable. Puente emocional. Outro con improvisación.',
    iconicReferences: ['Shakira', 'Enrique Iglesias', 'Marc Anthony', 'Romeo Santos', 'Maluma', 'Luis Fonsi'],
    universalHooks: ['Corazón', 'Bailamos', 'Mi amor', 'Esta noche', 'Contigo', 'Fuego'],
    avoidThemes: ['letras vacías', 'clichés gastados']
  },
  
  'indie': {
    coreThemes: [
      'quiet moments of profound beauty',
      'bittersweet memories of youth',
      'finding meaning in the mundane',
      'love in unexpected places',
      'the poetry of everyday life',
      'nostalgic longing for simpler times',
      'self-discovery through solitude',
      'the beauty in imperfection'
    ],
    emotionalPalette: ['melancholic', 'hopeful', 'introspective', 'dreamy', 'authentic', 'vulnerable'],
    lyricalStyle: 'Poetic and literary. Imagery over statement. Subtle emotions. Metaphors and symbolism. Conversational but deep.',
    hitFormula: 'Delicate intro. Verse paints imagery. Chorus quietly powerful. Bridge reveals vulnerability. Ending leaves space for reflection.',
    iconicReferences: ['Bon Iver', 'Phoebe Bridgers', 'Arctic Monkeys', 'Tame Impala', 'Hozier', 'Lana Del Rey'],
    universalHooks: ['Golden hour', 'Remember when', 'Quietly', 'Fade away', 'In between', 'Stay'],
    avoidThemes: ['forced positivity', 'clichés', 'overproduced feelings']
  },
  
  'country': {
    coreThemes: [
      'small town dreams and big city lights',
      'friday night with friends',
      'love on a back road',
      'family, faith, and home',
      'the simple life and its beauty',
      'trucks, bonfires, and starlit nights',
      'heartbreak and moving on',
      'hard work and honest living'
    ],
    emotionalPalette: ['nostalgic', 'proud', 'romantic', 'genuine', 'celebratory', 'reflective'],
    lyricalStyle: 'Storytelling with vivid details. Relatable scenarios. Americana imagery. Honest and direct. Singalong choruses.',
    hitFormula: 'Acoustic intro. Verse tells a story. Pre-chorus emotional turn. Chorus anthem-like. Bridge personal moment. Big finish.',
    iconicReferences: ['Luke Combs', 'Morgan Wallen', 'Carrie Underwood', 'Chris Stapleton', 'Kacey Musgraves', 'Kane Brown'],
    universalHooks: ['This town', 'Back home', 'Friday nights', 'Cold beer', 'True love', 'Country road'],
    avoidThemes: ['stereotypes', 'excessive drinking glorification']
  },
  
  'jazz': {
    coreThemes: [
      'smoky late-night romance',
      'city lights and champagne dreams',
      'sophisticated love affairs',
      'timeless elegance',
      'memories of better days',
      'the art of falling in love',
      'dancing cheek to cheek',
      'rainy day reflections'
    ],
    emotionalPalette: ['sophisticated', 'romantic', 'nostalgic', 'smooth', 'intimate', 'timeless'],
    lyricalStyle: 'Sophisticated vocabulary. Timeless themes. Romantic imagery. Clever wordplay. Classic song structure.',
    hitFormula: 'Elegant intro. Verse sets mood. Chorus memorable melody. Bridge jazz scat optional. Return to chorus with variation.',
    iconicReferences: ['Michael Bublé', 'Norah Jones', 'Diana Krall', 'Tony Bennett', 'Gregory Porter', 'Esperanza Spalding'],
    universalHooks: ['In your arms', 'The night is young', 'Dance with me', 'Moonlight', 'Forever yours', 'Blue'],
    avoidThemes: ['modern slang', 'casual language', 'explicit content']
  }
};

// ============================================================
// PRODUCTION BLUEPRINTS - Como los mejores productores
// ============================================================
interface ProductionBlueprint {
  stylePrompt: string;
  productionNotes: string;
  referenceProducers: string;
  soundPalette: string[];
  mixingStyle: string;
}

const PRODUCTION_BLUEPRINTS: Record<string, ProductionBlueprint> = {
  'pop': {
    stylePrompt: 'Billboard Hot 100 Pop production. Max Martin precision. Crisp modern synths, punchy layered drums, pristine vocal production. Radio-ready anthem mix. Euphoric melodic hooks. Swedish pop perfection.',
    productionNotes: 'Layer synths for width. Sidechain compression on bass. Vocal doubles on chorus. Bright EQ on vocals. Punchy snare. 808 sub-bass.',
    referenceProducers: 'Max Martin, Shellback, Jack Antonoff, Ryan Tedder',
    soundPalette: ['analog synths', 'programmed drums', 'vocal chops', 'piano stabs', 'string swells'],
    mixingStyle: 'Loud, bright, wide stereo field, vocal-forward'
  },
  
  'hip-hop': {
    stylePrompt: 'Platinum Hip-Hop. Metro Boomin dark atmosphere. Deep rumbling 808 sub-bass, crisp trap hi-hats, atmospheric pads. Stadium-ready drums. Drake-era melodic trap vibes. Hard-hitting certified platinum sound.',
    productionNotes: 'Deep 808s with long decay. Fast hi-hat rolls. Dark ambient pads. Reverb on snare. Vocal processing with autotune tastefully.',
    referenceProducers: 'Metro Boomin, Murda Beatz, Wheezy, Tay Keith, London on da Track',
    soundPalette: ['808 bass', 'trap hi-hats', 'dark pads', 'vocal samples', 'brass stabs'],
    mixingStyle: 'Bass-heavy, punchy, spacious, hard-hitting'
  },
  
  'rap': {
    stylePrompt: 'Grammy-winning Rap production. Dr. Dre legacy quality. Punchy layered drums, cinematic strings, west coast bounce. Technical precision. Lyric-forward mix. Boom bap meets modern trap elements.',
    productionNotes: 'Sample-based drums with punch. Piano or string melody. Bass sits in the pocket. Leave room for vocals. Dynamic range preserved.',
    referenceProducers: 'Dr. Dre, No I.D., Hit-Boy, Mustard, DJ Premier',
    soundPalette: ['sampled drums', 'piano loops', 'orchestral hits', 'scratches', 'bass guitar'],
    mixingStyle: 'Vocal clarity priority, punchy drums, balanced low end'
  },
  
  'electronic': {
    stylePrompt: 'Festival EDM anthem. Swedish House Mafia epicness. Massive supersaw synth drops, euphoric builds, pulsing basslines. Main stage energy. Progressive house structure. Tomorrowland headline quality.',
    productionNotes: 'Build tension pre-drop. Layer supersaws. Sidechain everything. White noise risers. Impact drums on drop. Cut bass before drop.',
    referenceProducers: 'Martin Garrix, Avicii, Calvin Harris, Zedd, Swedish House Mafia',
    soundPalette: ['supersaws', 'plucks', 'white noise', 'impact drums', 'vocal chops'],
    mixingStyle: 'Wide, loud, maximum energy, festival-ready'
  },
  
  'rock': {
    stylePrompt: 'Arena Rock production. Rick Rubin raw power. Crushing distorted guitars, thunderous live drums, driving bass. Anthemic energy. Raw emotion captured. Stadium singalong worthy.',
    productionNotes: 'Live drums with room mics. Wall of guitars. Bass follows kick. Vocal grit allowed. Dynamic contrast. Power chord focus.',
    referenceProducers: 'Rick Rubin, Butch Vig, Dave Cobb, Jacquire King',
    soundPalette: ['distorted guitars', 'live drums', 'bass guitar', 'piano accents', 'strings for epic moments'],
    mixingStyle: 'Powerful, raw, dynamic, room for performance'
  },
  
  'r&b': {
    stylePrompt: 'Platinum R&B production. The Weeknd dark R&B aesthetic. Silky bass grooves, lush neo-soul chords, crisp snares, warm atmospheric pads. Sensual groove. Grammy-quality vocal production.',
    productionNotes: 'Warm bass with character. Rhodes or wurlitzer keys. Subtle hi-hats. Reverb on snare. Layered background vocals. Space in the mix.',
    referenceProducers: 'The Neptunes, Darkchild, Timbaland, Cardiak, Nineteen85',
    soundPalette: ['Rhodes piano', 'warm bass', 'programmed drums', 'pad synths', 'vocal harmonies'],
    mixingStyle: 'Warm, smooth, intimate, groove-focused'
  },
  
  'reggaeton': {
    stylePrompt: 'Platinum Reggaeton. Tainy production quality. Heavy dembow riddim, deep 808 bass, tropical percussion. Club banger energy. Latin Grammy quality. Perreo approved beat.',
    productionNotes: 'Classic dembow pattern. Deep 808 with punch. Reggaeton synth stabs. Percussion layers. Vocal effects tasteful. Energy maintained throughout.',
    referenceProducers: 'Tainy, Sky Rompiendo, Ovy on the Drums, Dimelo Flow',
    soundPalette: ['dembow drums', '808 bass', 'synth stabs', 'percussion', 'brass hits'],
    mixingStyle: 'Bass-heavy, punchy, club-ready, energetic'
  },
  
  'latin': {
    stylePrompt: 'Latin Pop production. Luis Fonsi Despacito quality. Tropical rhythms, acoustic guitar warmth, percussion groove. Crossover appeal. Romantic yet danceable. International hit potential.',
    productionNotes: 'Acoustic guitar foundation. Latin percussion layers. Bass groove essential. Brass accents. Vocal ad-libs in Spanish. Build to chorus.',
    referenceProducers: 'Andrés Torres, Mauricio Rengifo, Edgar Barrera, Luny Tunes',
    soundPalette: ['acoustic guitar', 'congas', 'bongos', 'bass', 'brass section'],
    mixingStyle: 'Warm, rhythmic, vocal-forward, danceable'
  },
  
  'indie': {
    stylePrompt: 'Critically acclaimed Indie production. Bon Iver atmospheric textures. Warm reverb spaces, vintage instruments, dreamy layers. Authentic emotional depth. Blog-darling quality. Pitchfork approved sound.',
    productionNotes: 'Room sound important. Tape saturation. Vintage synths. Subtle production touches. Leave imperfections. Emotional dynamics.',
    referenceProducers: 'Aaron Dessner, Justin Vernon, Brian Eno, Dan Auerbach',
    soundPalette: ['vintage synths', 'acoustic instruments', 'ambient textures', 'vocal layers', 'tape effects'],
    mixingStyle: 'Intimate, atmospheric, dynamic, organic'
  },
  
  'country': {
    stylePrompt: 'Nashville Country production. Premium crossover sound. Warm acoustic guitar, pedal steel sweetness, fiddle accents. Storytelling support. Stadium country ready. CMT award quality.',
    productionNotes: 'Acoustic guitar drives. Pedal steel for emotion. Live drums with brushes. Bass supports. Keep it real. Building arrangement.',
    referenceProducers: 'Dave Cobb, Joey Moi, Dann Huff, Jay Joyce',
    soundPalette: ['acoustic guitar', 'pedal steel', 'fiddle', 'piano', 'live drums'],
    mixingStyle: 'Warm, authentic, vocal-forward, emotional'
  },
  
  'jazz': {
    stylePrompt: 'Blue Note Jazz production. Sophisticated arrangement. Warm piano chords, walking upright bass, brushed drums, brass elegance. Timeless sound. Jazz club intimacy. Grammy jazz quality.',
    productionNotes: 'Room mics for live feel. Piano recorded grand. Bass with tone. Brushes on snare. Horns with space. Dynamic performance.',
    referenceProducers: 'Larry Klein, Al Schmitt, Tommy LiPuma, David Foster',
    soundPalette: ['grand piano', 'upright bass', 'brushed drums', 'trumpet', 'saxophone'],
    mixingStyle: 'Natural, warm, dynamic, live feel'
  }
};

// ============================================================
// MOOD MODIFIERS - Ajusta el tono emocional
// ============================================================
interface MoodModifier {
  emotionalShift: string;
  lyricalAdjustment: string;
  productionTweak: string;
}

const MOOD_MODIFIERS: Record<string, MoodModifier> = {
  'energetic': {
    emotionalShift: 'High energy, unstoppable momentum, celebration of life',
    lyricalAdjustment: 'Active verbs, exclamatory phrases, urgent tempo in words',
    productionTweak: 'Faster BPM, brighter tones, more percussion, driving rhythm'
  },
  'mellow': {
    emotionalShift: 'Relaxed, contemplative, peaceful but engaged',
    lyricalAdjustment: 'Softer imagery, flowing phrases, gentle emotions',
    productionTweak: 'Slower tempo, warmer tones, less percussion, space in arrangement'
  },
  'upbeat': {
    emotionalShift: 'Happy, optimistic, feel-good vibes',
    lyricalAdjustment: 'Positive imagery, hopeful messages, singalong quality',
    productionTweak: 'Major keys, bright synths, bouncy rhythm, uplifting progression'
  },
  'dark': {
    emotionalShift: 'Intense, mysterious, powerful undercurrent',
    lyricalAdjustment: 'Shadow imagery, complex emotions, introspective depth',
    productionTweak: 'Minor keys, darker textures, atmospheric elements, tension'
  },
  'romantic': {
    emotionalShift: 'Intimate, passionate, emotionally vulnerable',
    lyricalAdjustment: 'Love imagery, sensual but tasteful, deep connection',
    productionTweak: 'Lush arrangement, warm tones, intimate production, smooth groove'
  }
};

// ============================================================
// MAIN FUNCTION: Generate Hit Lyrics with AI
// ============================================================
export interface LyricsGenerationParams {
  artistName: string;
  songTitle: string;
  genre: string;
  mood: string;
  artistGender: 'male' | 'female';
  artistBio?: string; // Solo para estilo vocal, NO para contenido
}

export interface GeneratedLyrics {
  lyrics: string;
  theme: string;
  hookLine: string;
  productionPrompt: string;
}

/**
 * Genera letras de hit mundial usando OpenAI
 * Basado en la ESENCIA del género, no en la biografía del artista
 */
export async function generateHitLyrics(params: LyricsGenerationParams): Promise<GeneratedLyrics> {
  const { artistName, songTitle, genre, mood, artistGender, artistBio } = params;
  
  // Obtener esencia del género
  const genreEssence = GENRE_ESSENCE[genre.toLowerCase()] || GENRE_ESSENCE['pop'];
  const production = PRODUCTION_BLUEPRINTS[genre.toLowerCase()] || PRODUCTION_BLUEPRINTS['pop'];
  const moodMod = MOOD_MODIFIERS[mood.toLowerCase()] || MOOD_MODIFIERS['energetic'];
  
  // Seleccionar tema aleatorio del género (evita monotonía)
  const selectedTheme = genreEssence.coreThemes[Math.floor(Math.random() * genreEssence.coreThemes.length)];
  const selectedHook = genreEssence.universalHooks[Math.floor(Math.random() * genreEssence.universalHooks.length)];
  
  // Construir el prompt maestro
  const systemPrompt = `You are a GRAMMY-winning songwriter who has written #1 hits for ${genreEssence.iconicReferences.join(', ')}.

Your songs have achieved:
- Multiple Billboard Hot 100 #1s
- Billions of streams on Spotify
- Global recognition across cultures

CRITICAL RULES:
1. Write ORIGINAL lyrics - never copy existing songs
2. Follow the HIT FORMULA exactly
3. Use UNIVERSAL themes that resonate globally
4. Create a HOOK that gets stuck in people's heads
5. Make every line SINGABLE and MEMORABLE
6. Avoid clichés - find fresh ways to express emotions
7. Include strategic repetition for catchiness
8. Write for ${artistGender === 'female' ? 'a powerful female voice' : 'a strong male voice'}

OUTPUT FORMAT:
Use these exact tags: [intro], [verse], [pre-chorus], [chorus], [verse], [chorus], [bridge], [outro]
Each section should be clearly labeled.`;

  const userPrompt = `Write a WORLDWIDE HIT song for ${artistName}.

SONG DETAILS:
- Title: "${songTitle}"
- Genre: ${genre.toUpperCase()} (${genreEssence.lyricalStyle})
- Mood: ${mood} (${moodMod.emotionalShift})
- Theme to explore: "${selectedTheme}"
- Try to incorporate: "${selectedHook}" naturally in the hook

GENRE HIT FORMULA:
${genreEssence.hitFormula}

EMOTIONAL PALETTE:
${genreEssence.emotionalPalette.join(', ')}

AVOID THESE THEMES:
${genreEssence.avoidThemes.join(', ')}

LYRICAL STYLE GUIDE:
${genreEssence.lyricalStyle}
${moodMod.lyricalAdjustment}

${artistBio ? `VOCAL STYLE HINT (for delivery only, NOT content): ${artistBio.substring(0, 200)}` : ''}

Write the complete song with:
1. A hook that becomes an earworm
2. Verses that build the emotional journey
3. A pre-chorus that creates anticipation
4. A chorus that explodes with the main message
5. A bridge that adds a new emotional layer
6. An outro that leaves them wanting more

The lyrics should feel like they could be playing on every radio station worldwide.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.9, // Alta creatividad
      max_tokens: 2000,
    });

    const generatedLyrics = response.choices[0]?.message?.content || '';
    
    // Extraer el hook del chorus
    const chorusMatch = generatedLyrics.match(/\[chorus\]([\s\S]*?)(?=\[|$)/i);
    const chorusText = chorusMatch ? chorusMatch[1].trim() : '';
    const hookLine = chorusText.split('\n')[0] || `${songTitle}!`;
    
    // Construir prompt de producción optimizado (300 chars max para MiniMax)
    const productionPrompt = `${production.stylePrompt} ${moodMod.productionTweak}`.substring(0, 300);
    
    console.log(`🎵 [HIT MACHINE] Generated lyrics for "${songTitle}" (${genre}/${mood})`);
    console.log(`🎵 Theme: "${selectedTheme}"`);
    console.log(`🎵 Hook: "${hookLine.substring(0, 50)}..."`);
    
    return {
      lyrics: generatedLyrics,
      theme: selectedTheme,
      hookLine: hookLine,
      productionPrompt: productionPrompt
    };
    
  } catch (error) {
    console.error('[HIT MACHINE] Error generating lyrics:', error);
    
    // Fallback: usar template mejorado
    return generateFallbackLyrics(params, genreEssence, selectedTheme);
  }
}

/**
 * Fallback lyrics generator (si OpenAI falla)
 */
function generateFallbackLyrics(
  params: LyricsGenerationParams,
  essence: GenreEssence,
  theme: string
): GeneratedLyrics {
  const { artistName, songTitle, genre, mood, artistGender } = params;
  const production = PRODUCTION_BLUEPRINTS[genre.toLowerCase()] || PRODUCTION_BLUEPRINTS['pop'];
  const moodMod = MOOD_MODIFIERS[mood.toLowerCase()] || MOOD_MODIFIERS['energetic'];
  
  const hook = essence.universalHooks[Math.floor(Math.random() * essence.universalHooks.length)];
  
  // Template dinámico basado en género
  const lyrics = `[intro]
${artistName}

[verse]
In the ${mood} night we come alive
Every moment feels like the first time
Chasing ${theme.split(' ')[0]} through the city lights
With you everything just feels right

[pre-chorus]
Can you feel it rising up inside
There's no way to hide what we feel tonight

[chorus]
${songTitle}, ${hook}
We're taking over, can't be stopped now
${songTitle}, this is our time
${hook}, we're gonna shine

[verse]
${theme} is what we're living for
Open up and show me something more
Every heartbeat leads us to this place
Look into my eyes, feel the embrace

[chorus]
${songTitle}, ${hook}
We're taking over, can't be stopped now
${songTitle}, this is our time
${hook}, we're gonna shine

[bridge]
When the world tries to bring us down
We'll rise up and wear the crown
Nothing's gonna stop us now
This is ${songTitle}

[outro]
${songTitle}... ${hook}
Yeah, ${artistName}`;

  return {
    lyrics,
    theme,
    hookLine: `${songTitle}, ${hook}`,
    productionPrompt: `${production.stylePrompt} ${moodMod.productionTweak}`.substring(0, 300)
  };
}

/**
 * Obtiene el prompt de producción para un género
 */
export function getProductionPrompt(genre: string, mood: string): string {
  const production = PRODUCTION_BLUEPRINTS[genre.toLowerCase()] || PRODUCTION_BLUEPRINTS['pop'];
  const moodMod = MOOD_MODIFIERS[mood.toLowerCase()] || MOOD_MODIFIERS['energetic'];
  
  return `${production.stylePrompt} ${moodMod.productionTweak}`.substring(0, 300);
}

/**
 * Obtiene la esencia de un género
 */
export function getGenreEssence(genre: string): GenreEssence {
  return GENRE_ESSENCE[genre.toLowerCase()] || GENRE_ESSENCE['pop'];
}

/**
 * Obtiene el blueprint de producción
 */
export function getProductionBlueprint(genre: string): ProductionBlueprint {
  return PRODUCTION_BLUEPRINTS[genre.toLowerCase()] || PRODUCTION_BLUEPRINTS['pop'];
}

export default {
  generateHitLyrics,
  getProductionPrompt,
  getGenreEssence,
  getProductionBlueprint,
  GENRE_ESSENCE,
  PRODUCTION_BLUEPRINTS,
  MOOD_MODIFIERS
};
