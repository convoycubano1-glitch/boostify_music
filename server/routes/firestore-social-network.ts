import { Router } from "express";
import { firestoreSocialNetworkService } from "../services/firestore-social-network";
import { openRouterService } from "../services/openrouter-service";

const router = Router();

/**
 * Obtener todos los usuarios de la red social
 */
router.get("/users", async (req, res) => {
  try {
    const users = await firestoreSocialNetworkService.getAllUsers();
    res.json(users);
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
    const user = await firestoreSocialNetworkService.getUserById(id);
    
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
    const postsWithDetails = await firestoreSocialNetworkService.getPostsWithDetails();
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
    const userId = req.query.userId || req.body.userId || "1"; // Default to user ID 1
    
    // Crear el post
    const postData = {
      userId: userId as string,
      content,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newPost = await firestoreSocialNetworkService.createPost(postData);
    
    // Obtener el usuario para incluirlo en la respuesta
    const user = await firestoreSocialNetworkService.getUserById(newPost.userId);
    
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
    // Obtener el usuario actual
    // Nota: En un sistema real, obtendríamos el usuario de la sesión
    const userId = req.query.userId || req.body.userId || "1"; // Default to user ID 1
    
    const updatedPost = await firestoreSocialNetworkService.incrementPostLikes(id, userId as string);
    
    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    res.json(updatedPost);
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ error: "Error liking post" });
  }
});

/**
 * Guardar un post para ver más tarde
 */
router.post("/posts/:id/save", async (req, res) => {
  try {
    const { id } = req.params;
    // Obtener el usuario actual
    const userId = req.query.userId || req.body.userId || "1"; // Default to user ID 1
    
    const success = await firestoreSocialNetworkService.savePost(id, userId as string);
    
    if (!success) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    res.json({ success: true, message: "Post saved successfully" });
  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ error: "Error saving post" });
  }
});

/**
 * Obtener los posts guardados por el usuario
 */
router.get("/user/saved-posts", async (req, res) => {
  try {
    // Obtener el usuario actual
    const userId = req.query.userId || "1"; // Default to user ID 1
    
    const savedPosts = await firestoreSocialNetworkService.getSavedPosts(userId as string);
    
    res.json(savedPosts);
  } catch (error) {
    console.error("Error getting saved posts:", error);
    res.status(500).json({ error: "Error getting saved posts" });
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
    const post = await firestoreSocialNetworkService.getPostById(id);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Obtener el usuario actual
    // Nota: En un sistema real, obtendríamos el usuario de la sesión
    const userId = req.query.userId || req.body.userId || "1"; // Default to user ID 1
    
    // Crear el comentario
    const commentData = {
      postId: id,
      userId: userId as string,
      content,
      likes: 0,
      isReply,
      parentId: parentId ? parentId as string : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newComment = await firestoreSocialNetworkService.createComment(commentData);
    
    // Obtener el usuario para incluirlo en la respuesta
    const user = await firestoreSocialNetworkService.getUserById(newComment.userId);
    
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
    const botUsers = await firestoreSocialNetworkService.getBotUsers();
    
    // Elegir aleatoriamente 1-2 bots para responder
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
        bot.language || 'en'
      );
      
      // Crear el comentario
      const botCommentData = {
        postId: post.id,
        userId: bot.id as string,
        content: botResponse,
        likes: Math.floor(Math.random() * 3), // 0-2 likes aleatorios
        isReply: false,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await firestoreSocialNetworkService.createComment(botCommentData);
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
    const postUser = await firestoreSocialNetworkService.getUserById(post.userId);
    
    // Si el autor del post no es un bot O con una probabilidad del 70%, no responder
    if (!postUser?.isBot || Math.random() > 0.3) {
      return;
    }
    
    // Generar un tiempo de respuesta aleatorio (entre 1 y 8 segundos)
    const replyDelay = Math.floor(Math.random() * 7000) + 1000;
    
    // Esperar un tiempo aleatorio antes de responder (simulación de tiempo real)
    await new Promise(resolve => setTimeout(resolve, replyDelay));
    
    // Obtener el usuario que hizo el comentario
    const commentUser = await firestoreSocialNetworkService.getUserById(comment.userId);
    
    // Personalidad del bot e intereses
    const personality = postUser.personality || 'friendly and engaging';
    const interests = postUser.interests || ['music', 'social media'];
    
    // Generar el prompt para OpenRouter
    const prompt = `You are a social media user with the following personality: ${personality}. 
      You're interested in: ${interests.join(', ')}.
      You made a post saying: "${post.content}"
      Someone commented: "${comment.content}"
      Please respond to their comment with a brief, ${postUser.language === 'es' ? 'Spanish' : 'English'} reply (maximum 2 sentences).`;
    
    const botResponse = await openRouterService.generateResponse(
      prompt, 
      undefined, 
      postUser.language || 'en'
    );
    
    // Crear la respuesta
    const replyData = {
      userId: postUser.id as string,
      postId: post.id,
      parentId: comment.id,
      content: botResponse,
      likes: Math.floor(Math.random() * 3),
      isReply: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await firestoreSocialNetworkService.createComment(replyData);
  } catch (error) {
    console.error("Error generating bot replies:", error);
  }
}

export default router;