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
  createdAt: timestamp("created_at").defaultNow().notNull()
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
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  plan: text("plan", { enum: ["free", "basic", "pro", "premium"] }).notNull(),
  status: text("status", { enum: ["active", "cancelled", "expired"] }).notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull()
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
  lessons: integer("lessons").notNull(),
  thumbnail: text("thumbnail").notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }).default('0'),
  totalReviews: integer("total_reviews").default(0),
  status: text("status", { enum: ["draft", "published", "archived"] }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const courseLessons = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  duration: integer("duration").notNull(), // in minutes
  orderIndex: integer("order_index").notNull(),
  videoUrl: text("video_url"),
  materials: json("materials"),
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
  timelineItems: json("timeline_items").$type<any[]>().default([]),
  scenes: json("scenes").$type<any[]>().default([]),
  
  // Style & Director data
  selectedDirector: json("selected_director"),
  selectedConcept: json("selected_concept"),
  videoStyle: json("video_style"),
  
  // Reference images & artist info
  artistReferenceImages: json("artist_reference_images").$type<string[]>().default([]),
  artistName: text("artist_name"),
  songName: text("song_name"),
  
  // Editing style
  selectedEditingStyle: json("selected_editing_style"),
  
  // Video format
  aspectRatio: text("aspect_ratio"),
  
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
  }>().default({
    scriptGenerated: false,
    imagesGenerated: 0,
    totalImages: 0,
    videosGenerated: 0,
    totalVideos: 0
  }),
  generatedImagesCount: integer("generated_images_count").default(0),
  totalImagesTarget: integer("total_images_target").default(40),
  
  // Output
  finalVideoUrl: text("final_video_url"),
  
  // Payment
  isPaid: boolean("is_paid").default(false).notNull(),
  creditsUsed: integer("credits_used").default(0).notNull(),
  
  // Metadata
  tags: json("tags").$type<string[]>().default([]),
  lastModified: timestamp("last_modified").defaultNow().notNull(),
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

// Red Social Simulada
export const socialUsers = pgTable("social_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  language: text("language").default("en"),
  isBot: boolean("is_bot").default(false),
  personality: text("personality"),
  interests: text("interests").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabla de publicaciones
export const posts = pgTable("social_posts", {
  id: integer("id").primaryKey().notNull(),
  userId: integer("userId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Tabla de comentarios
// @ts-expect-error - Self-referencing table for nested comments (parent/child relationship)
export const comments = pgTable("social_comments", {
  id: integer("id").primaryKey().notNull(),
  postId: integer("postId").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("userId").notNull().references(() => socialUsers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  isReply: boolean("isReply").default(false),
  parentId: integer("parentId").references(() => comments.id, { onDelete: "cascade" }),
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

export const insertSocialUserSchema = createInsertSchema(socialUsers);
export const selectSocialUserSchema = createSelectSchema(socialUsers);
export const insertPostSchema = createInsertSchema(posts);
export const selectPostSchema = createSelectSchema(posts);
export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);

export type SocialUser = typeof socialUsers.$inferSelect;
export type NewSocialUser = typeof socialUsers.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

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

// Spotify Curators schemas
export const insertSpotifyCuratorSchema = createInsertSchema(spotifyCurators).omit({ id: true, createdAt: true, updatedAt: true });
export const selectSpotifyCuratorSchema = createSelectSchema(spotifyCurators);
export type InsertSpotifyCurator = z.infer<typeof insertSpotifyCuratorSchema>;
export type SelectSpotifyCurator = typeof spotifyCurators.$inferSelect;