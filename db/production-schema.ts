import { pgTable, text, timestamp, integer, serial, boolean, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Production Projects Table
export const productionProjects = pgTable("production_projects", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("planning"), // planning, in-progress, completed, on-hold
  priority: text("priority").default("medium"), // low, medium, high
  startDate: timestamp("startDate").defaultNow(),
  dueDate: timestamp("dueDate"),
  completionDate: timestamp("completionDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Production Phases Table
export const productionPhases = pgTable("production_phases", {
  id: serial("id").primaryKey(),
  projectId: integer("projectId").notNull().references(() => productionProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // pending, in-progress, completed, on-hold
  progress: integer("progress").default(0),
  priority: text("priority").default("medium"),
  startDate: timestamp("startDate").defaultNow(),
  dueDate: timestamp("dueDate"),
  completionDate: timestamp("completionDate"),
  assignee: text("assignee"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Production Tasks Table
export const productionTasks = pgTable("production_tasks", {
  id: serial("id").primaryKey(),
  phaseId: integer("phaseId").notNull().references(() => productionPhases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  dueDate: timestamp("dueDate"),
  assignee: text("assignee"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Production Milestones Table
export const productionMilestones = pgTable("production_milestones", {
  id: serial("id").primaryKey(),
  phaseId: integer("phaseId").notNull().references(() => productionPhases.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Studio Sessions Table
export const studioSessions = pgTable("studio_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("sessionId").unique(),
  hostId: integer("hostId").notNull(),
  name: text("name"),
  status: text("status").default("active"), // active, completed, cancelled
  startTime: timestamp("startTime").defaultNow(),
  endTime: timestamp("endTime"),
  participants: text("participants").array(), // Array of user IDs
  recordingUrl: text("recordingUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Studio Session Messages Table
export const studioMessages = pgTable("studio_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull().references(() => studioSessions.id, { onDelete: "cascade" }),
  senderId: integer("senderId").notNull(),
  content: text("content").notNull(),
  type: text("type").default("text"), // text, system
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Studio Shared Audio Files Table
export const studioAudioFiles = pgTable("studio_audio_files", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull().references(() => studioSessions.id, { onDelete: "cascade" }),
  uploaderId: integer("uploaderId").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  duration: text("duration"),
  size: text("size"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Production Notes Table
export const productionNotes = pgTable("production_notes", {
  id: serial("id").primaryKey(),
  phaseId: integer("phaseId").notNull().references(() => productionPhases.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Relations
export const productionProjectsRelations = relations(productionProjects, ({ many }) => ({
  phases: many(productionPhases),
}));

export const productionPhasesRelations = relations(productionPhases, ({ one, many }) => ({
  project: one(productionProjects, {
    fields: [productionPhases.projectId],
    references: [productionProjects.id],
  }),
  tasks: many(productionTasks),
  milestones: many(productionMilestones),
  notes: many(productionNotes),
}));

export const productionTasksRelations = relations(productionTasks, ({ one }) => ({
  phase: one(productionPhases, {
    fields: [productionTasks.phaseId],
    references: [productionPhases.id],
  }),
}));

export const studioSessionsRelations = relations(studioSessions, ({ many }) => ({
  messages: many(studioMessages),
  audioFiles: many(studioAudioFiles),
}));
