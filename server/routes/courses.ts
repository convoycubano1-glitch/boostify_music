import { Router } from 'express';
import { db } from '@db';
import { courses, courseInstructors } from '@db/schema';
import { authenticate } from '../middleware/auth';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get all courses
router.get('/api/courses', async (req, res) => {
  try {
    const allCourses = await db
      .select()
      .from(courses)
      .orderBy(courses.createdAt);

    res.json(allCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Create a new course
router.post('/api/courses', authenticate, async (req, res) => {
  try {
    // Check if the user is an instructor
    const [instructor] = await db
      .select()
      .from(courseInstructors)
      .where(eq(courseInstructors.userId, req.user!.id))
      .limit(1);

    if (!instructor) {
      // Create instructor profile if it doesn't exist
      const [newInstructor] = await db
        .insert(courseInstructors)
        .values({
          userId: req.user!.id,
          specialization: 'Music Industry Professional',
          yearsOfExperience: 1,
        })
        .returning();
      
      instructor = newInstructor;
    }

    // Create the course
    const [course] = await db
      .insert(courses)
      .values({
        ...req.body,
        instructorId: instructor.id,
        status: 'published',
      })
      .returning();

    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

export default router;
