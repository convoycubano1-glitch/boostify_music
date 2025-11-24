/**
 * Servicio PostgreSQL para Social Network
 * Reemplaza el servicio de Firestore con PostgreSQL
 * Nota: Las tablas socialUsers y socialPosts no existen en el schema actual
 * Este servicio devuelve datos vacíos/mock para mantener compatibilidad
 */
export class PostgresSocialNetworkService {
  
  // ===================== USUARIOS =====================
  
  async getAllUsers(): Promise<any[]> {
    console.log('Social network tables not available');
    return [];
  }
  
  async getUserById(id: string): Promise<any | null> {
    console.log(`Getting user ${id} - tables not available`);
    return null;
  }
  
  async createOrUpdateUserWithId(userId: string, userData: any): Promise<any> {
    console.log(`Creating/updating user ${userId} - tables not available`);
    return { id: userId, ...userData };
  }
  
  async updateUser(userId: string, updateData: any): Promise<any | null> {
    console.log(`Updating user ${userId} - tables not available`);
    return null;
  }
  
  async getBotUsers(): Promise<any[]> {
    console.log('Getting bot users - tables not available');
    return [];
  }
  
  // ===================== POSTS =====================
  
  async getAllPosts(): Promise<any[]> {
    console.log('Getting all posts - tables not available');
    return [];
  }
  
  async getPostById(id: string): Promise<any | null> {
    console.log(`Getting post ${id} - tables not available`);
    return null;
  }
  
  async createPost(postData: any): Promise<any> {
    console.log('Creating post - tables not available');
    return { id: Math.random(), ...postData };
  }
  
  async incrementPostLikes(id: string, userId: string): Promise<any | null> {
    console.log(`Incrementing likes for post ${id} - tables not available`);
    return null;
  }
  
  async savePost(id: string, userId: string): Promise<boolean> {
    console.log(`Saving post ${id} - tables not available`);
    return false;
  }
  
  async getSavedPosts(userId: string): Promise<any[]> {
    console.log(`Getting saved posts for user ${userId} - tables not available`);
    return [];
  }
  
  async getUserPosts(userId: string): Promise<any[]> {
    console.log(`Getting posts for user ${userId} - tables not available`);
    return [];
  }
  
  async getPostsWithDetails(currentUserId?: string): Promise<any[]> {
    console.log('Getting posts with details - tables not available');
    return [];
  }
  
  // ===================== COMENTARIOS =====================
  
  async getCommentsByPostId(postId: string): Promise<any[]> {
    console.log(`Getting comments for post ${postId}`);
    return [];
  }
  
  async createComment(commentData: any): Promise<any> {
    console.log('Comment creation not available');
    return { id: Math.random(), ...commentData, likes: 0 };
  }
}

// Exportar instancia singleton
export const postgresSocialNetworkService = new PostgresSocialNetworkService();
