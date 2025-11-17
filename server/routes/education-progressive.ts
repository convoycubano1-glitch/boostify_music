import { Router } from 'express';
import { db } from '@db';
import { 
  courses, 
  courseLessons, 
  courseQuizzes,
  quizQuestions,
  quizAttempts,
  lessonProgress,
  courseEnrollments,
  courseInstructors,
  subscriptions
} from '@db/schema';
import { authenticate } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';
import * as courseGenService from '../services/course-generation.service';
import * as geminiService from '../services/gemini.service';

const router = Router();

router.get('/api/education/courses', async (req, res) => {
  try {
    const allCourses = await db.select().from(courses).orderBy(desc(courses.createdAt));
    res.json(allCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/api/education/courses/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id);
    
    const [course] = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const lessons = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(courseLessons.orderIndex);

    res.json({ course, lessons });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

router.post('/api/education/generate-course', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { topic, level, lessonsCount, price, dripStrategy } = req.body;

    if (!topic || !level) {
      return res.status(400).json({ error: 'Topic and level are required' });
    }

    let [instructor] = await db.select()
      .from(courseInstructors)
      .where(eq(courseInstructors.userId, req.user.id));

    if (!instructor) {
      [instructor] = await db.insert(courseInstructors).values({
        userId: req.user.id,
        specialization: 'Music Education',
        yearsOfExperience: 1,
      }).returning();
    }

    const result = await courseGenService.createProgressiveCourse({
      topic,
      level: level as "Beginner" | "Intermediate" | "Advanced",
      lessonsCount: lessonsCount || 8,
      instructorId: instructor.id,
      price: price || "0.00",
      dripStrategy: dripStrategy || "sequential"
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error generating course:', error);
    res.status(500).json({ 
      error: 'Failed to generate course', 
      message: error.message 
    });
  }
});

router.post('/api/education/enroll/:courseId', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const courseId = parseInt(req.params.courseId);

    const [course] = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId));

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const [existingEnrollment] = await db.select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, req.user.id),
          eq(courseEnrollments.courseId, courseId)
        )
      );

    if (existingEnrollment) {
      return res.json({ 
        enrollment: existingEnrollment, 
        alreadyEnrolled: true 
      });
    }

    const [enrollment] = await db.insert(courseEnrollments).values({
      userId: req.user.id,
      courseId,
      status: "active",
      progress: 0
    }).returning();

    const [firstLesson] = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(courseLessons.orderIndex)
      .limit(1);

    if (firstLesson) {
      await db.insert(lessonProgress).values({
        userId: req.user.id,
        lessonId: firstLesson.id,
        unlockedAt: new Date(),
        completed: false
      });
    }

    res.status(201).json({ enrollment, alreadyEnrolled: false });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

router.get('/api/education/lessons/:lessonId', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const lessonId = parseInt(req.params.lessonId);

    const unlockStatus = await courseGenService.checkLessonUnlockStatus(
      req.user.id,
      lessonId
    );

    if (!unlockStatus.unlocked) {
      return res.status(403).json({ 
        error: 'Lesson locked', 
        reason: unlockStatus.reason 
      });
    }

    const [lesson] = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!lesson.isGenerated) {
      console.log(`📖 Generating lesson content on-demand for lesson ${lessonId}`);
      const result = await courseGenService.generateLessonOnDemand(
        lessonId,
        req.user.id
      );
      
      return res.json({ 
        lesson: result.lesson, 
        quiz: result.quiz,
        generated: true 
      });
    }

    const quizzes = await db.select()
      .from(courseQuizzes)
      .where(eq(courseQuizzes.lessonId, lessonId));

    const [progress] = await db.select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, req.user.id),
          eq(lessonProgress.lessonId, lessonId)
        )
      );

    res.json({ lesson, quizzes, progress });
  } catch (error: any) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lesson',
      message: error.message 
    });
  }
});

router.post('/api/education/lessons/:lessonId/complete', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const lessonId = parseInt(req.params.lessonId);

    await db.insert(lessonProgress)
      .values({
        userId: req.user.id,
        lessonId,
        completed: true,
        completedAt: new Date()
      })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: {
          completed: true,
          completedAt: new Date()
        }
      });

    const [lesson] = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));

    const allLessons = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, lesson.courseId))
      .orderBy(courseLessons.orderIndex);

    const nextLesson = allLessons[lesson.orderIndex + 1];

    if (nextLesson) {
      await db.insert(lessonProgress)
        .values({
          userId: req.user.id,
          lessonId: nextLesson.id,
          unlockedAt: new Date(),
          completed: false
        })
        .onConflictDoNothing();
    }

    res.json({ success: true, nextLesson });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

router.get('/api/education/quizzes/:quizId', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const quizId = parseInt(req.params.quizId);

    const [quiz] = await db.select()
      .from(courseQuizzes)
      .where(eq(courseQuizzes.id, quizId));

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await db.select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.orderIndex);

    res.json({ quiz, questions });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

router.post('/api/education/quizzes/:quizId/submit', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const quizId = parseInt(req.params.quizId);
    const { answers } = req.body;

    const [quiz] = await db.select()
      .from(courseQuizzes)
      .where(eq(courseQuizzes.id, quizId));

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await db.select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId));

    let score = 0;
    let totalPoints = 0;

    questions.forEach(q => {
      totalPoints += q.points;
      if (answers[q.id] === q.correctAnswer) {
        score += q.points;
      }
    });

    const percentage = (score / totalPoints) * 100;
    const passed = percentage >= quiz.passingScore;

    const [attempt] = await db.insert(quizAttempts).values({
      userId: req.user.id,
      quizId,
      score,
      totalPoints,
      passed,
      answers
    }).returning();

    res.json({ attempt, percentage, passed });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

router.get('/api/education/my-courses', authenticate, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const enrollments = await db.select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.userId, req.user.id))
      .orderBy(desc(courseEnrollments.enrolledAt));

    const enrolledCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const [course] = await db.select()
          .from(courses)
          .where(eq(courses.id, enrollment.courseId));

        const lessons = await db.select()
          .from(courseLessons)
          .where(eq(courseLessons.courseId, enrollment.courseId));

        const completedLessons = await db.select()
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, req.user!.id),
              eq(lessonProgress.completed, true)
            )
          );

        return {
          ...course,
          enrollment,
          progress: Math.round((completedLessons.length / lessons.length) * 100),
          totalLessons: lessons.length,
          completedLessons: completedLessons.length
        };
      })
    );

    res.json(enrolledCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ error: 'Failed to fetch enrolled courses' });
  }
});

router.post('/api/education/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const imageData = await geminiService.generateCourseImage(prompt);
    
    res.json({ imageUrl: imageData });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    });
  }
});

export default router;
