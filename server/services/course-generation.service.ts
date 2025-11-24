import { db } from "@db";
import { 
  courses, 
  courseLessons, 
  courseQuizzes, 
  quizQuestions, 
  contentGenerationQueue,
  courseEnrollments
} from "@db/schema";
import { eq, and, sql } from "drizzle-orm";
import * as geminiService from "./gemini.service";

export interface ProgressiveCourseRequest {
  topic: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  lessonsCount: number;
  instructorId: number;
  price: string;
  dripStrategy: "date" | "enrollment" | "sequential" | "prerequisite";
}

export async function createProgressiveCourse(request: ProgressiveCourseRequest) {
  try {
    console.log("🎯 Starting progressive course generation for:", request.topic);

    console.log("📝 Generating course outline...");
    const outline = await geminiService.generateCourseOutline(
      request.topic,
      request.level,
      request.lessonsCount
    );

    console.log("💾 Creating course in database...");
    const [course] = await db.insert(courses).values({
      instructorId: request.instructorId,
      title: outline.title,
      description: outline.description,
      price: request.price,
      category: outline.category,
      level: request.level,
      duration: `${outline.lessons.reduce((sum, l) => sum + l.duration, 0)} minutes`,
      lessonsCount: outline.lessons.length,
      thumbnail: null,
      dripStrategy: request.dripStrategy,
      isAIGenerated: true,
      generationStatus: "generating",
      status: "draft"
    }).returning();

    console.log("✅ Course created with ID:", course.id);

    console.log("📚 Creating lesson placeholders...");
    const lessonPromises = outline.lessons.map((lesson, index) => {
      const dripConfig: any = {};
      
      if (request.dripStrategy === "sequential") {
        dripConfig.prerequisiteLessonId = index > 0 ? index : null;
      } else if (request.dripStrategy === "enrollment") {
        dripConfig.dripDaysOffset = index * 3;
      }

      return db.insert(courseLessons).values({
        courseId: course.id,
        title: lesson.title,
        description: lesson.description,
        content: "Content will be generated when you unlock this lesson...",
        duration: lesson.duration,
        orderIndex: index,
        ...dripConfig,
        isGenerated: false,
        generationStatus: "pending"
      }).returning();
    });

    const lessonsResults = await Promise.all(lessonPromises);
    const createdLessons = lessonsResults.map(r => r[0]);

    console.log("🎨 Generating course thumbnail...");
    try {
      const thumbnailPrompt = `Professional educational course thumbnail for "${outline.title}" - modern, colorful, inspirational design with subtle music/education theme`;
      const thumbnailData = await geminiService.generateCourseImage(thumbnailPrompt);
      
      await db.update(courses)
        .set({ thumbnail: thumbnailData })
        .where(eq(courses.id, course.id));
    } catch (error) {
      console.warn("⚠️ Thumbnail generation failed, using placeholder");
    }

    console.log("✅ Course structure created successfully!");

    return {
      course,
      lessons: createdLessons,
      message: "Course created! Content will be generated progressively as students advance."
    };
  } catch (error: any) {
    console.error("❌ Error creating progressive course:", error);
    throw new Error(`Course generation failed: ${error.message}`);
  }
}

export async function generateLessonOnDemand(
  lessonId: number,
  userId: number
) {
  try {
    const [lesson] = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    if (lesson.isGenerated) {
      return { lesson, alreadyGenerated: true };
    }

    console.log(`🎓 Generating content for lesson: ${lesson.title}`);

    const [course] = await db.select()
      .from(courses)
      .where(eq(courses.id, lesson.courseId));

    const previousLessons = await db.select()
      .from(courseLessons)
      .where(
        and(
          eq(courseLessons.courseId, lesson.courseId),
          sql`${courseLessons.orderIndex} < ${lesson.orderIndex}`
        )
      );

    const lessonContent = await geminiService.generateLessonContent(
      lesson.title,
      course.title,
      previousLessons.map(l => l.title)
    );

    console.log(`🎨 Generating lesson image...`);
    const imagePrompt = await geminiService.generateLessonImagePrompt(
      lesson.title,
      lessonContent.description
    );
    const imageData = await geminiService.generateCourseImage(imagePrompt);

    console.log(`📝 Generating quiz questions...`);
    const quizQuestions = await geminiService.generateQuizQuestions(
      lesson.title,
      lessonContent.content,
      5
    );

    await db.update(courseLessons)
      .set({
        content: lessonContent.content,
        description: lessonContent.description,
        imageUrl: imageData,
        isGenerated: true,
        generationStatus: "completed"
      })
      .where(eq(courseLessons.id, lessonId));

    const [quiz] = await db.insert(courseQuizzes).values({
      lessonId: lesson.id,
      title: `${lesson.title} - Quiz`,
      description: `Test your understanding of ${lesson.title}`,
      passingScore: 70,
      orderIndex: 0,
      isGenerated: true
    }).returning();

    await Promise.all(
      quizQuestions.map((q, index) =>
        db.insert(quizQuestions).values({
          quizId: quiz.id,
          question: q.question,
          questionType: q.questionType as any,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
          orderIndex: index
        })
      )
    );

    const [updatedLesson] = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));

    console.log(`✅ Lesson content generated successfully!`);

    return {
      lesson: updatedLesson,
      quiz,
      alreadyGenerated: false
    };
  } catch (error: any) {
    console.error("❌ Error generating lesson content:", error);
    
    await db.update(courseLessons)
      .set({
        generationStatus: "failed"
      })
      .where(eq(courseLessons.id, lessonId));

    throw new Error(`Lesson generation failed: ${error.message}`);
  }
}

export async function checkLessonUnlockStatus(
  userId: number,
  lessonId: number
): Promise<{ unlocked: boolean; reason?: string }> {
  try {
    const [lesson] = await db.select()
      .from(courseLessons)
      .where(eq(courseLessons.id, lessonId));

    if (!lesson) {
      return { unlocked: false, reason: "Lesson not found" };
    }

    const [course] = await db.select()
      .from(courses)
      .where(eq(courses.id, lesson.courseId));

    const [enrollment] = await db.select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.userId, userId),
          eq(courseEnrollments.courseId, lesson.courseId),
          eq(courseEnrollments.status, "active")
        )
      );

    if (!enrollment) {
      return { unlocked: false, reason: "Not enrolled in course" };
    }

    if (course.dripStrategy === "sequential") {
      if (lesson.orderIndex === 0) {
        return { unlocked: true };
      }

      const previousLessons = await db.select()
        .from(courseLessons)
        .where(
          and(
            eq(courseLessons.courseId, lesson.courseId),
            sql`${courseLessons.orderIndex} < ${lesson.orderIndex}`
          )
        );

      for (const prevLesson of previousLessons) {
        const [progress] = await db.select()
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              eq(lessonProgress.lessonId, prevLesson.id),
              eq(lessonProgress.completed, true)
            )
          );

        if (!progress) {
          return { 
            unlocked: false, 
            reason: `Complete "${prevLesson.title}" first` 
          };
        }
      }

      return { unlocked: true };
    }

    if (course.dripStrategy === "enrollment" && lesson.dripDaysOffset !== null) {
      const daysSinceEnrollment = Math.floor(
        (Date.now() - enrollment.enrolledAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceEnrollment < lesson.dripDaysOffset) {
        return { 
          unlocked: false, 
          reason: `Unlocks in ${lesson.dripDaysOffset - daysSinceEnrollment} days` 
        };
      }

      return { unlocked: true };
    }

    if (course.dripStrategy === "date" && lesson.dripDate) {
      if (new Date() < lesson.dripDate) {
        return { 
          unlocked: false, 
          reason: `Unlocks on ${lesson.dripDate.toLocaleDateString()}` 
        };
      }

      return { unlocked: true };
    }

    return { unlocked: true };
  } catch (error: any) {
    console.error("Error checking lesson unlock status:", error);
    return { unlocked: false, reason: "Error checking unlock status" };
  }
}
