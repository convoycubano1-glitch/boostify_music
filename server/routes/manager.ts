import { Router } from 'express';
import { db } from "@db";
import { managerTasks, managerContacts, managerSchedule, managerNotes, technicalRiders } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { authenticate } from '../middleware/auth';

const router = Router();

// Tasks endpoints
router.get('/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await db
      .select()
      .from(managerTasks)
      .where(eq(managerTasks.userId, req.user!.id))
      .orderBy(desc(managerTasks.createdAt));

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.post('/tasks', authenticate, async (req, res) => {
  try {
    const [task] = await db
      .insert(managerTasks)
      .values({
        ...req.body,
        userId: req.user!.id,
      })
      .returning();

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: 'Failed to create task' });
  }
});

// Contacts endpoints
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const contacts = await db
      .select()
      .from(managerContacts)
      .where(eq(managerContacts.userId, req.user!.id))
      .orderBy(desc(managerContacts.createdAt));

    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.post('/contacts', authenticate, async (req, res) => {
  try {
    const [contact] = await db
      .insert(managerContacts)
      .values({
        ...req.body,
        userId: req.user!.id,
      })
      .returning();

    res.status(201).json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(400).json({ error: 'Failed to create contact' });
  }
});

// Schedule endpoints
router.get('/schedule', authenticate, async (req, res) => {
  try {
    const schedules = await db
      .select()
      .from(managerSchedule)
      .where(eq(managerSchedule.userId, req.user!.id))
      .orderBy(desc(managerSchedule.startTime));

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

router.post('/schedule', authenticate, async (req, res) => {
  try {
    const [schedule] = await db
      .insert(managerSchedule)
      .values({
        ...req.body,
        userId: req.user!.id,
      })
      .returning();

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(400).json({ error: 'Failed to create schedule' });
  }
});

// Notes endpoints
router.get('/notes', authenticate, async (req, res) => {
  try {
    const notes = await db
      .select()
      .from(managerNotes)
      .where(eq(managerNotes.userId, req.user!.id))
      .orderBy(desc(managerNotes.createdAt));

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/notes', authenticate, async (req, res) => {
  try {
    const [note] = await db
      .insert(managerNotes)
      .values({
        ...req.body,
        userId: req.user!.id,
      })
      .returning();

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(400).json({ error: 'Failed to create note' });
  }
});

// Technical Riders endpoints
router.get('/technical-riders', authenticate, async (req, res) => {
  try {
    const technicalRidersList = await db
      .select()
      .from(technicalRiders)
      .where(eq(technicalRiders.userId, req.user!.id))
      .orderBy(desc(technicalRiders.createdAt));

    res.json(technicalRidersList);
  } catch (error) {
    console.error('Error fetching technical riders:', error);
    res.status(500).json({ error: 'Failed to fetch technical riders' });
  }
});

router.post('/technical-riders', authenticate, async (req, res) => {
  try {
    const [technicalRider] = await db
      .insert(technicalRiders)
      .values({
        ...req.body,
        userId: req.user!.id,
      })
      .returning();

    res.status(201).json(technicalRider);
  } catch (error) {
    console.error('Error creating technical rider:', error);
    res.status(400).json({ error: 'Failed to create technical rider' });
  }
});

// Get single technical rider
router.get('/technical-riders/:id', authenticate, async (req, res) => {
  try {
    const [technicalRider] = await db
      .select()
      .from(technicalRiders)
      .where(eq(technicalRiders.id, parseInt(req.params.id)))
      .limit(1);

    if (!technicalRider) {
      return res.status(404).json({ error: 'Technical rider not found' });
    }

    res.json(technicalRider);
  } catch (error) {
    console.error('Error fetching technical rider:', error);
    res.status(500).json({ error: 'Failed to fetch technical rider' });
  }
});

export default router;