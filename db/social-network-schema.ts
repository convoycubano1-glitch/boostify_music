import { pgTable, text, timestamp, integer, boolean, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Tabla de usuarios de la red social - EXACT column names from database
export const socialUsers = pgTable("social_users", {
  id: integer("id").primaryKey().notNull(),
  displayName: text("displayName").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  interests: text("interests").array(),
  language: text("language").default("en"),
  isBot: boolean("isBot").default(false),
  personality: text("personality"),
  genre: text("genre"), // Para búsqueda avanzada
  location: text("location"), // Para filtrar por ubicación
  isVerified: boolean("isVerified").default(false), // Artista verificado
  audioDemos: text("audioDemos").array(), // Array of audio demo URLs
  videoDemos: text("videoDemos").array(), // Array of video demo URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de publicaciones - EXACT column names from database
export const posts = pgTable("social_posts", {
  id: integer("id").primaryKey().notNull(),
  userId: integer("userId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mediaType: text("mediaType"), // 'image', 'audio', 'video', 'voice-note'
  mediaData: text("mediaData"), // Datos base64 para archivos pequeños
  whatsappUrl: text("whatsappUrl"), // Link de WhatsApp
  mentions: text("mentions").array(), // Array de IDs mencionados
  challengeId: integer("challengeId"), // Si es respuesta a un desafío
  collaboratorIds: integer("collaboratorIds").array(), // Artistas colaboradores
  likes: integer("likes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de desafíos/retos
export const challenges = pgTable("social_challenges", {
  id: serial("id").primaryKey(),
  creatorId: integer("creatorId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  hashtag: text("hashtag").notNull(),
  content: text("content"), // Puede ser audio, video o texto
  mediaType: text("mediaType"),
  mediaData: text("mediaData"),
  participantCount: integer("participantCount").default(0),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabla de participantes en desafíos
export const challengeParticipants = pgTable("social_challenge_participants", {
  id: serial("id").primaryKey(),
  challengeId: integer("challengeId").notNull().references(() => challenges.id, { onDelete: "cascade" }),
  postId: integer("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabla de badges/logros
export const userBadges = pgTable("social_user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  badgeType: text("badgeType").notNull(), // 'verified', 'trending', 'collaborator', 'trending_creator'
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabla de colaboraciones sugeridas
export const collaborationSuggestions = pgTable("social_collaboration_suggestions", {
  id: serial("id").primaryKey(),
  userId1: integer("userId1").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  userId2: integer("userId2").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  compatibilityScore: integer("compatibilityScore"),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabla de mensajes directos
export const directMessages = pgTable("social_direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("senderId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  receiverId: integer("receiverId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabla de solicitudes de servicios
export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("clientId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  serviceType: text("serviceType").notNull(), // guitar, drums, vocals, production, etc
  budget: text("budget"), // 'low', 'medium', 'high', or specific amount
  deadline: timestamp("deadline"),
  status: text("status").default("open"), // open, accepted, in-progress, completed, cancelled
  acceptedBidId: integer("acceptedBidId"),
  revisionLimit: integer("revisionLimit").default(3),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de ofertas/bids de músicos
export const serviceBids = pgTable("service_bids", {
  id: serial("id").primaryKey(),
  requestId: integer("requestId").notNull().references(() => serviceRequests.id, { onDelete: "cascade" }),
  musicianId: integer("musicianId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  bidPrice: text("bidPrice").notNull(),
  deliveryDays: integer("deliveryDays").notNull(),
  description: text("description"),
  revisionIncluded: integer("revisionIncluded").default(3),
  status: text("status").default("pending"), // pending, accepted, rejected, withdrawn
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de revisiones
export const revisionHistory = pgTable("revision_history", {
  id: serial("id").primaryKey(),
  bidId: integer("bidId").notNull().references(() => serviceBids.id, { onDelete: "cascade" }),
  requestId: integer("requestId").notNull().references(() => serviceRequests.id, { onDelete: "cascade" }),
  revisionNumber: integer("revisionNumber").notNull(),
  notes: text("notes"),
  requestedBy: integer("requestedBy").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabla de pagos - Payments from clients to platform
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bidId: integer("bidId").notNull().references(() => serviceBids.id, { onDelete: "cascade" }),
  clientId: integer("clientId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  musicianId: integer("musicianId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Amount in cents
  platformFeePercentage: integer("platformFeePercentage").default(20), // Platform takes 20%
  artistAmount: integer("artistAmount").notNull(), // Amount for artist
  platformAmount: integer("platformAmount").notNull(), // Amount for platform
  stripePaymentIntentId: text("stripePaymentIntentId"), // Stripe Payment Intent ID
  status: text("status").default("pending"), // pending, completed, failed, refunded
  currency: text("currency").default("usd"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de wallets de artistas - Artist account balances
export const artistWallets = pgTable("artist_wallets", {
  id: serial("id").primaryKey(),
  musicianId: integer("musicianId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }).unique(),
  balance: integer("balance").default(0), // Balance in cents
  totalEarned: integer("totalEarned").default(0), // Total earned all time
  totalPaidOut: integer("totalPaidOut").default(0), // Total paid out
  stripeConnectId: text("stripeConnectId"), // Stripe Connected Account ID
  bankStatus: text("bankStatus").default("pending"), // pending, verified, failed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de payouts - Transfers to artists
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  musicianId: integer("musicianId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Amount in cents
  stripeTransferId: text("stripeTransferId"), // Stripe Transfer ID
  status: text("status").default("pending"), // pending, completed, failed, cancelled
  currency: text("currency").default("usd"),
  requestedAt: timestamp("requestedAt").defaultNow(),
  processedAt: timestamp("processedAt"),
  failureReason: text("failureReason"),
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

export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;

export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;

export type CollaborationSuggestion = typeof collaborationSuggestions.$inferSelect;

export type DirectMessage = typeof directMessages.$inferSelect;
export type NewDirectMessage = typeof directMessages.$inferInsert;

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;

export type ServiceBid = typeof serviceBids.$inferSelect;
export type NewServiceBid = typeof serviceBids.$inferInsert;

export type RevisionHistory = typeof revisionHistory.$inferSelect;
export type NewRevisionHistory = typeof revisionHistory.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type ArtistWallet = typeof artistWallets.$inferSelect;
export type NewArtistWallet = typeof artistWallets.$inferInsert;

export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;