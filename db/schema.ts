import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role", { enum: ["artist", "admin"] }).default("artist").notNull(),
  spotifyToken: text("spotify_token"),
  instagramToken: text("instagram_token"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  plan: text("plan", { enum: ["basic", "pro", "enterprise"] }).notNull(),
  status: text("status", { enum: ["active", "cancelled", "expired"] }).notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull()
});

export const marketingMetrics = pgTable("marketing_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  spotifyFollowers: integer("spotify_followers"),
  instagramFollowers: integer("instagram_followers"),
  playlistPlacements: integer("playlist_placements"),
  monthlyListeners: integer("monthly_listeners"),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
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

// New table for storing audio demos
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
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("usd").notNull(),
  status: text("status", { enum: ["pending", "succeeded", "failed", "refunded"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: json("metadata")
});

// Update bookings table to include price and payment status
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  musicianId: text("musician_id").notNull(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  marketingMetrics: many(marketingMetrics),
  contracts: many(contracts),
  bookings: many(bookings),
  audioDemos: many(audioDemos)
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
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

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertBookingSchema = createInsertSchema(bookings);
export const selectBookingSchema = createSelectSchema(bookings);
export const insertAudioDemoSchema = createInsertSchema(audioDemos);
export const selectAudioDemoSchema = createSelectSchema(audioDemos);
export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;
export type SelectBooking = typeof bookings.$inferSelect;
export type InsertAudioDemo = typeof audioDemos.$inferInsert;
export type SelectAudioDemo = typeof audioDemos.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type SelectPayment = typeof payments.$inferSelect;