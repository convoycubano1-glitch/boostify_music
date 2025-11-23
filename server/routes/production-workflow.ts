import express, { Router, Request, Response } from "express";
import { db } from "../db";
import { productionProjects, productionPhases, productionTasks, productionMilestones, productionNotes, studioSessions } from "../../db/production-schema";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get user's production projects
router.get("/projects/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const projects = await db.select().from(productionProjects).where(eq(productionProjects.userId, parseInt(userId)));
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create production project
router.post("/projects", async (req: Request, res: Response) => {
  try {
    const { userId, name, description, dueDate } = req.body;
    
    const [project] = await db.insert(productionProjects).values({
      userId,
      name,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    }).returning();

    res.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Get project phases
router.get("/projects/:projectId/phases", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const phases = await db.select().from(productionPhases).where(eq(productionPhases.projectId, parseInt(projectId)));
    res.json(phases);
  } catch (error) {
    console.error("Error fetching phases:", error);
    res.status(500).json({ error: "Failed to fetch phases" });
  }
});

// Create production phase
router.post("/projects/:projectId/phases", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, description, dueDate, priority } = req.body;

    const [phase] = await db.insert(productionPhases).values({
      projectId: parseInt(projectId),
      name,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
    }).returning();

    res.json(phase);
  } catch (error) {
    console.error("Error creating phase:", error);
    res.status(500).json({ error: "Failed to create phase" });
  }
});

// Update phase progress
router.patch("/phases/:phaseId/progress", async (req: Request, res: Response) => {
  try {
    const { phaseId } = req.params;
    const { progress, status } = req.body;

    const [updated] = await db.update(productionPhases)
      .set({ 
        progress,
        status: status || undefined,
        completionDate: progress === 100 ? new Date() : undefined
      })
      .where(eq(productionPhases.id, parseInt(phaseId)))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating phase:", error);
    res.status(500).json({ error: "Failed to update phase" });
  }
});

// Get phase tasks
router.get("/phases/:phaseId/tasks", async (req: Request, res: Response) => {
  try {
    const { phaseId } = req.params;
    const tasks = await db.select().from(productionTasks).where(eq(productionTasks.phaseId, parseInt(phaseId)));
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Toggle task completion
router.patch("/tasks/:taskId/toggle", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await db.select().from(productionTasks).where(eq(productionTasks.id, parseInt(taskId)));
    
    if (!task.length) {
      return res.status(404).json({ error: "Task not found" });
    }

    const [updated] = await db.update(productionTasks)
      .set({ completed: !task[0].completed })
      .where(eq(productionTasks.id, parseInt(taskId)))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error toggling task:", error);
    res.status(500).json({ error: "Failed to toggle task" });
  }
});

// Create studio session
router.post("/studio-sessions", async (req: Request, res: Response) => {
  try {
    const { sessionId, hostId, name } = req.body;

    const [session] = await db.insert(studioSessions).values({
      sessionId,
      hostId,
      name,
    }).returning();

    res.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get studio session
router.get("/studio-sessions/:sessionId", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sessions = await db.select().from(studioSessions).where(eq(studioSessions.sessionId, sessionId));
    
    if (!sessions.length) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(sessions[0]);
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// End studio session
router.patch("/studio-sessions/:sessionId/end", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const [updated] = await db.update(studioSessions)
      .set({ 
        status: "completed",
        endTime: new Date()
      })
      .where(eq(studioSessions.sessionId, sessionId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

export default router;
