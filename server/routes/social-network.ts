import { Express, Request, Response } from "express";
import { eq, desc, and, or, isNull } from "drizzle-orm";
import { db } from "../../db";
import { socialUsers, posts, comments } from "../../db/schema";
import { openRouterService } from "../services/openrouter-service";
import { randomInt } from "crypto";

/**
 * Configura las rutas para la red social simulada
 */
export function setupSocialNetworkRoutes(app: Express) {
  // Obtener todos los usuarios de la red social
  app.get("/api/social/users", async (_req: Request, res: Response) => {
    try {
      const users = await db.select().from(socialUsers).limit(100);
      res.json(users);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ error: "Error al obtener usuarios" });
    }
  });

  // Obtener un usuario específico por ID
  app.get("/api/social/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await db.select().from(socialUsers).where(eq(socialUsers.id, id)).limit(1);
      
      if (user.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      res.json(user[0]);
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      res.status(500).json({ error: "Error al obtener usuario" });
    }
  });

  // Obtener todas las publicaciones con sus comentarios y usuarios
  app.get("/api/social/posts", async (_req: Request, res: Response) => {
    try {
      // Obtener todas las publicaciones ordenadas por fecha
      const allPosts = await db
        .select()
        .from(posts)
        .orderBy(desc(posts.createdAt))
        .limit(20);

      // Para cada publicación, obtener el usuario y los comentarios
      const postsWithDetails = await Promise.all(
        allPosts.map(async (post) => {
          // Obtener información del usuario que hizo la publicación
          const [user] = await db
            .select()
            .from(socialUsers)
            .where(eq(socialUsers.id, post.userId));

          // Obtener comentarios principales (no respuestas)
          const mainComments = await db
            .select()
            .from(comments)
            .where(
              and(
                eq(comments.postId, post.id),
                eq(comments.isReply, false)
              )
            )
            .orderBy(desc(comments.createdAt));

          // Para cada comentario, obtener el usuario y las respuestas
          const commentsWithDetails = await Promise.all(
            mainComments.map(async (comment) => {
              // Obtener información del usuario que comentó
              const [commentUser] = await db
                .select()
                .from(socialUsers)
                .where(eq(socialUsers.id, comment.userId));

              // Obtener respuestas a este comentario
              const repliesResult = await db
                .select()
                .from(comments)
                .where(
                  and(
                    eq(comments.postId, post.id),
                    eq(comments.isReply, true),
                    eq(comments.parentId, comment.id)
                  )
                )
                .orderBy(desc(comments.createdAt));

              // Para cada respuesta, obtener el usuario
              const replies = await Promise.all(
                repliesResult.map(async (reply) => {
                  const [replyUser] = await db
                    .select()
                    .from(socialUsers)
                    .where(eq(socialUsers.id, reply.userId));

                  return {
                    ...reply,
                    user: replyUser
                  };
                })
              );

              return {
                ...comment,
                user: commentUser,
                replies
              };
            })
          );

          return {
            ...post,
            user,
            comments: commentsWithDetails
          };
        })
      );

      res.json(postsWithDetails);
    } catch (error) {
      console.error("Error al obtener publicaciones:", error);
      res.status(500).json({ error: "Error al obtener publicaciones" });
    }
  });

  // Obtener una publicación específica por ID
  app.get("/api/social/posts/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id));
      
      if (!post) {
        return res.status(404).json({ error: "Publicación no encontrada" });
      }

      // Obtener usuario que hizo la publicación
      const [user] = await db
        .select()
        .from(socialUsers)
        .where(eq(socialUsers.id, post.userId));

      // Obtener comentarios principales
      const mainComments = await db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.postId, post.id),
            eq(comments.isReply, false)
          )
        )
        .orderBy(desc(comments.createdAt));

      // Para cada comentario, obtener usuario y respuestas
      const commentsWithDetails = await Promise.all(
        mainComments.map(async (comment) => {
          // Obtener usuario que comentó
          const [commentUser] = await db
            .select()
            .from(socialUsers)
            .where(eq(socialUsers.id, comment.userId));

          // Obtener respuestas a este comentario
          const repliesResult = await db
            .select()
            .from(comments)
            .where(
              and(
                eq(comments.postId, post.id),
                eq(comments.isReply, true),
                eq(comments.parentId, comment.id)
              )
            )
            .orderBy(desc(comments.createdAt));

          // Para cada respuesta, obtener usuario
          const replies = await Promise.all(
            repliesResult.map(async (reply) => {
              const [replyUser] = await db
                .select()
                .from(socialUsers)
                .where(eq(socialUsers.id, reply.userId));

              return {
                ...reply,
                user: replyUser
              };
            })
          );

          return {
            ...comment,
            user: commentUser,
            replies
          };
        })
      );

      const postWithDetails = {
        ...post,
        user,
        comments: commentsWithDetails
      };

      res.json(postWithDetails);
    } catch (error) {
      console.error("Error al obtener publicación:", error);
      res.status(500).json({ error: "Error al obtener publicación" });
    }
  });

  // Crear una nueva publicación (para los ejemplos, asignamos un usuario aleatorio)
  app.post("/api/social/posts", async (req: Request, res: Response) => {
    try {
      const { content } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "El contenido es requerido" });
      }

      // Obtener un usuario aleatorio para asignar la publicación
      const users = await db.select().from(socialUsers);
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Insertar la nueva publicación
      const [newPost] = await db.insert(posts).values({
        userId: randomUser.id,
        content,
        likes: 0,
        shares: 0,
      }).returning();

      // Obtener algunos usuarios aleatorios para generar comentarios automáticos
      const numComments = randomInt(1, 4); // Entre 1 y 3 comentarios
      const commenters = getRandomUsers(users, numComments, [randomUser.id]);

      // Generar comentarios automáticos
      for (const commenter of commenters) {
        try {
          // Generar un comentario usando OpenRouter
          const commentContent = await openRouterService.generateContextualResponse(
            content,
            {
              displayName: commenter.displayName,
              personality: commenter.personality || "amigable, conversador",
              interests: commenter.interests || ["música", "educación"],
              language: commenter.language
            }
          );

          // Insertar el comentario generado
          const [newComment] = await db.insert(comments).values({
            postId: newPost.id,
            userId: commenter.id,
            content: commentContent,
            likes: randomInt(0, 10),
            isReply: false
          }).returning();

          // 50% de probabilidad de que el autor de la publicación responda
          if (Math.random() > 0.5) {
            const replyContent = await openRouterService.generateContextualResponse(
              commentContent,
              {
                displayName: randomUser.displayName,
                personality: randomUser.personality || "amigable, conversador",
                interests: randomUser.interests || ["música", "educación"],
                language: randomUser.language
              }
            );

            await db.insert(comments).values({
              postId: newPost.id,
              userId: randomUser.id,
              content: replyContent,
              likes: randomInt(0, 5),
              isReply: true,
              parentId: newComment.id
            });
          }
        } catch (error) {
          console.error("Error al generar comentario automático:", error);
          // Continuamos con el siguiente comentador si hay error
        }
      }

      // Devolver la publicación creada
      const [createdPost] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, newPost.id));

      const [user] = await db
        .select()
        .from(socialUsers)
        .where(eq(socialUsers.id, createdPost.userId));

      res.status(201).json({ ...createdPost, user });
    } catch (error) {
      console.error("Error al crear publicación:", error);
      res.status(500).json({ error: "Error al crear publicación" });
    }
  });

  // Endpoint para dar like a una publicación
  app.post("/api/social/posts/:id/like", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar que la publicación existe
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id));

      if (!post) {
        return res.status(404).json({ error: "Publicación no encontrada" });
      }

      // Incrementar el contador de likes
      const [updatedPost] = await db
        .update(posts)
        .set({ likes: post.likes + 1 })
        .where(eq(posts.id, id))
        .returning();

      res.json(updatedPost);
    } catch (error) {
      console.error("Error al dar like:", error);
      res.status(500).json({ error: "Error al dar like a la publicación" });
    }
  });

  // Crear un nuevo comentario en una publicación
  app.post("/api/social/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { content, parentId } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "El contenido es requerido" });
      }

      // Verificar que la publicación existe
      const [post] = await db
        .select()
        .from(posts)
        .where(eq(posts.id, id));

      if (!post) {
        return res.status(404).json({ error: "Publicación no encontrada" });
      }

      // Obtener un usuario aleatorio para asignar el comentario
      const users = await db.select().from(socialUsers);
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Determinar si es una respuesta y validar el comentario padre
      const isReply = !!parentId;
      if (isReply) {
        const [parentComment] = await db
          .select()
          .from(comments)
          .where(
            and(
              eq(comments.id, parentId),
              eq(comments.postId, id)
            )
          );

        if (!parentComment) {
          return res.status(404).json({ error: "Comentario padre no encontrado" });
        }
      }

      // Insertar el nuevo comentario
      const [newComment] = await db.insert(comments).values({
        postId: id,
        userId: randomUser.id,
        content,
        likes: 0,
        isReply,
        parentId: isReply ? parentId : null
      }).returning();

      // Obtener el usuario que hizo el comentario
      const [commentUser] = await db
        .select()
        .from(socialUsers)
        .where(eq(socialUsers.id, randomUser.id));

      // Simular respuestas a este comentario después de un retraso aleatorio
      if (!isReply) {
        setTimeout(async () => {
          try {
            // Obtener usuarios aleatorios que no sean el autor del comentario
            const potentialResponders = getRandomUsers(users, randomInt(1, 3), [randomUser.id]);
            
            for (const responder of potentialResponders) {
              try {
                // Generar respuesta usando OpenRouter
                const replyContent = await openRouterService.generateContextualResponse(
                  content,
                  {
                    displayName: responder.displayName,
                    personality: responder.personality || "amigable, conversador",
                    interests: responder.interests || ["música", "educación"],
                    language: responder.language
                  }
                );

                // Insertar la respuesta
                await db.insert(comments).values({
                  postId: id,
                  userId: responder.id,
                  content: replyContent,
                  likes: randomInt(0, 5),
                  isReply: true,
                  parentId: newComment.id
                });

                console.log(`Respuesta automática generada por ${responder.displayName}`);
              } catch (error) {
                console.error("Error al generar respuesta automática:", error);
              }
            }
          } catch (error) {
            console.error("Error al generar respuestas automáticas:", error);
          }
        }, randomInt(5000, 20000)); // Retraso aleatorio entre 5 y 20 segundos
      }

      res.status(201).json({ ...newComment, user: commentUser });
    } catch (error) {
      console.error("Error al crear comentario:", error);
      res.status(500).json({ error: "Error al crear comentario" });
    }
  });
}

/**
 * Obtiene usuarios aleatorios de una lista excluyendo IDs específicos
 * @param users Lista de usuarios disponibles
 * @param count Número de usuarios a seleccionar
 * @param excludeIds IDs de usuarios a excluir
 * @returns Array de usuarios aleatorios
 */
function getRandomUsers(users: any[], count: number, excludeIds: string[] = []) {
  // Filtrar usuarios que no estén en la lista de exclusión
  const eligibleUsers = users.filter(user => !excludeIds.includes(user.id));
  
  // Si no hay suficientes usuarios elegibles, devolver todos
  if (eligibleUsers.length <= count) {
    return eligibleUsers;
  }
  
  // Seleccionar usuarios aleatorios
  const selectedUsers: any[] = [];
  const indices = new Set<number>();
  
  while (selectedUsers.length < count) {
    const index = Math.floor(Math.random() * eligibleUsers.length);
    if (!indices.has(index)) {
      indices.add(index);
      selectedUsers.push(eligibleUsers[index]);
    }
  }
  
  return selectedUsers;
}