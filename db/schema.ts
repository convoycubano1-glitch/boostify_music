import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, uuid, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";
import { z } from "zod";

// Session storage table for Replit Auth
// IMPORTANTE: Necesaria para Replit Auth, no borrar
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // Campos para Replit Auth (opcional para retrocompatibilidad)
  replitId: varchar("replit_id").unique(), // ID de Replit Auth
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  // Campos legacy (ahora opcionales)
  username: text("username").unique(),
  password: text("password"),
  role: text("role", { enum: ["artist", "admin"] }).default("artist").notNull(),
  email: text("email"),
  phone: text("phone"),
  biography: text("biography"),
  genre: text("genre"),
  location: text("location"),
  website: text("website"),
  instagramHandle: text("instagram_handle"),
  twitterHandle: text("twitter_handle"),
  youtubeChannel: text("youtube_channel"),
  technicalRider: json("technical_rider"),
  spotifyToken: text("spotify_token"),
  instagramToken: text("instagram_token"),
  slug: text("slug").unique(),
  artistName: text("artist_name"),
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  bannerPosition: text("banner_position").default("50"),
  loopVideoUrl: text("loop_video_url"),
  realName: text("real_name"),
  country: text("country"),
  genres: text("genres").array(),
  spotifyUrl: text("spotify_url"),
  facebookUrl: text("facebook_url"),
  tiktokUrl: text("tiktok_url"),
  topYoutubeVideos: json("top_youtube_videos").$type<Array<{
    title: string;
    url: string;
    thumbnailUrl: string;
    type: string;
  }>>(),
  concerts: json("concerts").$type<{
    upcoming: Array<{
      tourName: string;
      location: { city: string; country: string; venue: string };
      date: string;
      status: string;
      source: string;
    }>;
    highlights: Array<{
      eventName: string;
      year: number;
      note: string;
    }>;
  }>(),
  // Virtual Record Label fields
  firestoreId: text("firestore_id"),
  isAIGenerated: boolean("is_ai_generated").default(false).notNull(),
  generatedBy: integer("generated_by").references(() => users.id, { onDelete: "cascade" }),
  recordLabelId: text("record_label_id"),
  // Profile Layout Configuration
  profileLayout: json("profile_layout").$type<{
    order: string[];
    visibility: Record<string, boolean>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const artistMedia = pgTable("artist_media", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  type: text("type", { enum: ["video"] }).notNull(),
  storagePath: text("storage_path").notNull(),
  duration: text("duration"),
  thumbnail: text("thumbnail"),
  description: text("description"),
  isPublished: boolean("is_published").default(true).notNull(),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  audioUrl: text("audio_url").notNull(),
  duration: text("duration"),
  releaseDate: timestamp("release_date"),
  genre: text("genre"),
  coverArt: text("cover_art"),
  isPublished: boolean("is_published").default(true).notNull(),
  plays: integer("plays").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const merchandise = pgTable("merchandise", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  images: text("images").array().notNull(),
  category: text("category", { enum: ["apparel", "accessories", "music", "other"] }).default("other").notNull(),
  stock: integer("stock").default(0).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  plan: text("plan", { enum: ["free", "creator", "professional", "enterprise"] }).notNull(),
  status: text("status", { enum: ["active", "cancelled", "expired", "trialing", "past_due"] }).notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  interval: text("interval", { enum: ["monthly", "yearly"] }).default("monthly"),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("usd"),
  isTrial: boolean("is_trial").default(false).notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  grantedByBundle: text("granted_by_bundle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Invoices - Facturas para suscripciones y servicios
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  
  invoiceNumber: text("invoice_number").unique().notNull(),
  stripeInvoiceId: text("stripe_invoice_id").unique(),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  status: text("status", { enum: ["draft", "open", "paid", "void", "uncollectible", "refunded"] }).default("open").notNull(),
  
  description: text("description"),
  plan: text("plan", { enum: ["free", "creator", "professional", "enterprise"] }),
  
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  
  paymentMethod: text("payment_method", { enum: ["stripe", "credit_card", "bank_transfer", "other"] }),
  
  metadata: json("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const selectInvoiceSchema = createSelectSchema(invoices);
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type SelectInvoice = typeof invoices.$inferSelect;

// Sistema de roles y permisos (reemplaza admin hardcodeado)
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  role: text("role", { enum: ["user", "moderator", "support", "admin"] }).default("user").notNull(),
  permissions: json("permissions").$type<string[]>(),
  grantedBy: integer("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Artist Wallet - Balance de créditos del artista
export const artistWallet = pgTable("artist_wallet", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique().notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default('0').notNull(), // Saldo disponible en créditos
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default('0').notNull(), // Total ganado histórico
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default('0').notNull(), // Total gastado
  currency: text("currency").default("usd").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Sales Transactions - Historial de ventas de merchandise
export const salesTransactions = pgTable("sales_transactions", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").references(() => users.id).notNull(),
  merchandiseId: integer("merchandise_id").references(() => merchandise.id),
  productName: text("product_name").notNull(),
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }).notNull(), // Precio total de venta
  artistEarning: decimal("artist_earning", { precision: 10, scale: 2 }).notNull(), // 30% para el artista
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // 70% para la plataforma
  quantity: integer("quantity").default(1).notNull(),
  currency: text("currency").default("usd").notNull(),
  buyerEmail: text("buyer_email"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status", { enum: ["pending", "completed", "refunded", "cancelled"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Wallet Transactions - Movimientos del wallet (ganancias y gastos)
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["earning", "spending", "refund", "adjustment"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  relatedSaleId: integer("related_sale_id").references(() => salesTransactions.id),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Crowdfunding Campaigns - Campañas de financiamiento colectivo de artistas
export const crowdfundingCampaigns = pgTable("crowdfunding_campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  goalAmount: decimal("goal_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default('0.00').notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  endDate: timestamp("end_date"),
  contributorsCount: integer("contributors_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Crowdfunding Contributions - Contribuciones a campañas
export const crowdfundingContributions = pgTable("crowdfunding_contributions", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => crowdfundingCampaigns.id).notNull(),
  contributorEmail: text("contributor_email"),
  contributorName: text("contributor_name"),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  artistAmount: decimal("artist_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  paymentStatus: text("payment_status", { enum: ["pending", "succeeded", "failed", "refunded"] }).default("pending").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const marketingMetrics = pgTable("marketing_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  spotifyFollowers: integer("spotify_followers").default(0),
  instagramFollowers: integer("instagram_followers").default(0),
  youtubeViews: integer("youtube_views").default(0),
  playlistPlacements: integer("playlist_placements").default(0),
  monthlyListeners: integer("monthly_listeners").default(0),
  totalEngagement: integer("total_engagement").default(0),
  websiteVisits: integer("website_visits").default(0),
  videoUploads: integer("video_uploads").default(0),
  averageViewDuration: decimal("average_view_duration", { precision: 10, scale: 2 }).default('0'),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default('0'),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const analyticsHistory = pgTable("analytics_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  metricName: text("metric_name").notNull(),
  metricValue: decimal("metric_value", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  source: text("source").notNull(),
  metadata: json("metadata")
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", { enum: ["draft", "active", "completed"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: json("metadata")
});

// @ts-expect-error - Circular reference with bookings table is necessary for relational integrity
export const audioDemos = pgTable("audio_demos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  musicianId: text("musician_id").notNull(),
  prompt: text("prompt").notNull(),
  audioUrl: text("audio_url").notNull(),
  requestId: text("request_id").unique().notNull(),
  duration: integer("duration"),
  status: text("status", { enum: ["pending", "completed", "failed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  bookingId: integer("booking_id").references(() => bookings.id)
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique().notNull(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  musicianAmount: decimal("musician_amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  status: text("status", { enum: ["pending", "succeeded", "failed", "refunded"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: json("metadata")
});

export const musicians = pgTable("musicians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  photo: text("photo").notNull(),
  referencePhoto: text("reference_photo"),
  instrument: text("instrument").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('5.0').notNull(),
  totalReviews: integer("total_reviews").default(0).notNull(),
  genres: text("genres").array().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// @ts-expect-error - Circular reference with audioDemos table is necessary for relational integrity
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  musicianId: integer("musician_id").references(() => musicians.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  tempo: text("tempo"),
  musicalKey: text("musical_key"),
  style: text("style"),
  projectDeadline: timestamp("project_deadline"),
  additionalNotes: text("additional_notes"),
  status: text("status", { enum: ["pending", "accepted", "completed", "cancelled"] }).default("pending").notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "refunded"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  audioDemoId: integer("audio_demo_id").references(() => audioDemos.id)
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  location: text("location"),
  type: text("type", { enum: ["concert", "release", "promotion", "other"] }).default("other").notNull(),
  status: text("status", { enum: ["upcoming", "ongoing", "completed", "cancelled"] }).default("upcoming").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: json("metadata")
});

export const investors = pgTable("investors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  investmentAmount: decimal("investment_amount", { precision: 10, scale: 2 }).notNull(),
  investmentGoals: text("investment_goals").notNull(),
  riskTolerance: text("risk_tolerance", { enum: ["low", "medium", "high"] }).notNull(),
  investorType: text("investor_type", { enum: ["individual", "corporate", "institutional"] }).notNull(),
  termsAccepted: boolean("terms_accepted").default(false).notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const managerTasks = pgTable("manager_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["pending", "in_progress", "completed", "cancelled"] }).default("pending").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high"] }).default("medium").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const managerContacts = pgTable("manager_contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const managerSchedule = pgTable("manager_schedule", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  type: text("type", { enum: ["meeting", "rehearsal", "performance", "other"] }).default("other").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).default("scheduled").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const managerNotes = pgTable("manager_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category", { enum: ["general", "meeting", "idea", "todo"] }).default("general").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const courseInstructors = pgTable("course_instructors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bio: text("bio"),
  specialization: text("specialization"),
  yearsOfExperience: integer("years_of_experience"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  instructorId: integer("instructor_id").references(() => courseInstructors.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  level: text("level", { enum: ["Beginner", "Intermediate", "Advanced"] }).notNull(),
  duration: text("duration").notNull(),
  lessonsCount: integer("lessons_count").notNull(),
  thumbnail: text("thumbnail"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0'),
  totalReviews: integer("total_reviews").default(0),
  status: text("status", { enum: ["draft", "published", "archived"] }).default("draft").notNull(),
  dripStrategy: text("drip_strategy", { enum: ["date", "enrollment", "sequential", "prerequisite"] }).default("sequential").notNull(),
  isAIGenerated: boolean("is_ai_generated").default(false).notNull(),
  generationStatus: text("generation_status", { enum: ["pending", "generating", "completed", "failed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  duration: integer("duration").notNull(),
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"),
  imageUrl: text("image_url"),
  materials: json("materials"),
  dripDate: timestamp("drip_date"),
  dripDaysOffset: integer("drip_days_offset"),
  prerequisiteLessonId: integer("prerequisite_lesson_id"),
  isGenerated: boolean("is_generated").default(false).notNull(),
  generationStatus: text("generation_status", { enum: ["pending", "generating", "completed", "failed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  status: text("status", { enum: ["active", "completed", "cancelled"] }).default("active").notNull(),
  progress: integer("progress").default(0),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at")
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  badgeImage: text("badge_image").notNull(),
  type: text("type", {
    enum: ["course_completion", "streak", "participation", "excellence"]
  }).notNull(),
  requirements: json("requirements").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  courseId: integer("course_id").references(() => courses.id),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  metadata: json("metadata")
});

export const courseReviews = pgTable("course_reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const courseQuizzes = pgTable("course_quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").default(70).notNull(),
  orderIndex: integer("order_index").notNull(),
  isGenerated: boolean("is_generated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => courseQuizzes.id).notNull(),
  question: text("question").notNull(),
  questionType: text("question_type", { enum: ["multiple_choice", "true_false", "short_answer"] }).default("multiple_choice").notNull(),
  options: json("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  points: integer("points").default(1).notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  quizId: integer("quiz_id").references(() => courseQuizzes.id).notNull(),
  score: integer("score").notNull(),
  totalPoints: integer("total_points").notNull(),
  passed: boolean("passed").notNull(),
  answers: json("answers").$type<Record<string, string>>(),
  completedAt: timestamp("completed_at").defaultNow().notNull()
});

// Pagination and filtering helpers - These are exported to be used in queries
export const ORDER_DIRECTION = ["asc", "desc"] as const;

// Booking Status History - Track changes
export const bookingStatusHistory = pgTable("booking_status_history", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  reason: text("reason"),
  changedBy: integer("changed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  affiliateCode: text("affiliate_code").unique().notNull(),
  affiliateName: text("affiliate_name").notNull(),
  affiliateEmail: text("affiliate_email"),
  affiliatePhone: text("affiliate_phone"),
  affiliateWebsite: text("affiliate_website"),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default('10').notNull(), // Default 10%
  status: text("status", { enum: ["active", "inactive", "suspended"] }).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  originalUrl: text("original_url").notNull(),
  shortenedCode: text("shortened_code").unique().notNull(),
  clickCount: integer("click_count").default(0).notNull(),
  conversionCount: integer("conversion_count").default(0).notNull(),
  earningsAmount: decimal("earnings_amount", { precision: 10, scale: 2 }).default('0').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tracking Cookies and Session Identifiers
export const affiliateTracking = pgTable("affiliate_tracking", {
  id: serial("id").primaryKey(),
  affiliateLinkId: integer("affiliate_link_id").references(() => affiliateLinks.id),
  sessionId: text("session_id").unique(),
  visitorIp: text("visitor_ip"),
  referrerUrl: text("referrer_url"),
  userAgent: text("user_agent"),
  clickTimestamp: timestamp("click_timestamp").defaultNow().notNull(),
  conversionTimestamp: timestamp("conversion_timestamp"),
  isConverted: boolean("is_converted").default(false).notNull(),
  metadata: json("metadata")
});

export const apiUsageLog = pgTable("api_usage_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  apiProvider: text("api_provider", { enum: ["openai", "gemini", "fal", "anthropic", "other"] }).notNull(),
  endpoint: text("endpoint").notNull(),
  model: text("model"),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 6 }).default('0').notNull(),
  currency: text("currency").default("usd").notNull(),
  responseTime: integer("response_time"), // milliseconds
  status: text("status", { enum: ["success", "error", "rate_limited"] }).default("success").notNull(),
  errorMessage: text("error_message"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApiUsageLogSchema = createInsertSchema(apiUsageLog).omit({ id: true, createdAt: true });
export const selectApiUsageLogSchema = createSelectSchema(apiUsageLog);
export type InsertApiUsageLog = z.infer<typeof insertApiUsageLogSchema>;
export type SelectApiUsageLog = typeof apiUsageLog.$inferSelect;

// Accounting/Transactions - Sistema de contabilidad
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  
  // Tipo de transacción
  type: text("type", { 
    enum: ["subscription", "product_purchase", "course_purchase", "service_fee", "refund", "payment", "other"] 
  }).notNull(),
  
  // Detalles de la transacción
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  
  // Referencias a otros recursos
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  productId: integer("product_id"),
  courseId: integer("course_id"),
  invoiceNumber: text("invoice_number"),
  
  // Información de pago
  paymentMethod: text("payment_method", { enum: ["stripe", "paypal", "bank_transfer", "credit_card", "other"] }),
  paymentStatus: text("payment_status", { enum: ["pending", "completed", "failed", "refunded"] }).default("pending").notNull(),
  stripeTransactionId: text("stripe_transaction_id"),
  
  // Detalles comerciales
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default('0'),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default('0'),
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(),
  
  // Metadata
  metadata: json("metadata"),
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const selectTransactionSchema = createSelectSchema(transactions);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SelectTransaction = typeof transactions.$inferSelect;

// Affiliate Payouts
export const affiliatePayouts = pgTable("affiliate_payouts", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id),
  affiliateName: text("affiliate_name"),
  affiliateEmail: text("affiliate_email"),
  
  // Comisiones y pagos
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // Porcentaje
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default('0').notNull(),
  totalCommission: decimal("total_commission", { precision: 12, scale: 2 }).default('0').notNull(),
  
  // Pagos
  amountPaid: decimal("amount_paid", { precision: 12, scale: 2 }).default('0').notNull(),
  amountPending: decimal("amount_pending", { precision: 12, scale: 2 }).default('0').notNull(),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  
  // Método de pago
  paymentMethod: text("payment_method", { enum: ["stripe", "paypal", "bank_transfer", "crypto", "other"] }),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "failed", "scheduled"] }).default("pending").notNull(),
  
  // Metadata
  referrals: integer("referrals").default(0),
  conversions: integer("conversions").default(0),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }).default('0'),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAffiliatePayoutSchema = createInsertSchema(affiliatePayouts).omit({ id: true, createdAt: true, updatedAt: true });
export const selectAffiliatePayoutSchema = createSelectSchema(affiliatePayouts);
export type InsertAffiliatePayout = z.infer<typeof insertAffiliatePayoutSchema>;
export type SelectAffiliatePayout = typeof affiliatePayouts.$inferSelect;

// ============================================
// BOOSTISWAP - DEX FOR MUSIC TOKENS
// ============================================

/**
 * Pares de trading - Cada par representa dos tokens que se pueden intercambiar
 * Ej: SONG-001 / USDC o LUNA-ECHO / ETH
 */
export const swapPairs = pgTable("swap_pairs", {
  id: serial("id").primaryKey(),
  token1Id: integer("token1_id").notNull().references(() => tokenizedSongs.id, { onDelete: "cascade" }),
  token2Id: integer("token2_id").notNull().references(() => tokenizedSongs.id, { onDelete: "cascade" }),
  pairAddress: varchar("pair_address", { length: 42 }).unique(), // Smart contract address
  reserve1: decimal("reserve1", { precision: 20, scale: 8 }).default('0').notNull(), // Token1 reserve
  reserve2: decimal("reserve2", { precision: 20, scale: 8 }).default('0').notNull(), // Token2 reserve
  volume24h: decimal("volume24h", { precision: 20, scale: 2 }).default('0').notNull(),
  feeTier: integer("fee_tier").default(5).notNull(), // 0.5% = 5 basis points
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_swap_pairs_tokens").on(table.token1Id, table.token2Id),
  index("idx_swap_pairs_active").on(table.isActive)
]);

/**
 * Pools de liquidez - Contiene reservas de ambos tokens y datos del pool
 */
export const liquidityPools = pgTable("liquidity_pools", {
  id: serial("id").primaryKey(),
  pairId: integer("pair_id").notNull().references(() => swapPairs.id, { onDelete: "cascade" }),
  totalShares: decimal("total_shares", { precision: 20, scale: 8 }).default('0').notNull(), // LP tokens emitidos
  reserve1: decimal("reserve1", { precision: 20, scale: 8 }).default('0').notNull(),
  reserve2: decimal("reserve2", { precision: 20, scale: 8 }).default('0').notNull(),
  feesAccumulated: decimal("fees_accumulated", { precision: 20, scale: 8 }).default('0').notNull(),
  apy: decimal("apy", { precision: 5, scale: 2 }).default('0').notNull(), // Annual Percentage Yield
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_liquidity_pools_pair").on(table.pairId)
]);

/**
 * Posiciones de liquidez - Participaciones individuales en pools
 */
export const liquidityPositions = pgTable("liquidity_positions", {
  id: serial("id").primaryKey(),
  poolId: integer("pool_id").notNull().references(() => liquidityPools.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shares: decimal("shares", { precision: 20, scale: 8 }).notNull(),
  amount1: decimal("amount1", { precision: 20, scale: 8 }).notNull(), // Cantidad de token1
  amount2: decimal("amount2", { precision: 20, scale: 8 }).notNull(), // Cantidad de token2
  feesEarned: decimal("fees_earned", { precision: 20, scale: 8 }).default('0').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Historial de swaps - Registro de todas las transacciones de swap
 */
export const swapHistory = pgTable("swap_history", {
  id: serial("id").primaryKey(),
  pairId: integer("pair_id").notNull().references(() => swapPairs.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amountIn: decimal("amount_in", { precision: 20, scale: 8 }).notNull(),
  amountOut: decimal("amount_out", { precision: 20, scale: 8 }).notNull(),
  fee: decimal("fee", { precision: 20, scale: 8 }).notNull(),
  executedPrice: decimal("executed_price", { precision: 20, scale: 8 }).notNull(),
  priceImpact: decimal("price_impact", { precision: 5, scale: 2 }).notNull(),
  transactionHash: text("transaction_hash"),
  status: text("status", { enum: ["pending", "completed", "failed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const swapPairsRelations = relations(swapPairs, ({ one, many }) => ({
  token1: one(tokenizedSongs, { fields: [swapPairs.token1Id], references: [tokenizedSongs.id] }),
  token2: one(tokenizedSongs, { fields: [swapPairs.token2Id], references: [tokenizedSongs.id] }),
  pools: many(liquidityPools),
  swapHistory: many(swapHistory)
}));

export const liquidityPoolsRelations = relations(liquidityPools, ({ one, many }) => ({
  pair: one(swapPairs, { fields: [liquidityPools.pairId], references: [swapPairs.id] }),
  positions: many(liquidityPositions)
}));

export const liquidityPositionsRelations = relations(liquidityPositions, ({ one }) => ({
  pool: one(liquidityPools, { fields: [liquidityPositions.poolId], references: [liquidityPools.id] }),
  user: one(users, { fields: [liquidityPositions.userId], references: [users.id] })
}));

export const swapHistoryRelations = relations(swapHistory, ({ one }) => ({
  pair: one(swapPairs, { fields: [swapHistory.pairId], references: [swapPairs.id] }),
  user: one(users, { fields: [swapHistory.userId], references: [users.id] })
}));

export const insertSwapPairSchema = createInsertSchema(swapPairs).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSwapPairSchema = createSelectSchema(swapPairs);
export type InsertSwapPair = z.infer<typeof insertSwapPairSchema>;
export type SelectSwapPair = typeof swapPairs.$inferSelect;

export const insertLiquidityPoolSchema = createInsertSchema(liquidityPools).omit({ id: true, createdAt: true, updatedAt: true });
export const selectLiquidityPoolSchema = createSelectSchema(liquidityPools);
export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type SelectLiquidityPool = typeof liquidityPools.$inferSelect;

export const insertLiquidityPositionSchema = createInsertSchema(liquidityPositions).omit({ id: true, createdAt: true, updatedAt: true });
export const selectLiquidityPositionSchema = createSelectSchema(liquidityPositions);
export type InsertLiquidityPosition = z.infer<typeof insertLiquidityPositionSchema>;
export type SelectLiquidityPosition = typeof liquidityPositions.$inferSelect;

export const insertSwapHistorySchema = createInsertSchema(swapHistory).omit({ id: true, createdAt: true });
export const selectSwapHistorySchema = createSelectSchema(swapHistory);
export type InsertSwapHistory = z.infer<typeof insertSwapHistorySchema>;
export type SelectSwapHistory = typeof swapHistory.$inferSelect;

export const investorPayments = pgTable("investor_payments", {
  id: serial("id").primaryKey(),
  investorId: integer("investor_id").references(() => investors.id).notNull(),
  
  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  
  // Payment Status
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "partial", "failed", "on_hold"] }).default("pending").notNull(),
  paymentFrequency: text("payment_frequency", { enum: ["monthly", "quarterly", "semi_annual", "annual", "milestone"] }).default("quarterly"),
  
  // Detalles
  status: text("status", { enum: ["active", "completed", "defaulted", "withdrawn"] }).default("active").notNull(),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvestorPaymentSchema = createInsertSchema(investorPayments).omit({ id: true, createdAt: true, updatedAt: true });
export const selectInvestorPaymentSchema = createSelectSchema(investorPayments);
export type InsertInvestorPayment = z.infer<typeof insertInvestorPaymentSchema>;
export type SelectInvestorPayment = typeof investorPayments.$inferSelect;

// Social Media Posts
export const socialMediaPosts = pgTable("social_media_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  platform: text("platform", { enum: ["facebook", "instagram", "tiktok"] }).notNull(),
  caption: text("caption").notNull(),
  hashtags: text("hashtags").array().notNull(),
  cta: text("cta").notNull(),
  viralScore: integer("viral_score"),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSocialMediaPostSchema = createSelectSchema(socialMediaPosts);
export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type SelectSocialMediaPost = typeof socialMediaPosts.$inferSelect;

// ============================================
// VIRTUAL RECORD LABEL
// ============================================

/**
 * Artistas Generados por IA
 * Estos artistas son completamente AI-generados con todos los datos necesarios
 */
export const generatedArtists = pgTable("generated_artists", {
  id: serial("id").primaryKey(),
  recordLabelId: text("record_label_id").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  
  // Artist Information
  name: text("name").notNull(),
  biography: text("biography"),
  profileImage: text("profile_image"),
  bannerImage: text("banner_image"),
  
  // Music Information
  genre: text("genre").notNull(),
  style: text("style"),
  
  // Social Media
  instagram: text("instagram"),
  twitter: text("twitter"),
  spotify: text("spotify"),
  youtube: text("youtube"),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  
  // Metadata
  generationData: json("generation_data"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

/**
 * Canciones AI-Generadas
 * Cada canción incluye audio, metadatos y referencias a su artista generado
 */
export const generatedSongs = pgTable("generated_songs", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").references(() => generatedArtists.id, { onDelete: "cascade" }).notNull(),
  createdBy: integer("created_by").references(() => users.id),
  
  // Song Information
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre").notNull(),
  mood: text("mood"),
  
  // Audio
  audioUrl: text("audio_url").notNull(),
  duration: integer("duration"), // in seconds
  waveform: text("waveform"), // JSON array or base64
  
  // Cover Art
  coverArt: text("cover_art"),
  
  // Metadata
  lyrics: text("lyrics"),
  composer: text("composer"),
  producer: text("producer"),
  generationModel: text("generation_model"), // e.g., "suno", "musiclm"
  prompt: text("prompt"),
  
  // Status
  isPublished: boolean("is_published").default(true).notNull(),
  
  // Stats
  plays: integer("plays").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

/**
 * Tokenized Songs (Canciones Tokenizadas para BoostiSwap)
 * Convierte canciones en tokens ERC-20 tradables
 */
export const tokenizedSongs = pgTable("tokenized_songs", {
  id: serial("id").primaryKey(),
  songId: integer("song_id").references(() => generatedSongs.id, { onDelete: "cascade" }),
  artistId: integer("artist_id").references(() => generatedArtists.id, { onDelete: "cascade" }).notNull(),
  
  // Token Information
  tokenName: text("token_name").notNull(),
  tokenSymbol: varchar("token_symbol", { length: 10 }).notNull(),
  tokenAddress: varchar("token_address", { length: 42 }).unique(), // ERC-20 address
  
  // Supply
  totalSupply: decimal("total_supply", { precision: 20, scale: 8 }).notNull(),
  circularSupply: decimal("circular_supply", { precision: 20, scale: 8 }).notNull(),
  
  // Pricing
  priceUSD: decimal("price_usd", { precision: 20, scale: 8 }).default('0').notNull(),
  marketCapUSD: decimal("market_cap_usd", { precision: 20, scale: 2 }).default('0').notNull(),
  volume24h: decimal("volume24h", { precision: 20, scale: 2 }).default('0').notNull(),
  
  // Royalties
  royaltyPercentage: decimal("royalty_percentage", { precision: 5, scale: 2 }).default('5').notNull(), // 5% default
  royaltyWalletAddress: varchar("royalty_wallet_address", { length: 42 }),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  launchDate: timestamp("launch_date"),
  
  // Metadata
  description: text("description"),
  imageUrl: text("image_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("idx_tokenized_songs_artist").on(table.artistId),
  index("idx_tokenized_songs_active").on(table.isActive)
]);

export const insertGeneratedArtistSchema = createInsertSchema(generatedArtists).omit({ id: true, createdAt: true, updatedAt: true });
export const selectGeneratedArtistSchema = createSelectSchema(generatedArtists);
export type InsertGeneratedArtist = z.infer<typeof insertGeneratedArtistSchema>;
export type SelectGeneratedArtist = typeof generatedArtists.$inferSelect;

export const insertGeneratedSongSchema = createInsertSchema(generatedSongs).omit({ id: true, createdAt: true, updatedAt: true });
export const selectGeneratedSongSchema = createSelectSchema(generatedSongs);
export type InsertGeneratedSong = z.infer<typeof insertGeneratedSongSchema>;
export type SelectGeneratedSong = typeof generatedSongs.$inferSelect;

export const insertTokenizedSongSchema = createInsertSchema(tokenizedSongs).omit({ id: true, createdAt: true, updatedAt: true });
export const selectTokenizedSongSchema = createSelectSchema(tokenizedSongs);
export type InsertTokenizedSong = z.infer<typeof insertTokenizedSongSchema>;
export type SelectTokenizedSong = typeof tokenizedSongs.$inferSelect;
