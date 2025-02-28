/**
 * Este script elimina todos los posts y comentarios existentes
 * y crea nuevos con contenido significativo en inglés relacionado con música.
 */

import { db } from '../server/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { firestoreSocialNetworkService } from '../server/services/firestore-social-network';

// Contenido musical de alta calidad en inglés para los posts
const englishMusicPosts = [
  "Just finished recording a new track! The mixing process took longer than expected, but the final result sounds incredible. Can't wait to share it with all of you next week.",
  
  "What studio monitors are you all using? I'm considering upgrading my current setup and would love some recommendations based on experience.",
  
  "Attended a workshop on music production techniques yesterday. Learning about parallel compression was a game-changer for my drum tracks. Anyone else use this technique?",
  
  "The transition from traditional music distribution to streaming has completely changed how we release music. As an independent artist, I find that releasing singles more frequently works better than albums.",
  
  "Been experimenting with unusual time signatures lately. 7/8 feels surprisingly natural once you get into it. What's your favorite non-4/4 song?",
  
  "Question for the songwriters here: do you start with lyrics, melody, or chord progression? I've always been a chord-first person, but trying to switch up my process.",
  
  "Just discovered this amazing VST plugin that simulates vintage analog synths perfectly. The sound is incredibly warm and authentic. I'll share the name if anyone's interested.",
  
  "Music collaboration has become so much easier with modern technology. Currently working on a track with a vocalist from Australia while I'm based in Canada. The internet is amazing!",
  
  "Thoughts on AI in music production? I've tried some AI mastering services and was surprised by the quality. I still prefer human mastering for important releases though.",
  
  "After years of producing electronic music, I've started to incorporate more live instruments into my tracks. The organic textures add so much depth and emotion."
];

// Contenido musical de alta calidad en inglés para los comentarios
const englishMusicComments = [
  "I completely agree! Your insights on music production are spot on.",
  
  "This is such a great point. I've been thinking about this a lot lately with my own music.",
  
  "Have you tried experimenting with different DAWs? I switched to Ableton last year and it changed my workflow completely.",
  
  "The melody in your latest track is absolutely incredible. Mind sharing some of your composition process?",
  
  "I've been struggling with this exact issue! Thanks for sharing your experience.",
  
  "This reminds me of a technique I learned at a production workshop last month. Total game-changer.",
  
  "What VST plugins are you using these days? Always looking for recommendations!",
  
  "Your approach to music marketing is so refreshing compared to what I usually see.",
  
  "I'd love to collaborate on something. Your style would complement my production perfectly.",
  
  "Do you have any tips for someone just starting out with music production? Your work is inspiring."
];

async function deleteAllPostsAndComments() {
  console.log("🚮 Eliminando todos los posts y comentarios existentes...");
  
  // Eliminar todos los comentarios primero
  const commentsSnapshot = await db.collection('social_comments').get();
  const commentDeletions = commentsSnapshot.docs.map(doc => 
    db.collection('social_comments').doc(doc.id).delete()
  );
  
  await Promise.all(commentDeletions);
  console.log(`Eliminados ${commentsSnapshot.size} comentarios.`);
  
  // Luego eliminar todos los posts
  const postsSnapshot = await db.collection('social_posts').get();
  const postDeletions = postsSnapshot.docs.map(doc => 
    db.collection('social_posts').doc(doc.id).delete()
  );
  
  await Promise.all(postDeletions);
  console.log(`Eliminados ${postsSnapshot.size} posts.`);
}

async function createNewPostsAndComments() {
  console.log("🆕 Creando nuevos posts con contenido de calidad en inglés...");
  
  // Obtener todos los usuarios
  const usersSnapshot = await db.collection('social_users').get();
  const users = usersSnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
  
  // Filtrar solo usuarios humanos (no bots) para posts principales
  const humanUsers = users.filter(user => !user.isBot);
  
  // Filtrar usuarios bot para comentarios
  const botUsers = users.filter(user => user.isBot);
  
  // Crear posts
  const createdPosts = [];
  
  for (let i = 0; i < 10; i++) {
    // Seleccionar un usuario humano aleatorio para cada post
    const userIndex = Math.floor(Math.random() * humanUsers.length);
    const user = humanUsers[userIndex];
    
    const postData = {
      userId: user.id,
      content: englishMusicPosts[i % englishMusicPosts.length],
      likes: Math.floor(Math.random() * 10),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newPost = await firestoreSocialNetworkService.createPost(postData);
    console.log(`Creado nuevo post por ${user.displayName} (ID: ${newPost.id})`);
    createdPosts.push(newPost);
  }
  
  console.log(`✅ Creados ${createdPosts.length} nuevos posts!`);
  
  // Crear comentarios para cada post
  console.log("💬 Creando comentarios en inglés con contenido significativo...");
  
  for (const post of createdPosts) {
    // Crear 1-3 comentarios por post
    const numComments = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numComments; i++) {
      // Seleccionar un usuario bot aleatorio para cada comentario
      const botIndex = Math.floor(Math.random() * botUsers.length);
      const bot = botUsers[botIndex];
      
      const commentData = {
        userId: bot.id,
        postId: post.id,
        content: englishMusicComments[i % englishMusicComments.length],
        likes: Math.floor(Math.random() * 5),
        isReply: false,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const newComment = await firestoreSocialNetworkService.createComment(commentData);
      console.log(`Creado nuevo comentario por ${bot.displayName} en el post ${post.id}`);
    }
  }
  
  console.log("✅ Proceso completado! Los posts y comentarios han sido recreados con contenido de calidad.");
}

// Ejecutar el script
async function main() {
  try {
    await deleteAllPostsAndComments();
    await createNewPostsAndComments();
    console.log("✅ Script finalizado correctamente.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al ejecutar el script:", error);
    process.exit(1);
  }
}

main();