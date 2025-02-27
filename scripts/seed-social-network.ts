import { db } from "../db";
import { socialUsers, posts, comments, NewSocialUser, NewPost, NewComment } from "../db/schema";
import { eq } from "drizzle-orm";
import { Configuration, OpenAIApi } from "openai";
import axios from "axios";

// Configuración para OpenRouter API
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Función para generar una respuesta de OpenRouter
async function generateOpenRouterResponse(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "anthropic/claude-3-opus:beta",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://boostify.music.education",
          "X-Title": "Boostify Music Education"
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating response from OpenRouter:", error);
    return "Lo siento, no pude generar una respuesta en este momento.";
  }
}

// Datos de perfiles de usuario interesantes y variados
const userProfiles = [
  {
    username: "musicpro_alex",
    displayName: "Alex Rodriguez",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    bio: "Producer and guitar enthusiast. Looking to collaborate with emerging artists.",
    language: "en",
    personality: "passionate, friendly, collaborative",
    interests: ["guitar", "music production", "rock", "indie music"]
  },
  {
    username: "beatmaker_sam",
    displayName: "Samantha Lee",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    bio: "Beat maker from LA. Hip-hop is my life. DM for collaborations.",
    language: "en",
    personality: "creative, direct, ambitious",
    interests: ["hip-hop", "beat making", "sampling", "music production"]
  },
  {
    username: "classicaljulia",
    displayName: "Julia Petrov",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    bio: "Classical pianist and composer. Trained at Juilliard. Teaching and performing.",
    language: "en",
    personality: "sophisticated, precise, thoughtful",
    interests: ["classical music", "piano", "composition", "music theory"]
  },
  {
    username: "dj_marco",
    displayName: "Marco Torres",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    bio: "DJ spinning at clubs around Miami. Electronic music producer.",
    language: "en",
    personality: "energetic, outgoing, night owl",
    interests: ["electronic music", "DJing", "festivals", "nightlife"]
  },
  {
    username: "vocalcoach_emma",
    displayName: "Emma Wilson",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    bio: "Vocal coach with 10+ years experience. Helping singers find their unique voice.",
    language: "en",
    personality: "supportive, professional, detail-oriented",
    interests: ["vocal techniques", "singing", "coaching", "music education"]
  },
  {
    username: "rapero_carlos",
    displayName: "Carlos Mendez",
    avatar: "https://randomuser.me/api/portraits/men/6.jpg",
    bio: "Rapero y compositor. Representando la cultura latina en el hip-hop.",
    language: "es",
    personality: "authentic, determined, proud",
    interests: ["rap", "latin music", "songwriting", "street culture"]
  },
  {
    username: "folk_harper",
    displayName: "Harper Evans",
    avatar: "https://randomuser.me/api/portraits/women/7.jpg",
    bio: "Folk singer-songwriter. Telling stories through music.",
    language: "en",
    personality: "introspective, observant, poetic",
    interests: ["folk music", "songwriting", "acoustic guitar", "storytelling"]
  },
  {
    username: "bassmaster_dave",
    displayName: "Dave Johnson",
    avatar: "https://randomuser.me/api/portraits/men/8.jpg",
    bio: "Bass player with 15 years experience. Session musician and touring professional.",
    language: "en",
    personality: "reliable, laid-back, professional",
    interests: ["bass guitar", "session work", "funk", "jazz"]
  },
  {
    username: "musicteacher_li",
    displayName: "Li Wei",
    avatar: "https://randomuser.me/api/portraits/women/9.jpg",
    bio: "Music teacher specializing in early education. Bringing music to young minds.",
    language: "en",
    personality: "patient, enthusiastic, creative",
    interests: ["music education", "early learning", "instrument teaching", "curriculum development"]
  },
  {
    username: "jazztrumpeter",
    displayName: "Michael Green",
    avatar: "https://randomuser.me/api/portraits/men/10.jpg",
    bio: "Jazz trumpeter and band leader. Bebop enthusiast.",
    language: "en",
    personality: "improvisational, expressive, disciplined",
    interests: ["jazz", "trumpet", "bebop", "improvisation"]
  },
  {
    username: "rockerchick",
    displayName: "Jessica Black",
    avatar: "https://randomuser.me/api/portraits/women/11.jpg",
    bio: "Rock band frontwoman. Living the dream on and off stage.",
    language: "en",
    personality: "bold, charismatic, rebel",
    interests: ["rock music", "performing", "songwriting", "stage presence"]
  },
  {
    username: "audioengineer_pat",
    displayName: "Patrick Murphy",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    bio: "Audio engineer and studio owner. Creating the perfect sound is my passion.",
    language: "en",
    personality: "technical, meticulous, patient",
    interests: ["audio engineering", "studio recording", "mixing", "mastering"]
  },
  {
    username: "violinista_maria",
    displayName: "María Hernández",
    avatar: "https://randomuser.me/api/portraits/women/13.jpg",
    bio: "Violinista profesional. Orquesta sinfónica y proyectos independientes.",
    language: "es",
    personality: "dedicated, emotional, perfectionist",
    interests: ["classical violin", "orchestral music", "chamber music", "teaching"]
  },
  {
    username: "musictherapist",
    displayName: "Sarah Thompson",
    avatar: "https://randomuser.me/api/portraits/women/14.jpg",
    bio: "Music therapist working with special needs children. Music heals.",
    language: "en",
    personality: "compassionate, patient, spiritual",
    interests: ["music therapy", "healing", "special education", "psychology"]
  },
  {
    username: "drummerjosh",
    displayName: "Josh Davidson",
    avatar: "https://randomuser.me/api/portraits/men/15.jpg",
    bio: "Professional drummer available for studio and live gigs. Hard hitter.",
    language: "en",
    personality: "energetic, reliable, precise",
    interests: ["drums", "percussion", "session work", "rhythm"]
  },
  {
    username: "producer_nina",
    displayName: "Nina Williams",
    avatar: "https://randomuser.me/api/portraits/women/16.jpg",
    bio: "Music producer specializing in electronic and pop. Looking for next breakout artist.",
    language: "en",
    personality: "innovative, business-minded, trend-aware",
    interests: ["music production", "pop music", "artist development", "industry trends"]
  },
  {
    username: "bluesmaster",
    displayName: "Robert King",
    avatar: "https://randomuser.me/api/portraits/men/17.jpg",
    bio: "Blues guitarist carrying on tradition. Influenced by the greats.",
    language: "en",
    personality: "soulful, authentic, storyteller",
    interests: ["blues", "guitar", "musical heritage", "improvisation"]
  },
  {
    username: "soprano_elena",
    displayName: "Elena Morozova",
    avatar: "https://randomuser.me/api/portraits/women/18.jpg",
    bio: "Opera soprano with international performance experience. Teaching master classes.",
    language: "en",
    personality: "dramatic, disciplined, expressive",
    interests: ["opera", "classical voice", "performance", "Italian arias"]
  },
  {
    username: "songwriterben",
    displayName: "Ben Foster",
    avatar: "https://randomuser.me/api/portraits/men/19.jpg",
    bio: "Professional songwriter. Credits on Billboard Top 100. Always looking for new collaborators.",
    language: "en",
    personality: "creative, analytical, collaborative",
    interests: ["songwriting", "pop music", "collaboration", "lyrics"]
  },
  {
    username: "musicbiz_tanya",
    displayName: "Tanya Mitchell",
    avatar: "https://randomuser.me/api/portraits/women/20.jpg",
    bio: "Music business executive. A&R specialist looking for fresh talent.",
    language: "en",
    personality: "strategic, decisive, networker",
    interests: ["music business", "A&R", "talent scouting", "industry trends"]
  }
];

// Temas de publicaciones sobre música que son interesantes y pueden generar engagement
const postTopics = [
  "What do you think is the most influential music genre of all time?",
  "Just finished recording my new track. Can't wait to share it with all of you!",
  "What DAW do you use for music production and why?",
  "Looking for recommendations on good budget microphones for home recording",
  "Who's your biggest musical influence and how have they shaped your style?",
  "The future of music education is online - agree or disagree?",
  "Just had my first virtual music lesson - it was amazing!",
  "What's one instrument you've always wanted to learn?",
  "Anyone have tips for overcoming performance anxiety?",
  "Physical albums vs streaming - what's your take?",
  "Music theory: necessary skill or creative limitation?",
  "Favorite vocal warm-up exercises? Share your routine!",
  "How has your musical journey evolved over the years?",
  "Just got accepted into a prestigious music program!",
  "Advice for musicians trying to build their social media presence?",
  "Looking for collaborators on a new jazz fusion project",
  "What's the most challenging piece you've ever performed?",
  "Home studio setup tour - check out my creative space!",
  "La música latina está dominando globalmente - ¿por qué crees que es así?",
  "Classical music needs to innovate to stay relevant - thoughts?",
  "Share your favorite music education resources",
  "Just landed my first paid gig as a session musician!",
  "How do you balance technical skill and emotional expression in your playing?",
  "Music copyright in the digital age - protecting your work",
  "The importance of mentorship in musical development",
  "Anyone attending the upcoming music industry conference?",
  "Your thoughts on AI in music composition?",
  "Best music schools/programs based on your experience?",
  "How to network effectively in the music industry",
  "Music is healing - share your experience with music therapy",
  "Practice routine that actually works - share your schedule",
  "Just released my first album independently - lessons learned",
  "Favorite music documentary recommendations?",
  "The line between inspiration and copying - ethics discussion",
  "Tips for teaching music to children with learning differences",
  "Studio monitors vs headphones for mixing - preferences?",
  "My band is going on tour! Check out our dates",
  "How to stay creatively inspired when you hit a wall",
  "Just upgraded my gear and it's changed everything!",
  "Thoughts on the latest Grammy nominations?"
];

// Función asincrónica para sembrar la base de datos
async function seedSocialNetwork() {
  console.log("Iniciando la siembra de la red social...");

  // Limpiar tablas existentes para evitar duplicados
  await db.delete(comments);
  await db.delete(posts);
  await db.delete(socialUsers);

  console.log("Tablas limpiadas. Creando usuarios...");

  // Crear usuarios
  const createdUserIds: { [key: string]: string } = {};

  for (const profile of userProfiles) {
    const newUser: NewSocialUser = {
      ...profile,
      interests: profile.interests
    };

    const [insertedUser] = await db.insert(socialUsers).values(newUser).returning({ id: socialUsers.id });
    
    if (insertedUser && insertedUser.id) {
      createdUserIds[profile.username] = insertedUser.id;
      console.log(`Usuario creado: ${profile.displayName}`);
    }
  }

  console.log("Usuarios creados. Creando publicaciones...");

  // Crear publicaciones aleatorias para cada usuario
  const createdPostIds: string[] = [];
  const userIds = Object.values(createdUserIds);

  for (let i = 0; i < postTopics.length; i++) {
    // Seleccionar un usuario aleatorio para cada publicación
    const randomUserIndex = Math.floor(Math.random() * userIds.length);
    const userId = userIds[randomUserIndex];
    
    // Obtener información del usuario para contextualizar el contenido
    const userInfo = userProfiles[randomUserIndex];
    
    // Generar contenido más detallado para la publicación utilizando OpenRouter
    const prompt = `You are a ${userInfo.displayName}, a ${userInfo.bio}. Write a social media post about: "${postTopics[i]}". The tone should be ${userInfo.personality}. Your interests are ${userInfo.interests.join(', ')}. Write the post in ${userInfo.language === 'es' ? 'Spanish' : 'English'}. Keep it under 280 characters.`;
    
    let postContent;
    try {
      postContent = await generateOpenRouterResponse(prompt);
    } catch (error) {
      postContent = postTopics[i]; // Fallback al tema original si la generación falla
      console.error("Error generating post content:", error);
    }

    const newPost: NewPost = {
      userId,
      content: postContent,
      likes: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 20),
    };

    const [insertedPost] = await db.insert(posts).values(newPost).returning({ id: posts.id });
    
    if (insertedPost && insertedPost.id) {
      createdPostIds.push(insertedPost.id);
      console.log(`Publicación creada para ${userInfo.displayName}`);
    }
  }

  console.log("Publicaciones creadas. Generando comentarios...");

  // Crear comentarios para cada publicación
  for (const postId of createdPostIds) {
    // Obtener información sobre la publicación para contextualizar los comentarios
    const [postInfo] = await db
      .select({
        id: posts.id,
        content: posts.content,
        userId: posts.userId
      })
      .from(posts)
      .where(eq(posts.id, postId));
    
    if (!postInfo) continue;
    
    // Encontrar el perfil del usuario que hizo la publicación
    const posterUserProfile = userProfiles.find(
      profile => createdUserIds[profile.username] === postInfo.userId
    );
    
    // Generar entre 1 y 5 comentarios por publicación
    const numComments = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < numComments; i++) {
      // Seleccionar un usuario aleatorio para comentar (diferente al autor del post)
      let commenterUserIndex;
      let commenterId;
      
      do {
        commenterUserIndex = Math.floor(Math.random() * userIds.length);
        commenterId = userIds[commenterUserIndex];
      } while (commenterId === postInfo.userId);
      
      const commenterProfile = userProfiles[commenterUserIndex];
      
      // Generar contenido del comentario con OpenRouter
      const prompt = `You are ${commenterProfile.displayName}, responding to this post: "${postInfo.content}". 
The post was made by ${posterUserProfile?.displayName || "another user"} who is ${posterUserProfile?.bio || "a music enthusiast"}.
Write a brief, engaging comment as a response. Your personality is ${commenterProfile.personality}. 
Your interests are ${commenterProfile.interests.join(', ')}. 
Write in ${commenterProfile.language === 'es' ? 'Spanish' : 'English'}. Keep it under 150 characters.`;
      
      let commentContent;
      try {
        commentContent = await generateOpenRouterResponse(prompt);
      } catch (error) {
        commentContent = "Great post! Really enjoyed reading this."; // Contenido genérico si falla la generación
        console.error("Error generating comment content:", error);
      }

      const newComment: NewComment = {
        postId,
        userId: commenterId,
        content: commentContent,
        likes: Math.floor(Math.random() * 10),
        isReply: false
      };

      const [insertedComment] = await db.insert(comments).values(newComment).returning({ id: comments.id });
      
      if (insertedComment && insertedComment.id) {
        console.log(`Comentario creado por ${commenterProfile.displayName}`);
        
        // Posibilidad de generar respuestas a este comentario
        if (Math.random() > 0.5) {
          // El autor original responde al comentario
          const replyPrompt = `You are ${posterUserProfile?.displayName}, responding to this comment: "${commentContent}" on your post about "${postInfo.content}".
Write a brief reply to the comment. Your personality is ${posterUserProfile?.personality}. 
Your interests are ${posterUserProfile?.interests.join(', ')}. 
Write in ${posterUserProfile?.language === 'es' ? 'Spanish' : 'English'}. Keep it under 100 characters.`;
          
          let replyContent;
          try {
            replyContent = await generateOpenRouterResponse(replyPrompt);
          } catch (error) {
            replyContent = "Thanks for your comment! Appreciate it.";
            console.error("Error generating reply content:", error);
          }

          const newReply: NewComment = {
            postId,
            userId: postInfo.userId,
            content: replyContent,
            likes: Math.floor(Math.random() * 5),
            isReply: true,
            parentId: insertedComment.id
          };

          await db.insert(comments).values(newReply);
          console.log(`Respuesta creada por ${posterUserProfile?.displayName}`);
        }
      }
    }
  }

  console.log("Proceso de siembra completado exitosamente!");
}

// Ejecutar la función de siembra
seedSocialNetwork()
  .catch(e => {
    console.error("Error durante la siembra de la red social:", e);
    process.exit(1);
  })
  .finally(() => {
    console.log("Script de siembra finalizado.");
  });