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
  generatedBy: integer("generated_by").references(() => users.id),
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
  userId: integer("user_id").references(() => users.id).notNull(),
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
  userId: integer("user_id").references(() => users.id).notNull(),
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
  userId: integer("user_id").references(() => users.id).notNull(),
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
  userId: integer("user_id").references(() => users.id).notNull(),
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

export const lessonProgress = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  lessonId: integer("lesson_id").references(() => courseLessons.id).notNull(),
  completed: boolean("completed").default(false).notNull(),
  unlockedAt: timestamp("unlocked_at"),
  completedAt: timestamp("completed_at"),
  timeSpentMinutes: integer("time_spent_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const contentGenerationQueue = pgTable("content_generation_queue", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  lessonId: integer("lesson_id").references(() => courseLessons.id),
  generationType: text("generation_type", { enum: ["course_outline", "lesson_content", "quiz", "image"] }).notNull(),
  prompt: text("prompt").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
  result: json("result"),
  errorMessage: text("error_message"),
  priority: integer("priority").default(5).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at")
});

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  marketingMetrics: many(marketingMetrics),
  analyticsHistory: many(analyticsHistory),
  contracts: many(contracts),
  bookings: many(bookings),
  audioDemos: many(audioDemos),
  events: many(events),
  achievements: many(userAchievements),
  media: many(artistMedia),
  musicians: many(musicians),
  songs: many(songs),
  merchandise: many(merchandise),
  crowdfundingCampaigns: many(crowdfundingCampaigns)
}));

export const musiciansRelations = relations(musicians, ({ one, many }) => ({
  user: one(users, {
    fields: [musicians.userId],
    references: [users.id],
  }),
  bookings: many(bookings)
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  musician: one(musicians, {
    fields: [bookings.musicianId],
    references: [musicians.id],
  }),
  audioDemo: one(audioDemos, {
    fields: [bookings.audioDemoId],
    references: [audioDemos.id],
  }),
  payments: many(payments)
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const audioDemosRelations = relations(audioDemos, ({ one }) => ({
  user: one(users, {
    fields: [audioDemos.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [audioDemos.bookingId],
    references: [bookings.id],
  }),
}));

export const marketingMetricsRelations = relations(marketingMetrics, ({ one }) => ({
  user: one(users, {
    fields: [marketingMetrics.userId],
    references: [users.id],
  }),
}));

export const analyticsHistoryRelations = relations(analyticsHistory, ({ one }) => ({
  user: one(users, {
    fields: [analyticsHistory.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

export const managerToolsRelations = relations(users, ({ many }) => ({
  tasks: many(managerTasks),
  contacts: many(managerContacts),
  schedule: many(managerSchedule),
  notes: many(managerNotes)
}));

export const courseInstructorsRelations = relations(courseInstructors, ({ one, many }) => ({
  user: one(users, {
    fields: [courseInstructors.userId],
    references: [users.id],
  }),
  courses: many(courses)
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(courseInstructors, {
    fields: [courses.instructorId],
    references: [courseInstructors.id],
  }),
  lessons: many(courseLessons),
  enrollments: many(courseEnrollments),
  reviews: many(courseReviews)
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements)
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
  course: one(courses, {
    fields: [userAchievements.courseId],
    references: [courses.id],
  })
}));

export const performanceSegments = pgTable("performance_segments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  sceneId: integer("scene_id").notNull(),
  startTime: decimal("start_time", { precision: 10, scale: 3 }).notNull(),
  endTime: decimal("end_time", { precision: 10, scale: 3 }).notNull(),
  duration: decimal("duration", { precision: 10, scale: 3 }).notNull(),
  lyrics: text("lyrics"),
  shotType: text("shot_type"),
  audioSegmentUrl: text("audio_segment_url"),
  artistImageUrl: text("artist_image_url"),
  lipsyncVideoUrl: text("lipsync_video_url"),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).default("pending").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const userCredits = pgTable("user_credits", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull().unique(),
  credits: integer("credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  amount: integer("amount").notNull(),
  type: text("type", { enum: ["purchase", "deduction", "refund", "bonus"] }).notNull(),
  description: text("description").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  relatedProjectId: integer("related_project_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const musicVideoProjects = pgTable("music_video_projects", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull(),
  projectName: text("project_name").notNull(),
  
  // Audio data
  audioUrl: text("audio_url"),
  audioDuration: decimal("audio_duration", { precision: 10, scale: 2 }),
  transcription: text("transcription"),
  
  // Script data
  scriptContent: text("script_content"),
  
  // Timeline data (JSON con todos los items del timeline)
  timelineItems: json("timeline_items").$type<any[]>(),
  scenes: json("scenes").$type<any[]>(),
  
  // Style & Director data
  selectedDirector: json("selected_director"),
  selectedConcept: json("selected_concept"),
  videoStyle: json("video_style"),
  
  // Reference images & artist info
  artistReferenceImages: json("artist_reference_images").$type<string[]>(),
  artistName: text("artist_name"),
  songName: text("song_name"),
  
  // Editing style
  selectedEditingStyle: json("selected_editing_style"),
  
  // Video format
  aspectRatio: text("aspect_ratio"),
  
  // Auto-generated Artist Profile
  artistProfileId: integer("artist_profile_id").references(() => users.id),
  
  // Project status
  status: text("status", { 
    enum: ["draft", "generating_script", "generating_images", "generating_videos", "demo_generation", "demo_completed", "payment_pending", "full_generation", "completed", "failed"] 
  }).default("draft").notNull(),
  
  // Progress tracking
  progress: json("progress").$type<{
    scriptGenerated: boolean;
    imagesGenerated: number;
    totalImages: number;
    videosGenerated: number;
    totalVideos: number;
  }>(),
  generatedImagesCount: integer("generated_images_count").default(0),
  totalImagesTarget: integer("total_images_target").default(40),
  
  // Output
  finalVideoUrl: text("final_video_url"),
  
  // Payment
  isPaid: boolean("is_paid").default(false).notNull(),
  creditsUsed: integer("credits_used").default(0).notNull(),
  
  // Metadata
  tags: json("tags").$type<string[]>(),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const artistProfileImages = pgTable("artist_profile_images", {
  id: serial("id").primaryKey(),
  artistProfileId: integer("artist_profile_id").references(() => users.id).notNull(),
  musicVideoProjectId: integer("music_video_project_id").references(() => musicVideoProjects.id),
  
  imageUrl: text("image_url").notNull(),
  imageType: text("image_type", { 
    enum: ["concept", "scene", "reference", "banner", "profile", "generated"] 
  }).notNull(),
  
  title: text("title"),
  description: text("description"),
  
  sceneMetadata: json("scene_metadata").$type<{
    sceneNumber?: number;
    shotType?: string;
    mood?: string;
    timestamp?: number;
  }>(),
  
  isPublic: boolean("is_public").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const musicianClips = pgTable("musician_clips", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => musicVideoProjects.id),
  timelineItemId: text("timeline_item_id").notNull(),
  
  musicianType: text("musician_type", { 
    enum: ["guitar", "piano", "bass", "drums", "vocals", "saxophone", "trumpet", "violin", "other"] 
  }).notNull(),
  
  characterDescription: text("character_description"),
  faceReferenceUrl: text("face_reference_url"),
  
  generatedImageUrl: text("generated_image_url"),
  nanoBananaVideoUrl: text("nano_banana_video_url"),
  
  scriptContext: text("script_context"),
  cutTimestamp: decimal("cut_timestamp", { precision: 10, scale: 2 }),
  
  status: text("status", { 
    enum: ["pending", "generating", "completed", "failed"] 
  }).default("pending").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Spotify Curators - Saved curators for outreach
export const spotifyCurators = pgTable("spotify_curators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Curator info
  curatorName: text("curator_name").notNull(),
  curatorType: text("curator_type").notNull(), // "Independent Curator", "Label Curator", etc.
  playlistName: text("playlist_name"),
  playlistFocus: text("playlist_focus"), // Genre/style focus
  playlistUrl: text("playlist_url"),
  estimatedFollowers: text("estimated_followers"),
  
  // Contact info
  email: text("email"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  website: text("website"),
  
  // Metadata
  genre: text("genre").notNull(),
  notes: text("notes"), // Personal notes from artist
  contacted: boolean("contacted").default(false).notNull(),
  contactedAt: timestamp("contacted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const artistMediaRelations = relations(artistMedia, ({ one }) => ({
  user: one(users, {
    fields: [artistMedia.userId],
    references: [users.id],
  }),
}));

export const songsRelations = relations(songs, ({ one }) => ({
  user: one(users, {
    fields: [songs.userId],
    references: [users.id],
  }),
}));

export const merchandiseRelations = relations(merchandise, ({ one }) => ({
  user: one(users, {
    fields: [merchandise.userId],
    references: [users.id],
  }),
}));

export const crowdfundingCampaignsRelations = relations(crowdfundingCampaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [crowdfundingCampaigns.userId],
    references: [users.id],
  }),
  contributions: many(crowdfundingContributions),
}));

export const crowdfundingContributionsRelations = relations(crowdfundingContributions, ({ one }) => ({
  campaign: one(crowdfundingCampaigns, {
    fields: [crowdfundingContributions.campaignId],
    references: [crowdfundingCampaigns.id],
  }),
}));

export const musicianClipsRelations = relations(musicianClips, ({ one }) => ({
  project: one(musicVideoProjects, {
    fields: [musicianClips.projectId],
    references: [musicVideoProjects.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);
export const insertAudioDemoSchema = createInsertSchema(audioDemos);
export const selectAudioDemoSchema = createSelectSchema(audioDemos);
export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);
export const insertMarketingMetricsSchema = createInsertSchema(marketingMetrics);
export const selectMarketingMetricsSchema = createSelectSchema(marketingMetrics);
export const insertAnalyticsHistorySchema = createInsertSchema(analyticsHistory);
export const selectAnalyticsHistorySchema = createSelectSchema(analyticsHistory);
export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export const insertInvestorSchema = createInsertSchema(investors)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const selectInvestorSchema = createSelectSchema(investors);
export type InsertInvestor = z.infer<typeof insertInvestorSchema>;
export type SelectInvestor = typeof investors.$inferSelect;
export const insertManagerTaskSchema = createInsertSchema(managerTasks);
export const selectManagerTaskSchema = createSelectSchema(managerTasks);
export const insertManagerContactSchema = createInsertSchema(managerContacts);
export const selectManagerContactSchema = createSelectSchema(managerContacts);
export const insertManagerScheduleSchema = createInsertSchema(managerSchedule);
export const selectManagerScheduleSchema = createSelectSchema(managerSchedule);
export const insertManagerNoteSchema = createInsertSchema(managerNotes);

export const insertUserCreditSchema = createInsertSchema(userCredits).omit({ id: true, createdAt: true, updatedAt: true });
export const selectUserCreditSchema = createSelectSchema(userCredits);
export type InsertUserCredit = z.infer<typeof insertUserCreditSchema>;
export type SelectUserCredit = typeof userCredits.$inferSelect;

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({ id: true, createdAt: true });
export const selectCreditTransactionSchema = createSelectSchema(creditTransactions);
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type SelectCreditTransaction = typeof creditTransactions.$inferSelect;

export const insertMusicVideoProjectSchema = createInsertSchema(musicVideoProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const selectMusicVideoProjectSchema = createSelectSchema(musicVideoProjects);
export type InsertMusicVideoProject = z.infer<typeof insertMusicVideoProjectSchema>;
export type SelectMusicVideoProject = typeof musicVideoProjects.$inferSelect;

export const insertArtistProfileImageSchema = createInsertSchema(artistProfileImages).omit({ id: true, createdAt: true, updatedAt: true });
export const selectArtistProfileImageSchema = createSelectSchema(artistProfileImages);
export type InsertArtistProfileImage = z.infer<typeof insertArtistProfileImageSchema>;
export type SelectArtistProfileImage = typeof artistProfileImages.$inferSelect;

export const selectManagerNoteSchema = createSelectSchema(managerNotes);

export const insertCourseInstructorSchema = createInsertSchema(courseInstructors);
export const selectCourseInstructorSchema = createSelectSchema(courseInstructors);
export const insertCourseSchema = createInsertSchema(courses);
export const selectCourseSchema = createSelectSchema(courses);
export const insertCourseLessonSchema = createInsertSchema(courseLessons);
export const selectCourseLessonSchema = createSelectSchema(courseLessons);
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments);
export const selectCourseEnrollmentSchema = createSelectSchema(courseEnrollments);
export const insertCourseReviewSchema = createInsertSchema(courseReviews);
export const selectCourseReviewSchema = createSelectSchema(courseReviews);

export const insertCourseQuizSchema = createInsertSchema(courseQuizzes).omit({ id: true, createdAt: true, updatedAt: true });
export const selectCourseQuizSchema = createSelectSchema(courseQuizzes);
export type InsertCourseQuiz = z.infer<typeof insertCourseQuizSchema>;
export type SelectCourseQuiz = typeof courseQuizzes.$inferSelect;

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({ id: true, createdAt: true });
export const selectQuizQuestionSchema = createSelectSchema(quizQuestions);
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type SelectQuizQuestion = typeof quizQuestions.$inferSelect;

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({ id: true, completedAt: true });
export const selectQuizAttemptSchema = createSelectSchema(quizAttempts);
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type SelectQuizAttempt = typeof quizAttempts.$inferSelect;

export const insertLessonProgressSchema = createInsertSchema(lessonProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const selectLessonProgressSchema = createSelectSchema(lessonProgress);
export type InsertLessonProgress = z.infer<typeof insertLessonProgressSchema>;
export type SelectLessonProgress = typeof lessonProgress.$inferSelect;

export const insertContentGenerationQueueSchema = createInsertSchema(contentGenerationQueue).omit({ id: true, createdAt: true, completedAt: true });
export const selectContentGenerationQueueSchema = createSelectSchema(contentGenerationQueue);
export type InsertContentGenerationQueue = z.infer<typeof insertContentGenerationQueueSchema>;
export type SelectContentGenerationQueue = typeof contentGenerationQueue.$inferSelect;

export const insertAchievementSchema = createInsertSchema(achievements);
export const selectAchievementSchema = createSelectSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const selectUserAchievementSchema = createSelectSchema(userAchievements);

export const insertArtistMediaSchema = createInsertSchema(artistMedia);
export const selectArtistMediaSchema = createSelectSchema(artistMedia);

export const insertCrowdfundingCampaignSchema = createInsertSchema(crowdfundingCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export const selectCrowdfundingCampaignSchema = createSelectSchema(crowdfundingCampaigns);
export type InsertCrowdfundingCampaign = z.infer<typeof insertCrowdfundingCampaignSchema>;
export type SelectCrowdfundingCampaign = typeof crowdfundingCampaigns.$inferSelect;

export const insertCrowdfundingContributionSchema = createInsertSchema(crowdfundingContributions).omit({ id: true, createdAt: true });
export const selectCrowdfundingContributionSchema = createSelectSchema(crowdfundingContributions);
export type InsertCrowdfundingContribution = z.infer<typeof insertCrowdfundingContributionSchema>;
export type SelectCrowdfundingContribution = typeof crowdfundingContributions.$inferSelect;

export const insertSongSchema = createInsertSchema(songs)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const selectSongSchema = createSelectSchema(songs);

export const insertMerchandiseSchema = createInsertSchema(merchandise)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    price: z.union([z.string(), z.number()]).transform(val => String(val)),
  });
export const selectMerchandiseSchema = createSelectSchema(merchandise);

// Artist Wallet Schemas
export const insertArtistWalletSchema = createInsertSchema(artistWallet)
  .omit({ id: true, updatedAt: true });
export const selectArtistWalletSchema = createSelectSchema(artistWallet);

// Sales Transactions Schemas  
export const insertSalesTransactionSchema = createInsertSchema(salesTransactions)
  .omit({ id: true, createdAt: true });
export const selectSalesTransactionSchema = createSelectSchema(salesTransactions);

// Wallet Transactions Schemas
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions)
  .omit({ id: true, createdAt: true });
export const selectWalletTransactionSchema = createSelectSchema(walletTransactions);

export const insertMusicianSchema = createInsertSchema(musicians)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    price: z.union([z.string(), z.number()]).transform(val => String(val)),
    rating: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
  });
export const selectMusicianSchema = createSelectSchema(musicians);

export const insertPerformanceSegmentSchema = createInsertSchema(performanceSegments)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const selectPerformanceSegmentSchema = createSelectSchema(performanceSegments);

export const insertMusicianClipSchema = createInsertSchema(musicianClips)
  .omit({ id: true, createdAt: true, updatedAt: true });
export const selectMusicianClipSchema = createSelectSchema(musicianClips);
export type InsertMusicianClip = z.infer<typeof insertMusicianClipSchema>;
export type SelectMusicianClip = typeof musicianClips.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
export type SelectBooking = typeof bookings.$inferSelect;
export type InsertAudioDemo = typeof audioDemos.$inferInsert;
export type SelectAudioDemo = typeof audioDemos.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type SelectPayment = typeof payments.$inferSelect;
export type InsertMarketingMetrics = typeof marketingMetrics.$inferInsert;
export type SelectMarketingMetrics = typeof marketingMetrics.$inferSelect;
export type InsertAnalyticsHistory = typeof analyticsHistory.$inferInsert;
export type SelectAnalyticsHistory = typeof analyticsHistory.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type SelectEvent = typeof events.$inferSelect;
export type InsertManagerTask = typeof managerTasks.$inferInsert;
export type SelectManagerTask = typeof managerTasks.$inferSelect;
export type InsertManagerContact = typeof managerContacts.$inferInsert;
export type SelectManagerContact = typeof managerContacts.$inferSelect;
export type InsertManagerSchedule = typeof managerSchedule.$inferInsert;
export type SelectManagerSchedule = typeof managerSchedule.$inferSelect;
export type InsertManagerNote = typeof managerNotes.$inferInsert;
export type SelectManagerNote = typeof managerNotes.$inferSelect;

export type InsertCourseInstructor = typeof courseInstructors.$inferInsert;
export type SelectCourseInstructor = typeof courseInstructors.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;
export type SelectCourse = typeof courses.$inferSelect;
export type InsertCourseLesson = typeof courseLessons.$inferInsert;
export type SelectCourseLesson = typeof courseLessons.$inferSelect;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;
export type SelectCourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseReview = typeof courseReviews.$inferInsert;
export type SelectCourseReview = typeof courseReviews.$inferSelect;

export type InsertAchievement = typeof achievements.$inferInsert;
export type SelectAchievement = typeof achievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;
export type SelectUserAchievement = typeof userAchievements.$inferSelect;
export type InsertArtistMedia = typeof artistMedia.$inferInsert;
export type SelectArtistMedia = typeof artistMedia.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;
export type SelectSong = typeof songs.$inferSelect;
export type InsertMerchandise = typeof merchandise.$inferInsert;
export type SelectMerchandise = typeof merchandise.$inferSelect;
export type InsertMusician = typeof musicians.$inferInsert;
export type SelectMusician = typeof musicians.$inferSelect;


export const generatedVideos = pgTable("generated_videos", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  songName: text("song_name").notNull(),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").notNull(),
  isPaid: boolean("is_paid").default(false).notNull(),
  paymentIntentId: text("payment_intent_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  metadata: json("metadata"),
  status: text("status", { enum: ["generating", "completed", "failed"] }).default("generating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertGeneratedVideoSchema = createInsertSchema(generatedVideos);
export const selectGeneratedVideoSchema = createSelectSchema(generatedVideos);
export type GeneratedVideo = typeof generatedVideos.$inferSelect;
export type NewGeneratedVideo = typeof generatedVideos.$inferInsert;

// ============================================
// TOKENIZATION SYSTEM (Web3/Blockchain)
// ============================================

export const tokenizedSongs = pgTable("tokenized_songs", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  songName: text("song_name").notNull(),
  songUrl: text("song_url"),
  tokenId: integer("token_id").notNull().unique(), // ID in the ERC-1155 smart contract
  tokenSymbol: varchar("token_symbol", { length: 20 }).notNull(), // ej: "SONG-001"
  totalSupply: integer("total_supply").notNull(), // Total tokens minted
  availableSupply: integer("available_supply").notNull(), // Tokens still for sale
  pricePerTokenUsd: decimal("price_per_token_usd", { precision: 10, scale: 2 }).notNull(),
  pricePerTokenEth: decimal("price_per_token_eth", { precision: 18, scale: 8 }), // Cached ETH price
  royaltyPercentageArtist: integer("royalty_percentage_artist").default(80).notNull(), // 80%
  royaltyPercentagePlatform: integer("royalty_percentage_platform").default(20).notNull(), // 20%
  contractAddress: varchar("contract_address", { length: 42 }).notNull(), // Ethereum address
  metadataUri: text("metadata_uri"), // IPFS or server URL for token metadata
  imageUrl: text("image_url"), // Cover art for the token
  description: text("description"),
  benefits: text("benefits").array(), // Benefits for token holders
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => [
  index("idx_tokenized_songs_artist").on(table.artistId),
  index("idx_tokenized_songs_token_id").on(table.tokenId),
  index("idx_tokenized_songs_active").on(table.isActive)
]);

export const tokenPurchases = pgTable("token_purchases", {
  id: serial("id").primaryKey(),
  tokenizedSongId: integer("tokenized_song_id").notNull().references(() => tokenizedSongs.id, { onDelete: "cascade" }),
  buyerWalletAddress: varchar("buyer_wallet_address", { length: 42 }).notNull(), // Ethereum address
  buyerUserId: integer("buyer_user_id").references(() => users.id, { onDelete: "set null" }), // Optional if user is registered
  amountTokens: integer("amount_tokens").notNull(),
  pricePaidEth: decimal("price_paid_eth", { precision: 18, scale: 8 }).notNull(),
  pricePaidUsd: decimal("price_paid_usd", { precision: 10, scale: 2 }),
  artistEarningsEth: decimal("artist_earnings_eth", { precision: 18, scale: 8 }).notNull(),
  platformEarningsEth: decimal("platform_earnings_eth", { precision: 18, scale: 8 }).notNull(),
  transactionHash: varchar("transaction_hash", { length: 66 }).notNull().unique(), // 0x + 64 chars
  blockNumber: integer("block_number"),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, confirmed, failed
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("idx_token_purchases_song").on(table.tokenizedSongId),
  index("idx_token_purchases_buyer").on(table.buyerWalletAddress),
  index("idx_token_purchases_tx").on(table.transactionHash),
  index("idx_token_purchases_status").on(table.status)
]);

export const artistTokenEarnings = pgTable("artist_token_earnings", {
  id: serial("id").primaryKey(),
  artistId: integer("artist_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenizedSongId: integer("tokenized_song_id").notNull().references(() => tokenizedSongs.id, { onDelete: "cascade" }),
  purchaseId: integer("purchase_id").notNull().references(() => tokenPurchases.id, { onDelete: "cascade" }),
  amountEth: decimal("amount_eth", { precision: 18, scale: 8 }).notNull(),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }),
  transactionHash: varchar("transaction_hash", { length: 66 }).notNull(),
  withdrawnAt: timestamp("withdrawn_at"), // When artist withdrew to their wallet
  withdrawTxHash: varchar("withdraw_tx_hash", { length: 66 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
  index("idx_artist_earnings_artist").on(table.artistId),
  index("idx_artist_earnings_song").on(table.tokenizedSongId),
  index("idx_artist_earnings_withdrawn").on(table.withdrawnAt)
]);

// Relations for tokenization
export const tokenizedSongsRelations = relations(tokenizedSongs, ({ one, many }) => ({
  artist: one(users, {
    fields: [tokenizedSongs.artistId],
    references: [users.id],
  }),
  purchases: many(tokenPurchases),
  earnings: many(artistTokenEarnings),
}));

export const tokenPurchasesRelations = relations(tokenPurchases, ({ one }) => ({
  tokenizedSong: one(tokenizedSongs, {
    fields: [tokenPurchases.tokenizedSongId],
    references: [tokenizedSongs.id],
  }),
  buyer: one(users, {
    fields: [tokenPurchases.buyerUserId],
    references: [users.id],
  }),
}));

export const artistTokenEarningsRelations = relations(artistTokenEarnings, ({ one }) => ({
  artist: one(users, {
    fields: [artistTokenEarnings.artistId],
    references: [users.id],
  }),
  tokenizedSong: one(tokenizedSongs, {
    fields: [artistTokenEarnings.tokenizedSongId],
    references: [tokenizedSongs.id],
  }),
  purchase: one(tokenPurchases, {
    fields: [artistTokenEarnings.purchaseId],
    references: [tokenPurchases.id],
  }),
}));

// Zod schemas for validation
export const insertTokenizedSongSchema = createInsertSchema(tokenizedSongs);
export const selectTokenizedSongSchema = createSelectSchema(tokenizedSongs);
export const insertTokenPurchaseSchema = createInsertSchema(tokenPurchases);
export const selectTokenPurchaseSchema = createSelectSchema(tokenPurchases);
export const insertArtistTokenEarningsSchema = createInsertSchema(artistTokenEarnings);
export const selectArtistTokenEarningsSchema = createSelectSchema(artistTokenEarnings);

// TypeScript types
export type TokenizedSong = typeof tokenizedSongs.$inferSelect;
export type NewTokenizedSong = typeof tokenizedSongs.$inferInsert;
export type TokenPurchase = typeof tokenPurchases.$inferSelect;
export type NewTokenPurchase = typeof tokenPurchases.$inferInsert;
export type ArtistTokenEarnings = typeof artistTokenEarnings.$inferSelect;
export type NewArtistTokenEarnings = typeof artistTokenEarnings.$inferInsert;

// Instagram Connections - OAuth tokens and account info
export const instagramConnections = pgTable("instagram_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).unique().notNull(),
  accessToken: text("access_token").notNull(), // Long-lived token (60 days)
  instagramUserId: text("instagram_user_id").notNull(), // Instagram Business Account ID
  instagramUsername: text("instagram_username"),
  pageId: text("page_id").notNull(), // Facebook Page ID
  pageAccessToken: text("page_access_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(), // Token expiration date
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const instagramConnectionsRelations = relations(instagramConnections, ({ one }) => ({
  user: one(users, {
    fields: [instagramConnections.userId],
    references: [users.id],
  }),
}));

// Spotify Curators schemas
export const insertSpotifyCuratorSchema = createInsertSchema(spotifyCurators).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSpotifyCuratorSchema = createSelectSchema(spotifyCurators);
export type InsertSpotifyCurator = z.infer<typeof insertSpotifyCuratorSchema>;
export type SelectSpotifyCurator = typeof spotifyCurators.$inferSelect;

// Instagram Connections schemas
export const insertInstagramConnectionSchema = createInsertSchema(instagramConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const selectInstagramConnectionSchema = createSelectSchema(instagramConnections);
export type InsertInstagramConnection = z.infer<typeof insertInstagramConnectionSchema>;
export type SelectInstagramConnection = typeof instagramConnections.$inferSelect;

// ============================================
// ARTIST FASHION STUDIO TABLES
// ============================================

// Fashion Sessions - Sesiones de asesoría de moda
export const fashionSessions = pgTable("fashion_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionType: text("session_type", { 
    enum: ["tryon", "generation", "analysis", "video", "portfolio"] 
  }).notNull(),
  status: text("status", { 
    enum: ["active", "completed", "cancelled"] 
  }).default("active").notNull(),
  metadata: json("metadata").$type<{
    genre?: string;
    mood?: string;
    occasion?: string;
    references?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Fashion Results - Resultados de try-on, generaciones y análisis
export const fashionResults = pgTable("fashion_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => fashionSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  resultType: text("result_type", { 
    enum: ["tryon", "generation", "video", "moodboard"] 
  }).notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  metadata: json("metadata").$type<{
    modelImage?: string;
    clothingImage?: string;
    prompt?: string;
    falModel?: string;
    duration?: number;
    tags?: string[];
  }>(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  rating: integer("rating"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Fashion Analysis - Análisis y recomendaciones AI con Gemini
export const fashionAnalysis = pgTable("fashion_analysis", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => fashionSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  analysisType: text("analysis_type", { 
    enum: ["style", "color", "body_type", "genre_coherence", "trend"] 
  }).notNull(),
  imageUrl: text("image_url"),
  recommendations: json("recommendations").$type<{
    styleScore?: number;
    colorPalette?: string[];
    bodyType?: string;
    genreCoherence?: number;
    suggestions?: string[];
  }>(),
  moodBoard: json("mood_board").$type<{
    references?: string[];
    keywords?: string[];
    artistReferences?: string[];
  }>(),
  geminiResponse: text("gemini_response"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Fashion Portfolio - Portfolio de looks del artista
export const fashionPortfolio = pgTable("fashion_portfolio", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  images: text("images").array().notNull(),
  products: json("products").$type<Array<{
    merchandiseId?: number;
    name: string;
    imageUrl: string;
  }>>(),
  category: text("category", { 
    enum: ["concert", "photoshoot", "casual", "red_carpet", "music_video", "social_media"] 
  }).notNull(),
  season: text("season"),
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(false).notNull(),
  likes: integer("likes").default(0).notNull(),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Product Try-On History - Historial de try-on con productos del artista
export const productTryOnHistory = pgTable("product_tryon_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  merchandiseId: integer("merchandise_id").references(() => merchandise.id),
  modelImage: text("model_image").notNull(),
  resultImage: text("result_image").notNull(),
  falModel: text("fal_model").default("fal-ai/idm-vton").notNull(),
  rating: integer("rating"),
  feedback: text("feedback"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Fashion Videos - Videos generados con Kling mostrando al artista modelando ropa
export const fashionVideos = pgTable("fashion_videos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => fashionSessions.id),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  prompt: text("prompt").notNull(),
  modelImage: text("model_image"),
  clothingImage: text("clothing_image"),
  duration: integer("duration"),
  klingTaskId: text("kling_task_id"),
  status: text("status", { 
    enum: ["processing", "completed", "failed"] 
  }).default("processing").notNull(),
  metadata: json("metadata").$type<{
    falModel?: string;
    style?: string;
    occasion?: string;
  }>(),
  isPublished: boolean("is_published").default(false).notNull(),
  views: integer("views").default(0).notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Artist News - Noticias generadas con IA (Gemini + Nano Banana)
export const artistNews = pgTable("artist_news", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category", { 
    enum: ["release", "performance", "collaboration", "achievement", "lifestyle"] 
  }).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Notifications - Sistema de notificaciones internas
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // VIDEO_RENDER_DONE, NEW_FAN, PAYMENT_SUCCESS, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // ruta dentro de Boostify (ej: /videos/123)
  read: boolean("read").default(false).notNull(),
  metadata: json("metadata").$type<{
    videoId?: number;
    amount?: number;
    fanName?: string;
    tier?: string;
    [key: string]: any;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for Fashion Studio tables
export const fashionSessionsRelations = relations(fashionSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [fashionSessions.userId],
    references: [users.id],
  }),
  results: many(fashionResults),
  analysis: many(fashionAnalysis),
  videos: many(fashionVideos),
}));

export const fashionResultsRelations = relations(fashionResults, ({ one }) => ({
  session: one(fashionSessions, {
    fields: [fashionResults.sessionId],
    references: [fashionSessions.id],
  }),
  user: one(users, {
    fields: [fashionResults.userId],
    references: [users.id],
  }),
}));

export const fashionAnalysisRelations = relations(fashionAnalysis, ({ one }) => ({
  session: one(fashionSessions, {
    fields: [fashionAnalysis.sessionId],
    references: [fashionSessions.id],
  }),
  user: one(users, {
    fields: [fashionAnalysis.userId],
    references: [users.id],
  }),
}));

export const fashionPortfolioRelations = relations(fashionPortfolio, ({ one }) => ({
  user: one(users, {
    fields: [fashionPortfolio.userId],
    references: [users.id],
  }),
}));

export const productTryOnHistoryRelations = relations(productTryOnHistory, ({ one }) => ({
  user: one(users, {
    fields: [productTryOnHistory.userId],
    references: [users.id],
  }),
  merchandise: one(merchandise, {
    fields: [productTryOnHistory.merchandiseId],
    references: [merchandise.id],
  }),
}));

export const fashionVideosRelations = relations(fashionVideos, ({ one }) => ({
  user: one(users, {
    fields: [fashionVideos.userId],
    references: [users.id],
  }),
  session: one(fashionSessions, {
    fields: [fashionVideos.sessionId],
    references: [fashionSessions.id],
  }),
}));

// Fashion Studio Schemas
export const insertFashionSessionSchema = createInsertSchema(fashionSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const selectFashionSessionSchema = createSelectSchema(fashionSessions);
export type InsertFashionSession = z.infer<typeof insertFashionSessionSchema>;
export type SelectFashionSession = typeof fashionSessions.$inferSelect;

export const insertFashionResultSchema = createInsertSchema(fashionResults).omit({ id: true, createdAt: true });
export const selectFashionResultSchema = createSelectSchema(fashionResults);
export type InsertFashionResult = z.infer<typeof insertFashionResultSchema>;
export type SelectFashionResult = typeof fashionResults.$inferSelect;

export const insertFashionAnalysisSchema = createInsertSchema(fashionAnalysis).omit({ id: true, createdAt: true });
export const selectFashionAnalysisSchema = createSelectSchema(fashionAnalysis);
export type InsertFashionAnalysis = z.infer<typeof insertFashionAnalysisSchema>;
export type SelectFashionAnalysis = typeof fashionAnalysis.$inferSelect;

export const insertFashionPortfolioSchema = createInsertSchema(fashionPortfolio).omit({ id: true, createdAt: true, updatedAt: true });
export const selectFashionPortfolioSchema = createSelectSchema(fashionPortfolio);
export type InsertFashionPortfolio = z.infer<typeof insertFashionPortfolioSchema>;
export type SelectFashionPortfolio = typeof fashionPortfolio.$inferSelect;

export const insertProductTryOnHistorySchema = createInsertSchema(productTryOnHistory).omit({ id: true, createdAt: true });
export const selectProductTryOnHistorySchema = createSelectSchema(productTryOnHistory);
export type InsertProductTryOnHistory = z.infer<typeof insertProductTryOnHistorySchema>;
export type SelectProductTryOnHistory = typeof productTryOnHistory.$inferSelect;

export const insertFashionVideoSchema = createInsertSchema(fashionVideos).omit({ id: true, createdAt: true, updatedAt: true });
export const selectFashionVideoSchema = createSelectSchema(fashionVideos);
export type InsertFashionVideo = z.infer<typeof insertFashionVideoSchema>;
export type SelectFashionVideo = typeof fashionVideos.$inferSelect;

// Artist News Relations
export const artistNewsRelations = relations(artistNews, ({ one }) => ({
  user: one(users, {
    fields: [artistNews.userId],
    references: [users.id],
  }),
}));

// Artist News Schemas
export const insertArtistNewsSchema = createInsertSchema(artistNews).omit({ id: true, createdAt: true, updatedAt: true });
export const selectArtistNewsSchema = createSelectSchema(artistNews);
export type InsertArtistNews = z.infer<typeof insertArtistNewsSchema>;
export type SelectArtistNews = typeof artistNews.$inferSelect;

// Notifications Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Notifications Schemas
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const selectNotificationSchema = createSelectSchema(notifications);
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SelectNotification = typeof notifications.$inferSelect;

// ===================== SOCIAL NETWORK TABLES =====================

// Social Users - Perfiles para la red social (independiente de usuarios principales)
export const socialUsers = pgTable("social_users", {
  id: varchar("id").primaryKey(), // Usamos el Firebase UID del usuario
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  interests: text("interests").array(),
  language: text("language", { enum: ["en", "es"] }).default("en").notNull(),
  isBot: boolean("is_bot").default(false).notNull(),
  personality: text("personality"), // Para bots: su personalidad
  savedPosts: text("saved_posts").array().default(sql`ARRAY[]::text[]`), // Array de IDs de posts guardados
  likedPosts: text("liked_posts").array().default(sql`ARRAY[]::text[]`), // Array de IDs de posts que le gustaron
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Social Posts - Posts en la red social
export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => socialUsers.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  likedBy: text("liked_by").array().default(sql`ARRAY[]::text[]`), // Array de user IDs que dieron like
  savedBy: text("saved_by").array().default(sql`ARRAY[]::text[]`), // Array de user IDs que guardaron el post
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Social Comments - Comentarios en posts
export const socialComments = pgTable("social_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => socialUsers.id, { onDelete: "cascade" }).notNull(),
  postId: integer("post_id").references(() => socialPosts.id, { onDelete: "cascade" }).notNull(),
  parentId: integer("parent_id"), // Para respuestas a comentarios (self-reference)
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  isReply: boolean("is_reply").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Social Network Relations
export const socialUsersRelations = relations(socialUsers, ({ many }) => ({
  posts: many(socialPosts),
  comments: many(socialComments),
}));

export const socialPostsRelations = relations(socialPosts, ({ one, many }) => ({
  user: one(socialUsers, {
    fields: [socialPosts.userId],
    references: [socialUsers.id],
  }),
  comments: many(socialComments),
}));

export const socialCommentsRelations = relations(socialComments, ({ one }) => ({
  user: one(socialUsers, {
    fields: [socialComments.userId],
    references: [socialUsers.id],
  }),
  post: one(socialPosts, {
    fields: [socialComments.postId],
    references: [socialPosts.id],
  }),
  parent: one(socialComments, {
    fields: [socialComments.parentId],
    references: [socialComments.id],
    relationName: "replies"
  }),
}));

// Social Network Schemas
export const insertSocialUserSchema = createInsertSchema(socialUsers).omit({ createdAt: true, updatedAt: true });
export const selectSocialUserSchema = createSelectSchema(socialUsers);
export type InsertSocialUser = z.infer<typeof insertSocialUserSchema>;
export type SelectSocialUser = typeof socialUsers.$inferSelect;

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSocialPostSchema = createSelectSchema(socialPosts);
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SelectSocialPost = typeof socialPosts.$inferSelect;

export const insertSocialCommentSchema = createInsertSchema(socialComments).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSocialCommentSchema = createSelectSchema(socialComments);
export type InsertSocialComment = z.infer<typeof insertSocialCommentSchema>;
export type SelectSocialComment = typeof socialComments.$inferSelect;

// ========================================
// AFFILIATE SYSTEM TABLES
// ========================================

export const affiliates = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  socialMedia: json("social_media").$type<{
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
  }>(),
  audienceSize: text("audience_size"),
  marketingExperience: text("marketing_experience"),
  promotionStrategy: text("promotion_strategy"),
  level: text("level", { enum: ["Básico", "Plata", "Oro", "Platino", "Diamante"] }).default("Básico").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default('10.00').notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected", "suspended"] }).default("pending").notNull(),
  referralCode: text("referral_code").unique(),
  paymentMethod: text("payment_method", { enum: ["paypal", "bank_transfer", "stripe"] }).default("paypal"),
  paymentEmail: text("payment_email"),
  bankDetails: json("bank_details").$type<{
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    routingNumber?: string;
  }>(),
  totalClicks: integer("total_clicks").default(0).notNull(),
  totalConversions: integer("total_conversions").default(0).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default('0.00').notNull(),
  pendingPayment: decimal("pending_payment", { precision: 10, scale: 2 }).default('0.00').notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const affiliateLinks = pgTable("affiliate_links", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  uniqueCode: text("unique_code").unique().notNull(),
  productType: text("product_type", { enum: ["subscription", "bundle", "merchandise", "course", "general"] }).default("general").notNull(),
  productId: text("product_id"),
  customPath: text("custom_path"),
  title: text("title").notNull(),
  description: text("description"),
  clicks: integer("clicks").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).default('0.00').notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").references(() => affiliateLinks.id).notNull(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  country: text("country"),
  device: text("device", { enum: ["desktop", "mobile", "tablet", "unknown"] }).default("unknown"),
  clickedAt: timestamp("clicked_at").defaultNow().notNull()
});

export const affiliateConversions = pgTable("affiliate_conversions", {
  id: serial("id").primaryKey(),
  linkId: integer("link_id").references(() => affiliateLinks.id).notNull(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  productType: text("product_type").notNull(),
  productId: text("product_id").notNull(),
  saleAmount: decimal("sale_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "approved", "paid", "cancelled"] }).default("pending").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  metadata: json("metadata"),
  convertedAt: timestamp("converted_at").defaultNow().notNull()
});

export const affiliateEarnings = pgTable("affiliate_earnings", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type", { enum: ["commission", "bonus", "referral", "adjustment", "payout_request", "payout_completed", "referral_commission"] }).notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["pending", "approved", "paid"] }).default("pending").notNull(),
  conversionId: integer("conversion_id").references(() => affiliateConversions.id),
  paymentId: text("payment_id"),
  metadata: json("metadata"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const affiliateCoupons = pgTable("affiliate_coupons", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  code: text("code").unique().notNull(),
  description: text("description").notNull(),
  discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minimumPurchase: decimal("minimum_purchase", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  applicableProducts: text("applicable_products").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const affiliatePromotions = pgTable("affiliate_promotions", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  bannerUrl: text("banner_url"),
  landingPageUrl: text("landing_page_url").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  clicks: integer("clicks").default(0).notNull(),
  impressions: integer("impressions").default(0).notNull(),
  conversions: integer("conversions").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const affiliateBadges = pgTable("affiliate_badges", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").references(() => affiliates.id).notNull(),
  badgeType: text("badge_type", { 
    enum: ["first_sale", "milestone_10", "milestone_50", "milestone_100", "top_performer", "consistent_earner", "viral_marketer", "elite_affiliate"] 
  }).notNull(),
  badgeName: text("badge_name").notNull(),
  badgeDescription: text("badge_description").notNull(),
  iconUrl: text("icon_url"),
  earnedAt: timestamp("earned_at").defaultNow().notNull()
});

export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => affiliates.id).notNull(),
  referredAffiliateId: integer("referred_affiliate_id").references(() => affiliates.id),
  referredEmail: text("referred_email").notNull(),
  status: text("status", { enum: ["pending", "registered", "approved", "active"] }).default("pending").notNull(),
  level: integer("level").default(1).notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default('0.00').notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default('5.00').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const affiliateMarketingMaterials = pgTable("affiliate_marketing_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category", { enum: ["banner", "social_media", "email_template", "video", "guide"] }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  downloadCount: integer("download_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Affiliate Relations
export const affiliatesRelations = relations(affiliates, ({ one, many }) => ({
  user: one(users, {
    fields: [affiliates.userId],
    references: [users.id],
  }),
  links: many(affiliateLinks),
  clicks: many(affiliateClicks),
  conversions: many(affiliateConversions),
  earnings: many(affiliateEarnings),
  coupons: many(affiliateCoupons),
  promotions: many(affiliatePromotions),
  badges: many(affiliateBadges),
  referralsGiven: many(affiliateReferrals, { relationName: "referrer" }),
}));

export const affiliateLinksRelations = relations(affiliateLinks, ({ one, many }) => ({
  affiliate: one(affiliates, {
    fields: [affiliateLinks.affiliateId],
    references: [affiliates.id],
  }),
  clicks: many(affiliateClicks),
  conversions: many(affiliateConversions),
}));

// Affiliate Schemas
export const insertAffiliateSchema = createInsertSchema(affiliates).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  totalClicks: true,
  totalConversions: true,
  totalEarnings: true,
  pendingPayment: true,
  paidAmount: true
});
export const selectAffiliateSchema = createSelectSchema(affiliates);
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type SelectAffiliate = typeof affiliates.$inferSelect;

export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  clicks: true,
  conversions: true,
  earnings: true
});
export const selectAffiliateLinkSchema = createSelectSchema(affiliateLinks);
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;
export type SelectAffiliateLink = typeof affiliateLinks.$inferSelect;

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({ 
  id: true, 
  clickedAt: true 
});
export const selectAffiliateClickSchema = createSelectSchema(affiliateClicks);
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;
export type SelectAffiliateClick = typeof affiliateClicks.$inferSelect;

export const insertAffiliateConversionSchema = createInsertSchema(affiliateConversions).omit({ 
  id: true, 
  convertedAt: true 
});
export const selectAffiliateConversionSchema = createSelectSchema(affiliateConversions);
export type InsertAffiliateConversion = z.infer<typeof insertAffiliateConversionSchema>;
export type SelectAffiliateConversion = typeof affiliateConversions.$inferSelect;

export const insertAffiliateCouponSchema = createInsertSchema(affiliateCoupons).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  usedCount: true
});
export const selectAffiliateCouponSchema = createSelectSchema(affiliateCoupons);
export type InsertAffiliateCoupon = z.infer<typeof insertAffiliateCouponSchema>;
export type SelectAffiliateCoupon = typeof affiliateCoupons.$inferSelect;

export const insertAffiliatePromotionSchema = createInsertSchema(affiliatePromotions).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  clicks: true,
  impressions: true,
  conversions: true
});
export const selectAffiliatePromotionSchema = createSelectSchema(affiliatePromotions);
export type InsertAffiliatePromotion = z.infer<typeof insertAffiliatePromotionSchema>;
export type SelectAffiliatePromotion = typeof affiliatePromotions.$inferSelect;

export const insertAffiliateBadgeSchema = createInsertSchema(affiliateBadges).omit({ 
  id: true, 
  earnedAt: true 
});
export const selectAffiliateBadgeSchema = createSelectSchema(affiliateBadges);
export type InsertAffiliateBadge = z.infer<typeof insertAffiliateBadgeSchema>;
export type SelectAffiliateBadge = typeof affiliateBadges.$inferSelect;

export const insertAffiliateReferralSchema = createInsertSchema(affiliateReferrals).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  totalEarnings: true
});
export const selectAffiliateReferralSchema = createSelectSchema(affiliateReferrals);
export type InsertAffiliateReferral = z.infer<typeof insertAffiliateReferralSchema>;
export type SelectAffiliateReferral = typeof affiliateReferrals.$inferSelect;

export const insertAffiliateMarketingMaterialSchema = createInsertSchema(affiliateMarketingMaterials).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  downloadCount: true
});
export const selectAffiliateMarketingMaterialSchema = createSelectSchema(affiliateMarketingMaterials);
export type InsertAffiliateMarketingMaterial = z.infer<typeof insertAffiliateMarketingMaterialSchema>;
export type SelectAffiliateMarketingMaterial = typeof affiliateMarketingMaterials.$inferSelect;

// PR Agent Tables
export const prCampaigns = pgTable("pr_campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  title: text("title").notNull(),
  artistName: text("artist_name").notNull(),
  artistProfileUrl: text("artist_profile_url"),
  
  contentType: text("content_type", { enum: ["single", "album", "video", "tour", "announcement"] }).notNull(),
  contentTitle: text("content_title").notNull(),
  contentUrl: text("content_url"),
  
  targetMediaTypes: text("target_media_types").array(),
  targetCountries: text("target_countries").array(),
  targetGenres: text("target_genres").array(),
  
  pitchMessage: text("pitch_message").notNull(),
  
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  
  status: text("status", { enum: ["draft", "active", "paused", "completed"] }).default("draft").notNull(),
  
  mediaContacted: integer("media_contacted").default(0).notNull(),
  emailsOpened: integer("emails_opened").default(0).notNull(),
  mediaReplied: integer("media_replied").default(0).notNull(),
  interviewsBooked: integer("interviews_booked").default(0).notNull(),
  
  makeScenarioId: text("make_scenario_id"),
  lastSyncAt: timestamp("last_sync_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const prMediaDatabase = pgTable("pr_media_database", {
  id: serial("id").primaryKey(),
  
  type: text("type", { enum: ["radio", "tv", "podcast", "blog", "magazine"] }).notNull(),
  name: text("name").notNull(),
  
  country: text("country").notNull(),
  city: text("city"),
  
  genres: text("genres").array(),
  language: text("language").notNull(),
  
  email: text("email").notNull(),
  websiteUrl: text("website_url"),
  
  isActive: boolean("is_active").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const prWebhookEvents = pgTable("pr_webhook_events", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => prCampaigns.id).notNull(),
  
  eventType: text("event_type", { enum: ["email_sent", "email_opened", "media_replied", "interview_booked"] }).notNull(),
  
  payload: json("payload"),
  
  mediaName: text("media_name"),
  mediaEmail: text("media_email"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertPRCampaignSchema = createInsertSchema(prCampaigns).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  mediaContacted: true,
  emailsOpened: true,
  mediaReplied: true,
  interviewsBooked: true
});
export const selectPRCampaignSchema = createSelectSchema(prCampaigns);
export type InsertPRCampaign = z.infer<typeof insertPRCampaignSchema>;
export type SelectPRCampaign = typeof prCampaigns.$inferSelect;

export const insertPRMediaSchema = createInsertSchema(prMediaDatabase).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPRMediaSchema = createSelectSchema(prMediaDatabase);
export type InsertPRMedia = z.infer<typeof insertPRMediaSchema>;
export type SelectPRMedia = typeof prMediaDatabase.$inferSelect;

export const insertPRWebhookEventSchema = createInsertSchema(prWebhookEvents).omit({ 
  id: true, 
  createdAt: true 
});
export const selectPRWebhookEventSchema = createSelectSchema(prWebhookEvents);
export type InsertPRWebhookEvent = z.infer<typeof insertPRWebhookEventSchema>;
export type SelectPRWebhookEvent = typeof prWebhookEvents.$inferSelect;

// API Usage Monitoring - Tabla para monitorear consumo de APIs
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
 * Posiciones de liquidez del usuario - Cada usuario puede tener múltiples posiciones
 */
export const liquidityPositions = pgTable("liquidity_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  poolId: integer("pool_id").notNull().references(() => liquidityPools.id, { onDelete: "cascade" }),
  lpTokensHeld: decimal("lp_tokens_held", { precision: 20, scale: 8 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  amount1Deposited: decimal("amount1_deposited", { precision: 20, scale: 8 }).notNull(),
  amount2Deposited: decimal("amount2_deposited", { precision: 20, scale: 8 }).notNull(),
  feesEarned: decimal("fees_earned", { precision: 20, scale: 8 }).default('0').notNull(),
  transactionHash: varchar("transaction_hash", { length: 66 }),
  status: text("status", { enum: ["active", "withdrawn", "pending"] }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_liquidity_positions_user").on(table.userId),
  index("idx_liquidity_positions_pool").on(table.poolId),
  index("idx_liquidity_positions_wallet").on(table.walletAddress)
]);

/**
 * Historial de swaps ejecutados en BoostiSwap
 */
export const swapHistory = pgTable("swap_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  pairId: integer("pair_id").notNull().references(() => swapPairs.id, { onDelete: "cascade" }),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  tokenInId: integer("token_in_id").notNull().references(() => tokenizedSongs.id),
  tokenOutId: integer("token_out_id").notNull().references(() => tokenizedSongs.id),
  amountIn: decimal("amount_in", { precision: 20, scale: 8 }).notNull(),
  amountOut: decimal("amount_out", { precision: 20, scale: 8 }).notNull(),
  priceImpact: decimal("price_impact", { precision: 5, scale: 2 }).default('0').notNull(), // Porcentaje
  platformFeeUsd: decimal("platform_fee_usd", { precision: 10, scale: 2 }).default('0').notNull(), // 5% fee
  lpFeeUsd: decimal("lp_fee_usd", { precision: 10, scale: 2 }).default('0').notNull(), // Liquidity provider fee
  transactionHash: varchar("transaction_hash", { length: 66 }).unique(),
  blockNumber: integer("block_number"),
  status: text("status", { enum: ["pending", "confirmed", "failed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_swap_history_user").on(table.userId),
  index("idx_swap_history_pair").on(table.pairId),
  index("idx_swap_history_wallet").on(table.walletAddress),
  index("idx_swap_history_status").on(table.status)
]);

// ============================================
// BOOSTISWAP RELATIONS
// ============================================

export const swapPairsRelations = relations(swapPairs, ({ one, many }) => ({
  token1: one(tokenizedSongs, {
    fields: [swapPairs.token1Id],
    references: [tokenizedSongs.id],
  }),
  token2: one(tokenizedSongs, {
    fields: [swapPairs.token2Id],
    references: [tokenizedSongs.id],
  }),
  pools: many(liquidityPools),
  swaps: many(swapHistory),
}));

export const liquidityPoolsRelations = relations(liquidityPools, ({ one, many }) => ({
  pair: one(swapPairs, {
    fields: [liquidityPools.pairId],
    references: [swapPairs.id],
  }),
  positions: many(liquidityPositions),
}));

export const liquidityPositionsRelations = relations(liquidityPositions, ({ one }) => ({
  user: one(users, {
    fields: [liquidityPositions.userId],
    references: [users.id],
  }),
  pool: one(liquidityPools, {
    fields: [liquidityPositions.poolId],
    references: [liquidityPools.id],
  }),
}));

export const swapHistoryRelations = relations(swapHistory, ({ one }) => ({
  user: one(users, {
    fields: [swapHistory.userId],
    references: [users.id],
  }),
  pair: one(swapPairs, {
    fields: [swapHistory.pairId],
    references: [swapPairs.id],
  }),
}));

// ============================================
// BOOSTISWAP ZOD SCHEMAS
// ============================================

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

// Investor Payments
export const investorPayments = pgTable("investor_payments", {
  id: serial("id").primaryKey(),
  investorId: integer("investor_id"),
  investorName: text("investor_name"),
  investorEmail: text("investor_email"),
  
  // Tipo de inversión
  investmentType: text("investment_type", { enum: ["equity", "debt", "revenue_share", "grant", "loan"] }).notNull(),
  investmentAmount: decimal("investment_amount", { precision: 12, scale: 2 }).notNull(),
  investmentDate: timestamp("investment_date").notNull(),
  
  // Retornos e interés
  expectedReturn: decimal("expected_return", { precision: 5, scale: 2 }).notNull(), // Porcentaje
  expectedReturnAmount: decimal("expected_return_amount", { precision: 12, scale: 2 }).default('0'),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default('0'), // Para loans
  
  // Pagos realizados
  totalPaidOut: decimal("total_paid_out", { precision: 12, scale: 2 }).default('0').notNull(),
  pendingPayment: decimal("pending_payment", { precision: 12, scale: 2 }).default('0').notNull(),
  lastPaymentDate: timestamp("last_payment_date"),
  nextPaymentDate: timestamp("next_payment_date"),
  
  // Información de pago
  paymentMethod: text("payment_method", { enum: ["stripe", "paypal", "bank_transfer", "crypto", "wire", "check"] }),
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