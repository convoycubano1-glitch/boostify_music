import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Tabla de usuarios de la red social - EXACT column names from database
export const socialUsers = pgTable("social_users", {
  id: integer("id").primaryKey().notNull(),
  username: text("username").notNull().unique(),
  displayName: text("displayName").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  interests: text("interests").array(),
  language: text("language").default("en"),
  isBot: boolean("isBot").default(false),
  personality: text("personality"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de publicaciones - EXACT column names from database
export const posts = pgTable("social_posts", {
  id: integer("id").primaryKey().notNull(),
  userId: integer("userId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de comentarios - EXACT column names from database
export const comments = pgTable("social_comments", {
  id: integer("id").primaryKey().notNull(),
  userId: integer("userId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  postId: integer("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  parentId: integer("parentId").references(() => comments.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  isReply: boolean("isReply").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Relaciones para usuarios
export const socialUsersRelations = relations(socialUsers, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

// Relaciones para publicaciones
export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(socialUsers, {
    fields: [posts.userId],
    references: [socialUsers.id],
  }),
  comments: many(comments),
}));

// Relaciones para comentarios
export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(socialUsers, {
    fields: [comments.userId],
    references: [socialUsers.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments, {
    relationName: "comment_replies",
  }),
}));

// Tipos para TypeScript
export type SocialUser = typeof socialUsers.$inferSelect;
export type NewSocialUser = typeof socialUsers.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;