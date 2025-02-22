import { auth } from "@/firebase";
import { createSampleCourses } from "./create-sample-courses";

async function createCourses() {
  try {
    // User ID from the logs
    const userId = "coqofMnNMQUmnqU39h5EEO05Lwi1";
    
    console.log("Starting course creation...");
    await createSampleCourses(userId);
    console.log("Course creation completed!");
    
    // Reload the page to see the new courses
    window.location.reload();
  } catch (error) {
    console.error("Failed to create courses:", error);
  }
}

// Execute the function
createCourses();
