import { Router } from "express";
import { db } from "../db";
import { socialUsers, posts as socialPosts, comments } from "../db/schema";
import { and, eq, desc, asc } from "drizzle-orm";
import { openRouterService } from "../services/openrouter-service";

const router = Router();

/**
 * Obtener todos los usuarios de la red social
 */
router.get("/users", async (req, res) => {
  try {
    const socialUsersList = await db.select().from(socialUsers);
    res.json(socialUsersList);
  } catch (error) {
    console.error("Error getting social users:", error);
    res.status(500).json({ error: "Error getting social users" });
  }
});

/**
 * Obtener un usuario específico de la red social
 */
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [user] = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, parseInt(id)));
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error getting social user:", error);
    res.status(500).json({ error: "Error getting social user" });
  }
});

/**
 * Obtener todos los posts con sus usuarios y comentarios
 */
router.get("/posts", async (req, res) => {
  try {
    // Buscar todos los posts ordenados por fecha de creación (más recientes primero)
    const postsData = await db
      .select()
      .from(socialPosts)
      .orderBy(desc(socialPosts.createdAt));
    
    // Recolectar todos los posts con usuarios y comentarios
    const postsWithDetails = await Promise.all(
      postsData.map(async (post) => {
        // Obtener el usuario que creó el post
        const [postUser] = await db
          .select()
          .from(socialUsers)
          .where(eq(socialUsers.id, post.userId));
        
        // Obtener los comentarios para este post
        const postComments = await db
          .select()
          .from(comments)
          .where(eq(comments.postId, post.id))
          .orderBy(asc(comments.createdAt));
        
        // Recolectar información detallada para cada comentario
        const commentsWithUsers = await Promise.all(
          postComments.map(async (comment) => {
            // Obtener el usuario que hizo el comentario
            const [commentUser] = await db
              .select()
              .from(socialUsers)
              .where(eq(socialUsers.id, comment.userId));
            
            return {
              ...comment,
              user: commentUser
            };
          })
        );
        
        // Determinar si el usuario actual dio like al post
        // Nota: aquí implementaríamos la lógica para determinar si el usuario ha dado like
        // Por ahora simplemente es aleatorio
        const isLiked = Math.random() > 0.5;
        
        return {
          ...post,
          user: postUser,
          comments: commentsWithUsers,
          isLiked
        };
      })
    );
    
    res.json(postsWithDetails);
  } catch (error) {
    console.error("Error getting posts:", error);
    res.status(500).json({ error: "Error getting posts" });
  }
});

/**
 * Crear un nuevo post
 */
router.post("/posts", async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    // Obtener el usuario actual
    // Nota: En un sistema real, obtendríamos el usuario de la sesión
    // Por ahora, simplemente usamos un ID de usuario fijo
    const userId = req.query.userId || req.body.userId || 1; // Default to user ID 1
    
    // Crear el post
    const [newPost] = await db.insert(socialPosts).values({
      userId: typeof userId === 'string' ? parseInt(userId) : userId,
      content,
      likes: 0
    }).returning();
    
    // Obtener el usuario para incluirlo en la respuesta
    const [user] = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, newPost.userId));
    
    // Generar respuestas automatizadas de usuarios bot
    await generateBotResponses(newPost);
    
    res.status(201).json({
      ...newPost,
      user,
      comments: []
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Error creating post" });
  }
});

/**
 * Dar like a un post
 */
router.post("/posts/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener el post actual
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, parseInt(id)));
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Incrementar los likes
    // Nota: En un sistema real, verificaríamos si el usuario ya dio like
    const likes = (post.likes || 0) + 1;
    
    // Actualizar el post
    const [updatedPost] = await db
      .update(socialPosts)
      .set({ likes })
      .where(eq(socialPosts.id, parseInt(id)))
      .returning();
    
    res.json(updatedPost);
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ error: "Error liking post" });
  }
});

/**
 * Crear un comentario en un post
 */
router.post("/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, isReply = false, parentId = null } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    // Verificar si el post existe
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, parseInt(id)));
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Obtener el usuario actual
    // Nota: En un sistema real, obtendríamos el usuario de la sesión
    const userId = req.query.userId || req.body.userId || 1; // Default to user ID 1
    
    // Crear el comentario
    const [newComment] = await db.insert(comments).values({
      postId: parseInt(id),
      userId: typeof userId === 'string' ? parseInt(userId) : userId,
      content,
      likes: 0,
      isReply,
      parentId: parentId ? parseInt(parentId) : null
    }).returning();
    
    // Obtener el usuario para incluirlo en la respuesta
    const [user] = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, newComment.userId));
    
    // Generar respuestas automatizadas de usuarios bot a este comentario
    await generateBotReplies(post, newComment);
    
    res.status(201).json({
      ...newComment,
      user
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Error creating comment" });
  }
});

/**
 * Función para generar respuestas de bots (usuarios IA) a un post
 * @param post El post al que responder
 */
async function generateBotResponses(post: any) {
  try {
    // Obtener todos los usuarios bot
    const botUsers = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.isBot, true));
    
    // Eligir aleatoriamente 1-2 bots para responder
    const numResponders = Math.floor(Math.random() * 2) + 1;
    const responders = botUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, numResponders);
    
    // Para cada bot, generar una respuesta
    for (const bot of responders) {
      // Generar un tiempo de respuesta aleatorio (entre 0.5 y 4 segundos)
      const replyDelay = Math.floor(Math.random() * 3500) + 500;
      
      // Esperar un tiempo aleatorio antes de responder (simulación de tiempo real)
      await new Promise(resolve => setTimeout(resolve, replyDelay));
      
      // Personalidad del bot e intereses
      const personality = bot.personality || 'friendly and engaging';
      const interests = bot.interests || ['music', 'social media'];
      
      // Generar el prompt para OpenRouter
      const prompt = `You are a social media user with the following personality: ${personality}. 
        You're interested in: ${interests.join(', ')}.
        Please write a short, conversational comment in ${bot.language === 'es' ? 'Spanish' : 'English'} 
        (max 2 sentences) responding to this social media post: "${post.content}"`;
      
      // Obtener respuesta de OpenRouter
      const botResponse = await openRouterService.generateResponse(
        prompt, 
        undefined, 
        bot.language
      );
      
      // Crear el comentario
      await db.insert(comments).values({
        postId: post.id,
        userId: bot.id,
        content: botResponse,
        likes: Math.floor(Math.random() * 3), // 0-2 likes aleatorios
        isReply: false,
        parentId: null
      });
    }
  } catch (error) {
    console.error("Error generating bot responses:", error);
  }
}

/**
 * Función para generar respuestas de bots a un comentario
 * @param post El post original
 * @param comment El comentario al que responder
 */
async function generateBotReplies(post: any, comment: any) {
  try {
    // Verificar si el usuario del post es un bot (solo los bots responden a comentarios)
    const [postUser] = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, post.userId));
    
    // Si el autor del post no es un bot O con una probabilidad del 70%, no responder
    if (!postUser?.isBot || Math.random() > 0.3) {
      return;
    }
    
    // Generar un tiempo de respuesta aleatorio (entre 1 y 8 segundos)
    const replyDelay = Math.floor(Math.random() * 7000) + 1000;
    
    // Esperar un tiempo aleatorio antes de responder (simulación de tiempo real)
    await new Promise(resolve => setTimeout(resolve, replyDelay));
    
    // Obtener el usuario que hizo el comentario
    const [commentUser] = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, comment.userId));
    
    // Personalidad del bot e intereses
    const personality = postUser.personality || 'friendly and engaging';
    const interests = postUser.interests || ['music', 'social media'];
    
    // Generar el prompt para OpenRouter
    const prompt = `You are a social media user with the following personality: ${personality}. 
      You're interested in: ${interests.join(', ')}.
      You made a post saying: "${post.content}"
      Someone commented: "${comment.content}"
      Please write a brief reply in ${postUser.language === 'es' ? 'Spanish' : 'English'} (1-2 sentences) to this comment.`;
    
    // Obtener respuesta de OpenRouter
    const botResponse = await openRouterService.generateResponse(
      prompt, 
      undefined, 
      postUser.language
    );
    
    // Crear la respuesta
    await db.insert(comments).values({
      postId: post.id,
      userId: postUser.id,
      content: botResponse,
      likes: Math.floor(Math.random() * 2), // 0-1 likes aleatorios
      isReply: true,
      parentId: comment.id
    });
  } catch (error) {
    console.error("Error generating bot replies:", error);
  }
}

export default router;