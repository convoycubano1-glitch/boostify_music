import { db } from '../firebase';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Colecciones de Firestore
const USERS_COLLECTION = 'social_users';
const POSTS_COLLECTION = 'social_posts';
const COMMENTS_COLLECTION = 'social_comments';

// Estructura tipada para los documentos
export interface SocialUser {
  id?: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  language: 'en' | 'es';
  isBot: boolean;
  personality?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Post {
  id?: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Comment {
  id?: string;
  userId: string;
  postId: string;
  parentId?: string | null;
  content: string;
  likes: number;
  isReply: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Funciones para convertir entre formatos de fecha
const toFirestoreDate = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

const fromFirestoreDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

// Función para convertir los datos al formato de Firestore
const toFirestore = <T extends {createdAt?: Date, updatedAt?: Date}>(data: T): any => {
  const result: any = {...data};
  
  if (result.createdAt && result.createdAt instanceof Date) {
    result.createdAt = toFirestoreDate(result.createdAt);
  }
  
  if (result.updatedAt && result.updatedAt instanceof Date) {
    result.updatedAt = toFirestoreDate(result.updatedAt);
  }
  
  return result;
};

// Función para convertir documentos de Firestore a nuestro formato
const fromFirestore = <T>(doc: FirebaseFirestore.DocumentSnapshot): T | null => {
  if (!doc.exists) return null;
  
  const data = doc.data();
  if (!data) return null;
  
  // Convertir Timestamps a Date
  const result: any = {
    id: doc.id,
    ...data
  };
  
  if (result.createdAt && result.createdAt instanceof Timestamp) {
    result.createdAt = fromFirestoreDate(result.createdAt);
  }
  
  if (result.updatedAt && result.updatedAt instanceof Timestamp) {
    result.updatedAt = fromFirestoreDate(result.updatedAt);
  }
  
  return result as T;
};

// Clase de servicio para la red social en Firestore
export class FirestoreSocialNetworkService {
  
  // USUARIOS
  
  async getAllUsers(): Promise<SocialUser[]> {
    try {
      const snapshot = await db.collection(USERS_COLLECTION).get();
      return snapshot.docs.map(doc => fromFirestore<SocialUser>(doc) as SocialUser);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
  
  async getUserById(id: string): Promise<SocialUser | null> {
    try {
      const doc = await db.collection(USERS_COLLECTION).doc(id).get();
      return fromFirestore<SocialUser>(doc);
    } catch (error) {
      console.error(`Error getting user with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createUser(userData: Omit<SocialUser, 'id'>): Promise<SocialUser> {
    try {
      const data = toFirestore(userData);
      const docRef = await db.collection(USERS_COLLECTION).add(data);
      const doc = await docRef.get();
      return fromFirestore<SocialUser>(doc) as SocialUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  async getBotUsers(): Promise<SocialUser[]> {
    try {
      const snapshot = await db.collection(USERS_COLLECTION)
        .where('isBot', '==', true)
        .get();
      
      return snapshot.docs.map(doc => fromFirestore<SocialUser>(doc) as SocialUser);
    } catch (error) {
      console.error('Error getting bot users:', error);
      throw error;
    }
  }
  
  // POSTS
  
  async getAllPosts(): Promise<Post[]> {
    try {
      const snapshot = await db.collection(POSTS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => fromFirestore<Post>(doc) as Post);
    } catch (error) {
      console.error('Error getting all posts:', error);
      throw error;
    }
  }
  
  async getPostById(id: string): Promise<Post | null> {
    try {
      const doc = await db.collection(POSTS_COLLECTION).doc(id).get();
      return fromFirestore<Post>(doc);
    } catch (error) {
      console.error(`Error getting post with ID ${id}:`, error);
      throw error;
    }
  }
  
  async createPost(postData: Omit<Post, 'id'>): Promise<Post> {
    try {
      const data = toFirestore(postData);
      const docRef = await db.collection(POSTS_COLLECTION).add(data);
      const doc = await docRef.get();
      return fromFirestore<Post>(doc) as Post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }
  
  async updatePost(id: string, updateData: Partial<Post>): Promise<Post | null> {
    try {
      const data = toFirestore(updateData);
      
      await db.collection(POSTS_COLLECTION).doc(id).update({
        ...data,
        updatedAt: toFirestoreDate(new Date())
      });
      
      const updatedDoc = await db.collection(POSTS_COLLECTION).doc(id).get();
      return fromFirestore<Post>(updatedDoc);
    } catch (error) {
      console.error(`Error updating post with ID ${id}:`, error);
      throw error;
    }
  }
  
  async incrementPostLikes(id: string): Promise<Post | null> {
    try {
      await db.collection(POSTS_COLLECTION).doc(id).update({
        likes: FieldValue.increment(1),
        updatedAt: toFirestoreDate(new Date())
      });
      
      const updatedDoc = await db.collection(POSTS_COLLECTION).doc(id).get();
      return fromFirestore<Post>(updatedDoc);
    } catch (error) {
      console.error(`Error incrementing likes for post with ID ${id}:`, error);
      throw error;
    }
  }
  
  async getPostsWithDetails(): Promise<any[]> {
    try {
      const posts = await this.getAllPosts();
      
      // Obtener detalles completos para cada post
      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          // Obtener el usuario
          const user = await this.getUserById(post.userId);
          
          // Obtener los comentarios
          const comments = await this.getCommentsByPostId(post.id as string);
          
          // Obtener usuarios para cada comentario
          const commentsWithUsers = await Promise.all(
            comments.map(async (comment) => {
              const commentUser = await this.getUserById(comment.userId);
              return {
                ...comment,
                user: commentUser
              };
            })
          );
          
          // Determinar si el usuario dio like (simulado)
          const isLiked = Math.random() > 0.5;
          
          return {
            ...post,
            user,
            comments: commentsWithUsers,
            isLiked
          };
        })
      );
      
      return postsWithDetails;
    } catch (error) {
      console.error('Error getting posts with details:', error);
      throw error;
    }
  }
  
  // COMENTARIOS
  
  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    try {
      const snapshot = await db.collection(COMMENTS_COLLECTION)
        .where('postId', '==', postId)
        .orderBy('createdAt', 'asc')
        .get();
      
      return snapshot.docs.map(doc => fromFirestore<Comment>(doc) as Comment);
    } catch (error) {
      console.error(`Error getting comments for post with ID ${postId}:`, error);
      throw error;
    }
  }
  
  async createComment(commentData: Omit<Comment, 'id'>): Promise<Comment> {
    try {
      const data = toFirestore(commentData);
      const docRef = await db.collection(COMMENTS_COLLECTION).add(data);
      const doc = await docRef.get();
      return fromFirestore<Comment>(doc) as Comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }
  
  async incrementCommentLikes(id: string): Promise<Comment | null> {
    try {
      await db.collection(COMMENTS_COLLECTION).doc(id).update({
        likes: FieldValue.increment(1),
        updatedAt: toFirestoreDate(new Date())
      });
      
      const updatedDoc = await db.collection(COMMENTS_COLLECTION).doc(id).get();
      return fromFirestore<Comment>(updatedDoc);
    } catch (error) {
      console.error(`Error incrementing likes for comment with ID ${id}:`, error);
      throw error;
    }
  }
}

// Exportar una instancia del servicio
export const firestoreSocialNetworkService = new FirestoreSocialNetworkService();