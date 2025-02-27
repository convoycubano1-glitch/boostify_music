export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  language: string;
  isBot: boolean;
  personality: string | null;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrl: string | null;
  likes: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
  user?: SocialUser;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likes: number;
  isReply: boolean;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: SocialUser;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface CreatePostRequest {
  content: string;
  mediaUrl?: string;
}