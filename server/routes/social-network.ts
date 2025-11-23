import { Router } from "express";
import { db } from "../db";
import { socialUsers, posts as socialPosts, comments, challenges, userBadges, collaborationSuggestions, challengeParticipants, directMessages, serviceRequests, serviceBids, revisionHistory, payments, artistWallets, payouts } from "../db/social-network-schema";
import { and, eq, desc, asc, like, or } from "drizzle-orm";
import { openRouterService } from "../services/openrouter-service";
import { stripe, calculatePaymentAmounts, createPaymentIntent, createConnectAccount, createAccountLink, createTransfer } from "../lib/stripe";

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
 * Sincronizar o crear un usuario de la red social (cuando se autentica)
 */
router.post("/users/sync", async (req, res) => {
  try {
    const { userId, displayName, avatar, bio = "", interests = [], language = "en" } = req.body;

    if (!userId || !displayName) {
      return res.status(400).json({ error: "userId and displayName are required" });
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    if (isNaN(userIdNum)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    // Buscar si el usuario ya existe
    const existingUsers = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, userIdNum));

    if (existingUsers.length > 0) {
      // Actualizar usuario existente
      const updated = await db
        .update(socialUsers)
        .set({
          displayName,
          avatar: avatar || existingUsers[0].avatar,
          bio: bio || existingUsers[0].bio,
          interests: interests.length > 0 ? interests : existingUsers[0].interests,
          language: language || existingUsers[0].language,
          updatedAt: new Date(),
        })
        .where(eq(socialUsers.id, userIdNum))
        .returning();

      console.log("✅ User updated:", updated[0].id);
      return res.json(updated[0]);
    }

    // Crear nuevo usuario
    const userData = {
      id: userIdNum,
      displayName,
      avatar: avatar || null,
      bio: bio || null,
      interests: interests.length > 0 ? interests : null,
      language: language || "en",
      isBot: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const created = await db.insert(socialUsers).values(userData as any).returning();
    console.log("✅ User created:", created[0].id);
    res.status(201).json(created[0]);
  } catch (error) {
    console.error("Error syncing social user:", error);
    res.status(500).json({ error: "Error syncing social user", details: String(error) });
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
 * Obtener posts de un artista específico
 */
router.get("/posts/artist/:artistId", async (req, res) => {
  try {
    const { artistId } = req.params;
    const artistIdNum = parseInt(artistId);

    if (isNaN(artistIdNum)) {
      return res.status(400).json({ error: "Invalid artist ID" });
    }

    // Buscar todos los posts del artista ordenados por fecha de creación (más recientes primero)
    const postsData = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.userId, artistIdNum))
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
    console.error("Error getting artist posts:", error);
    res.status(500).json({ error: "Error getting artist posts" });
  }
});

/**
 * Crear un nuevo post
 */
router.post("/posts", async (req, res) => {
  try {
    const { content, userId: bodyUserId } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    // Obtener el usuario ID del body o query
    const userIdParam = bodyUserId || req.query.userId;
    if (!userIdParam) {
      return res.status(400).json({ error: "userId is required" });
    }
    
    const userId = typeof userIdParam === 'string' ? parseInt(userIdParam) : userIdParam;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }
    
    // Verificar que el usuario existe
    const [existingUser] = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, userId));
    
    if (!existingUser) {
      console.log(`User with ID ${userId} not found in socialUsers table`);
      return res.status(404).json({ error: "User not found" });
    }
    
    // Crear el post
    const { mediaType, mediaData, whatsappUrl } = req.body;
    
    const postData = {
      userId,
      content,
      mediaType: mediaType || null,
      mediaData: mediaData || null,
      whatsappUrl: whatsappUrl || null,
      likes: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newPost] = await db.insert(socialPosts).values(postData as any).returning();
    
    // Obtener el usuario para incluirlo en la respuesta
    const [user] = await db
      .select()
      .from(socialUsers)
      .where(eq(socialUsers.id, newPost.userId));
    
    // Generar respuestas automatizadas de usuarios bot
    await generateBotResponses(newPost);
    
    console.log("✅ Post created successfully:", newPost.id);
    
    res.status(201).json({
      ...newPost,
      user,
      comments: []
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Error creating post", details: String(error) });
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
    const commentData = {
      postId: parseInt(id),
      userId: typeof userId === 'string' ? parseInt(userId) : userId,
      content,
      likes: 0,
      isReply,
      parentId: parentId ? parseInt(parentId) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [newComment] = await db.insert(comments).values(commentData as any).returning();
    
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
        bot.language || 'en'
      );
      
      // Crear el comentario
      const botCommentData = {
        postId: post.id,
        userId: bot.id,
        content: botResponse,
        likes: Math.floor(Math.random() * 3), // 0-2 likes aleatorios
        isReply: false,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(comments).values(botCommentData as any);
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
      postUser.language || 'en'
    );
    
    // Crear la respuesta
    const botReplyData = {
      postId: post.id,
      userId: postUser.id,
      content: botResponse,
      likes: Math.floor(Math.random() * 2), // 0-1 likes aleatorios
      isReply: true,
      parentId: comment.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(comments).values(botReplyData as any);
  } catch (error) {
    console.error("Error generating bot replies:", error);
  }
}

/**
 * Actualizar/Editar un post
 */
router.patch("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content, userId } = req.body;

    if (!content || !userId) {
      return res.status(400).json({ error: "Content and userId are required" });
    }

    // Verificar que el post existe y pertenece al usuario
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, parseInt(id)));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: "You can only edit your own posts" });
    }

    // Actualizar el post
    const [updatedPost] = await db
      .update(socialPosts)
      .set({
        content,
        updatedAt: new Date()
      })
      .where(eq(socialPosts.id, parseInt(id)))
      .returning();

    console.log("✅ Post updated:", updatedPost.id);
    res.json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Error updating post" });
  }
});

/**
 * Borrar un post
 */
router.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Verificar que el post existe y pertenece al usuario
    const [post] = await db
      .select()
      .from(socialPosts)
      .where(eq(socialPosts.id, parseInt(id)));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    // Borrar el post (los comentarios se borrarán en cascada)
    await db
      .delete(socialPosts)
      .where(eq(socialPosts.id, parseInt(id)));

    console.log("✅ Post deleted:", id);
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Error deleting post" });
  }
});

/**
 * Crear desafío/reto musical
 */
router.post("/challenges", async (req, res) => {
  try {
    const { creatorId, title, description, hashtag, content, mediaType, mediaData, endDate } = req.body;

    if (!creatorId || !title || !hashtag) {
      return res.status(400).json({ error: "creatorId, title, and hashtag are required" });
    }

    const [newChallenge] = await db.insert(challenges).values({
      creatorId: parseInt(creatorId),
      title,
      description: description || null,
      hashtag,
      content: content || null,
      mediaType: mediaType || null,
      mediaData: mediaData || null,
      participantCount: 0,
      endDate: endDate ? new Date(endDate) : null,
      createdAt: new Date(),
    }).returning();

    console.log("✅ Challenge created:", title);
    res.status(201).json(newChallenge);
  } catch (error) {
    console.error("Error creating challenge:", error);
    res.status(500).json({ error: "Error creating challenge" });
  }
});

/**
 * Obtener todos los desafíos
 */
router.get("/challenges", async (req, res) => {
  try {
    const allChallenges = await db.select().from(challenges).orderBy(desc(challenges.createdAt));
    
    const challengesWithCount = await Promise.all(
      allChallenges.map(async (challenge) => {
        const participants = await db.select().from(challengeParticipants).where(eq(challengeParticipants.challengeId, challenge.id));
        return {
          ...challenge,
          participantCount: participants.length,
        };
      })
    );
    
    res.json(challengesWithCount);
  } catch (error) {
    console.error("Error getting challenges:", error);
    res.status(500).json({ error: "Error getting challenges" });
  }
});

/**
 * Agregar badge a usuario
 */
router.post("/users/:id/badge", async (req, res) => {
  try {
    const { id } = req.params;
    const { badgeType, reason } = req.body;

    if (!badgeType) {
      return res.status(400).json({ error: "badgeType is required" });
    }

    const userId = parseInt(id);
    
    // Verificar si el usuario ya tiene este badge
    const existing = await db.select().from(userBadges).where(
      and(eq(userBadges.userId, userId), eq(userBadges.badgeType, badgeType))
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: "User already has this badge" });
    }

    const [newBadge] = await db.insert(userBadges).values({
      userId,
      badgeType,
      reason: reason || null,
      createdAt: new Date(),
    }).returning();

    console.log("✅ Badge added to user", id);
    res.status(201).json(newBadge);
  } catch (error) {
    console.error("Error adding badge:", error);
    res.status(500).json({ error: "Error adding badge" });
  }
});

/**
 * Obtener badges de usuario
 */
router.get("/users/:id/badges", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const badges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
    res.json(badges);
  } catch (error) {
    console.error("Error getting user badges:", error);
    res.status(500).json({ error: "Error getting user badges" });
  }
});

/**
 * Búsqueda avanzada de artistas
 */
router.get("/users/search", async (req, res) => {
  try {
    const { genre, location, keyword } = req.query;
    
    let users = await db.select().from(socialUsers);
    
    // Filter by keyword in displayName or bio
    if (keyword) {
      const searchTerm = (keyword as string).toLowerCase();
      users = users.filter(u => 
        u.displayName?.toLowerCase().includes(searchTerm) || 
        u.bio?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by genre
    if (genre) {
      users = users.filter(u => u.genre === genre);
    }
    
    // Filter by location
    if (location) {
      const searchTerm = (location as string).toLowerCase();
      users = users.filter(u => u.location?.toLowerCase().includes(searchTerm));
    }
    
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Error searching users" });
  }
});

/**
 * Obtener sugerencias de colaboración inteligentes
 */
router.get("/users/:id/collaboration-suggestions", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Obtener usuario actual
    const [currentUser] = await db.select().from(socialUsers).where(eq(socialUsers.id, userId));
    
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Obtener todos los otros usuarios
    const otherUsers = await db.select().from(socialUsers).where(eq(socialUsers.isBot, false));

    // Calcular compatibilidad basada en:
    // 1. Género musical (match exacto = más puntos)
    // 2. Intereses similares (overlap = puntos)
    // 3. Ubicación cercana (match = puntos)
    const suggestions = otherUsers
      .filter(u => u.id !== userId)
      .map(user => {
        let score = 0;
        let reasons = [];
        
        // Mismo género = alto score
        if (currentUser.genre && user.genre && currentUser.genre === user.genre) {
          score += 50;
          reasons.push(`Ambos hacen ${currentUser.genre}`);
        }
        
        // Intereses comunes
        const currentInterests = currentUser.interests || [];
        const userInterests = user.interests || [];
        const commonInterests = currentInterests.filter(i => userInterests.includes(i));
        if (commonInterests.length > 0) {
          score += commonInterests.length * 20;
          reasons.push(`Comparten interés en ${commonInterests.slice(0, 2).join(', ')}`);
        }
        
        // Ubicación
        if (currentUser.location && user.location && currentUser.location === user.location) {
          score += 15;
          reasons.push(`Mismo lugar: ${currentUser.location}`);
        }
        
        return {
          userId: user.id,
          user,
          compatibilityScore: Math.min(100, score),
          reason: reasons.join(" • "),
        };
      })
      .filter(s => s.compatibilityScore > 0)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 5);

    res.json(suggestions);
  } catch (error) {
    console.error("Error getting collaboration suggestions:", error);
    res.status(500).json({ error: "Error getting collaboration suggestions" });
  }
});

/**
 * Crear un nuevo mensaje directo
 */
router.post("/messages", async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ error: "senderId, receiverId, and content are required" });
    }

    const message = await db.insert(directMessages).values({
      senderId: parseInt(senderId),
      receiverId: parseInt(receiverId),
      content,
      isRead: false,
    }).returning();

    res.status(201).json(message[0]);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Error creating message" });
  }
});

/**
 * Obtener conversaciones de un usuario (últimos mensajes)
 */
router.get("/messages/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    // Obtener últimos mensajes donde es sender o receiver
    const messages = await db
      .select()
      .from(directMessages)
      .where(or(
        eq(directMessages.senderId, userIdNum),
        eq(directMessages.receiverId, userIdNum)
      ))
      .orderBy(desc(directMessages.createdAt));

    // Agrupar por conversación (con el otro usuario)
    const conversations: { [key: number]: typeof messages[0][] } = {};
    messages.forEach(msg => {
      const otherUserId = msg.senderId === userIdNum ? msg.receiverId : msg.senderId;
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = [];
      }
      conversations[otherUserId].push(msg);
    });

    // Obtener detalles del usuario para cada conversación
    const conversationList = await Promise.all(
      Object.entries(conversations).map(async ([otherUserId, msgs]) => {
        const [otherUser] = await db
          .select()
          .from(socialUsers)
          .where(eq(socialUsers.id, parseInt(otherUserId)));
        
        const unreadCount = msgs.filter(m => m.receiverId === userIdNum && !m.isRead).length;
        const lastMessage = msgs[0];

        return {
          userId: parseInt(otherUserId),
          user: otherUser,
          lastMessage,
          unreadCount,
          messageCount: msgs.length,
        };
      })
    );

    res.json(conversationList);
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({ error: "Error getting conversations" });
  }
});

/**
 * Obtener mensajes entre dos usuarios
 */
router.get("/messages/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const userIdNum = parseInt(userId);
    const otherUserIdNum = parseInt(otherUserId);

    const messages = await db
      .select()
      .from(directMessages)
      .where(or(
        and(
          eq(directMessages.senderId, userIdNum),
          eq(directMessages.receiverId, otherUserIdNum)
        ),
        and(
          eq(directMessages.senderId, otherUserIdNum),
          eq(directMessages.receiverId, userIdNum)
        )
      ))
      .orderBy(asc(directMessages.createdAt));

    res.json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ error: "Error getting messages" });
  }
});

/**
 * Marcar mensajes como leídos
 */
router.put("/messages/:userId/read", async (req, res) => {
  try {
    const { userId } = req.params;
    const { otherUserId } = req.body;
    const userIdNum = parseInt(userId);
    const otherUserIdNum = parseInt(otherUserId);

    // Marcar como leído todos los mensajes recibidos de otherUserId
    const updated = await db
      .update(directMessages)
      .set({ isRead: true })
      .where(and(
        eq(directMessages.senderId, otherUserIdNum),
        eq(directMessages.receiverId, userIdNum),
        eq(directMessages.isRead, false)
      ))
      .returning();

    res.json({ updatedCount: updated.length });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Error marking messages as read" });
  }
});

/**
 * Crear una nueva solicitud de servicio
 */
router.post("/service-requests", async (req, res) => {
  try {
    const { clientId, title, description, serviceType, budget, deadline, revisionLimit = 3 } = req.body;
    
    if (!clientId || !title || !description || !serviceType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const request = await db.insert(serviceRequests).values({
      clientId: parseInt(clientId),
      title,
      description,
      serviceType,
      budget: budget || null,
      deadline: deadline ? new Date(deadline) : null,
      revisionLimit,
      status: "open",
    }).returning();

    res.status(201).json(request[0]);
  } catch (error) {
    console.error("Error creating service request:", error);
    res.status(500).json({ error: "Error creating service request" });
  }
});

/**
 * Obtener solicitudes de servicios
 */
router.get("/service-requests", async (req, res) => {
  try {
    const { status = "open", serviceType } = req.query;
    
    let query = db.select().from(serviceRequests);
    
    if (status && status !== "all") {
      query = query.where(eq(serviceRequests.status, String(status)));
    }
    
    if (serviceType) {
      query = query.where(eq(serviceRequests.serviceType, String(serviceType)));
    }

    const requests = await query.orderBy(desc(serviceRequests.createdAt));
    
    // Obtener detalles del cliente para cada solicitud
    const requestsWithDetails = await Promise.all(
      requests.map(async (req) => {
        const [client] = await db
          .select()
          .from(socialUsers)
          .where(eq(socialUsers.id, req.clientId));
        
        // Obtener bids para esta solicitud
        const bidsList = await db
          .select()
          .from(serviceBids)
          .where(eq(serviceBids.requestId, req.id));

        return {
          ...req,
          client,
          bidsCount: bidsList.length,
        };
      })
    );

    res.json(requestsWithDetails);
  } catch (error) {
    console.error("Error getting service requests:", error);
    res.status(500).json({ error: "Error getting service requests" });
  }
});

/**
 * Obtener una solicitud específica con sus bids
 */
router.get("/service-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [request] = await db
      .select()
      .from(serviceRequests)
      .where(eq(serviceRequests.id, parseInt(id)));
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Obtener cliente
    const [client] = await db.select().from(socialUsers).where(eq(socialUsers.id, request.clientId));

    // Obtener bids con detalles del músico
    const bidsList = await db.select().from(serviceBids).where(eq(serviceBids.requestId, request.id));
    
    const bidsWithDetails = await Promise.all(
      bidsList.map(async (bid) => {
        const [musician] = await db.select().from(socialUsers).where(eq(socialUsers.id, bid.musicianId));
        return { ...bid, musician };
      })
    );

    res.json({
      ...request,
      client,
      bids: bidsWithDetails,
    });
  } catch (error) {
    console.error("Error getting service request:", error);
    res.status(500).json({ error: "Error getting service request" });
  }
});

/**
 * Crear un bid/oferta para una solicitud
 */
router.post("/service-bids", async (req, res) => {
  try {
    const { requestId, musicianId, bidPrice, deliveryDays, description, revisionIncluded = 3 } = req.body;
    
    if (!requestId || !musicianId || !bidPrice || !deliveryDays) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bid = await db.insert(serviceBids).values({
      requestId: parseInt(requestId),
      musicianId: parseInt(musicianId),
      bidPrice,
      deliveryDays: parseInt(deliveryDays),
      description: description || null,
      revisionIncluded,
      status: "pending",
    }).returning();

    res.status(201).json(bid[0]);
  } catch (error) {
    console.error("Error creating bid:", error);
    res.status(500).json({ error: "Error creating bid" });
  }
});

/**
 * Aceptar un bid
 */
router.put("/service-bids/:bidId/accept", async (req, res) => {
  try {
    const { bidId } = req.params;
    const bidIdNum = parseInt(bidId);

    // Obtener el bid
    const [bid] = await db.select().from(serviceBids).where(eq(serviceBids.id, bidIdNum));
    
    if (!bid) {
      return res.status(404).json({ error: "Bid not found" });
    }

    // Actualizar el bid a aceptado
    const updatedBid = await db
      .update(serviceBids)
      .set({ status: "accepted" })
      .where(eq(serviceBids.id, bidIdNum))
      .returning();

    // Actualizar la solicitud
    await db
      .update(serviceRequests)
      .set({ status: "accepted", acceptedBidId: bidIdNum })
      .where(eq(serviceRequests.id, bid.requestId));

    // Rechazar los otros bids
    await db
      .update(serviceBids)
      .set({ status: "rejected" })
      .where(and(
        eq(serviceBids.requestId, bid.requestId),
        eq(serviceBids.id, bidIdNum) as any
      ));

    res.json(updatedBid[0]);
  } catch (error) {
    console.error("Error accepting bid:", error);
    res.status(500).json({ error: "Error accepting bid" });
  }
});

/**
 * Solicitar una revisión
 */
router.post("/revisions", async (req, res) => {
  try {
    const { bidId, requestId, notes, requestedBy } = req.body;
    
    if (!bidId || !requestId || !requestedBy) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Obtener el bid para contar revisiones
    const [bid] = await db.select().from(serviceBids).where(eq(serviceBids.id, parseInt(bidId)));
    
    if (!bid) {
      return res.status(404).json({ error: "Bid not found" });
    }

    // Obtener solicitud para revisar límite
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, parseInt(requestId)));
    
    // Obtener revisiones existentes
    const existingRevisions = await db
      .select()
      .from(revisionHistory)
      .where(eq(revisionHistory.bidId, parseInt(bidId)));

    if (existingRevisions.length >= request.revisionLimit) {
      return res.status(400).json({ error: "Revision limit exceeded" });
    }

    // Crear nueva revisión
    const revision = await db.insert(revisionHistory).values({
      bidId: parseInt(bidId),
      requestId: parseInt(requestId),
      revisionNumber: existingRevisions.length + 1,
      notes: notes || null,
      requestedBy: parseInt(requestedBy),
    }).returning();

    res.status(201).json({
      ...revision[0],
      revisionsRemaining: request.revisionLimit - (existingRevisions.length + 1),
    });
  } catch (error) {
    console.error("Error creating revision:", error);
    res.status(500).json({ error: "Error creating revision" });
  }
});

/**
 * Obtener revisiones de un bid
 */
router.get("/revisions/:bidId", async (req, res) => {
  try {
    const { bidId } = req.params;

    const revisions = await db
      .select()
      .from(revisionHistory)
      .where(eq(revisionHistory.bidId, parseInt(bidId)))
      .orderBy(asc(revisionHistory.revisionNumber));

    res.json(revisions);
  } catch (error) {
    console.error("Error getting revisions:", error);
    res.status(500).json({ error: "Error getting revisions" });
  }
});

// ===== PAYMENT ROUTES =====

/**
 * Create payment intent for accepting a bid
 */
router.post("/payments/create", async (req, res) => {
  try {
    const { bidId, amount, email, description } = req.body;

    if (!bidId || !amount || !email) {
      return res.status(400).json({ error: "bidId, amount, and email are required" });
    }

    // Get bid info
    const [bid] = await db.select().from(serviceBids).where(eq(serviceBids.id, parseInt(bidId)));
    if (!bid) {
      return res.status(404).json({ error: "Bid not found" });
    }

    // Calculate amounts
    const { artistAmount, platformAmount } = calculatePaymentAmounts(amount);

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(amount, description, email);

    // Create payment record
    const paymentRecord = await db.insert(payments).values({
      bidId: parseInt(bidId),
      clientId: parseInt(req.body.clientId) || 0,
      musicianId: bid.musicianId,
      amount,
      artistAmount,
      platformAmount,
      stripePaymentIntentId: paymentIntent.id,
      description: description || `Payment for service bid #${bidId}`,
      status: "pending",
    }).returning();

    res.json({
      paymentId: paymentRecord[0].id,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Error creating payment" });
  }
});

/**
 * Confirm payment and update wallet
 */
router.post("/payments/confirm", async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: "paymentIntentId is required" });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment not succeeded" });
    }

    // Get payment record
    const [paymentRecord] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentIntentId, paymentIntentId));

    if (!paymentRecord) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    // Update payment status
    await db.update(payments).set({ status: "completed" }).where(eq(payments.id, paymentRecord.id));

    // Get or create artist wallet
    let [wallet] = await db.select().from(artistWallets).where(eq(artistWallets.musicianId, paymentRecord.musicianId));

    if (!wallet) {
      const created = await db.insert(artistWallets).values({
        musicianId: paymentRecord.musicianId,
        balance: paymentRecord.artistAmount,
        totalEarned: paymentRecord.artistAmount,
      }).returning();
      wallet = created[0];
    } else {
      // Update wallet balance
      await db.update(artistWallets)
        .set({
          balance: wallet.balance + paymentRecord.artistAmount,
          totalEarned: wallet.totalEarned + paymentRecord.artistAmount,
        })
        .where(eq(artistWallets.id, wallet.id));
    }

    // Update bid status to accepted
    await db.update(serviceBids).set({ status: "accepted" }).where(eq(serviceBids.id, paymentRecord.bidId));

    // Update service request status
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, req.body.requestId || 0));
    if (request) {
      await db.update(serviceRequests)
        .set({ status: "accepted", acceptedBidId: paymentRecord.bidId })
        .where(eq(serviceRequests.id, request.id));
    }

    res.json({ success: true, message: "Payment confirmed" });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ error: "Error confirming payment" });
  }
});

/**
 * Get artist wallet data
 */
router.get("/wallet/:musicianId", async (req, res) => {
  try {
    const { musicianId } = req.params;

    let [wallet] = await db.select().from(artistWallets).where(eq(artistWallets.musicianId, parseInt(musicianId)));

    if (!wallet) {
      // Create default wallet
      const created = await db.insert(artistWallets).values({
        musicianId: parseInt(musicianId),
        balance: 0,
        totalEarned: 0,
        totalPaidOut: 0,
      }).returning();
      wallet = created[0];
    }

    res.json(wallet);
  } catch (error) {
    console.error("Error getting wallet:", error);
    res.status(500).json({ error: "Error getting wallet" });
  }
});

/**
 * Connect Stripe account for artist
 */
router.post("/connect-account", async (req, res) => {
  try {
    const { musicianId } = req.body;

    if (!musicianId) {
      return res.status(400).json({ error: "musicianId is required" });
    }

    // Get musician info
    const [musician] = await db.select().from(socialUsers).where(eq(socialUsers.id, parseInt(musicianId)));

    if (!musician) {
      return res.status(404).json({ error: "Musician not found" });
    }

    // Get or create wallet
    let [wallet] = await db.select().from(artistWallets).where(eq(artistWallets.musicianId, parseInt(musicianId)));

    if (!wallet) {
      const created = await db.insert(artistWallets).values({
        musicianId: parseInt(musicianId),
      }).returning();
      wallet = created[0];
    }

    // If already has Stripe Connect ID, create account link
    if (wallet.stripeConnectId) {
      const accountLink = await createAccountLink(wallet.stripeConnectId, `${process.env.APP_URL || "http://localhost:5000"}/profile`);
      return res.json({ accountLink: accountLink.url });
    }

    // Create Stripe Express account
    const account = await createConnectAccount(musician.displayName, musician.displayName);

    // Update wallet with Stripe account ID
    await db.update(artistWallets)
      .set({ stripeConnectId: account.id })
      .where(eq(artistWallets.id, wallet.id));

    // Create account link
    const accountLink = await createAccountLink(account.id, `${process.env.APP_URL || "http://localhost:5000"}/profile`);

    res.json({ accountLink: accountLink.url });
  } catch (error) {
    console.error("Error connecting Stripe account:", error);
    res.status(500).json({ error: "Error connecting Stripe account" });
  }
});

/**
 * Request payout
 */
router.post("/payout-request", async (req, res) => {
  try {
    const { musicianId, amount } = req.body;

    if (!musicianId || !amount) {
      return res.status(400).json({ error: "musicianId and amount are required" });
    }

    // Get wallet
    const [wallet] = await db.select().from(artistWallets).where(eq(artistWallets.musicianId, parseInt(musicianId)));

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    if (!wallet.stripeConnectId) {
      return res.status(400).json({ error: "Stripe account not connected" });
    }

    // Create payout request
    const payout = await db.insert(payouts).values({
      musicianId: parseInt(musicianId),
      amount,
      status: "pending",
    }).returning();

    // Deduct from balance
    await db.update(artistWallets)
      .set({ balance: wallet.balance - amount })
      .where(eq(artistWallets.id, wallet.id));

    res.status(201).json(payout[0]);
  } catch (error) {
    console.error("Error requesting payout:", error);
    res.status(500).json({ error: "Error requesting payout" });
  }
});

/**
 * Process payout (admin only - should be in background job)
 */
router.post("/process-payout/:payoutId", async (req, res) => {
  try {
    const { payoutId } = req.params;

    // Get payout
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, parseInt(payoutId)));

    if (!payout) {
      return res.status(404).json({ error: "Payout not found" });
    }

    if (payout.status !== "pending") {
      return res.status(400).json({ error: "Payout already processed" });
    }

    // Get wallet
    const [wallet] = await db.select().from(artistWallets).where(eq(artistWallets.musicianId, payout.musicianId));

    if (!wallet || !wallet.stripeConnectId) {
      return res.status(400).json({ error: "Wallet or Stripe account not found" });
    }

    try {
      // Create transfer to artist
      const transfer = await createTransfer(payout.amount, wallet.stripeConnectId, `Payout for services`);

      // Update payout
      await db.update(payouts)
        .set({
          status: "completed",
          stripeTransferId: transfer.id,
          processedAt: new Date(),
        })
        .where(eq(payouts.id, payout.id));

      // Update wallet
      await db.update(artistWallets)
        .set({ totalPaidOut: wallet.totalPaidOut + payout.amount })
        .where(eq(artistWallets.id, wallet.id));

      res.json({ success: true, transfer: transfer.id });
    } catch (error: any) {
      // Update payout with failure reason
      await db.update(payouts)
        .set({
          status: "failed",
          failureReason: error.message,
          processedAt: new Date(),
        })
        .where(eq(payouts.id, payout.id));

      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    console.error("Error processing payout:", error);
    res.status(500).json({ error: "Error processing payout" });
  }
});

export default router;
