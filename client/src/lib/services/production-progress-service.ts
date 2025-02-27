import { db, auth } from "@/firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { User } from "firebase/auth";

// Types definitions
export interface ProductionProject {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  targetCompletionDate?: Date;
  status: "on-track" | "at-risk" | "delayed" | "completed";
  currentPhaseId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  collaborators?: Record<string, boolean>;
}

export interface ProductionPhase {
  id: string;
  projectId: string;
  name: string;
  status: "completed" | "in-progress" | "pending" | "delayed";
  progress: number;
  eta?: string;
  notes?: string[];
  startDate?: Date;
  completionDate?: Date;
  priority?: "low" | "medium" | "high";
  dependencies?: string[]; // IDs of phases that must be completed first
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  collaborators?: Record<string, boolean>;
}

export interface ProductionTask {
  id: string;
  phaseId: string;
  projectId: string;
  name: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionNote {
  id: string;
  phaseId: string;
  projectId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

export interface ProductionCollaborator {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  role: string;
  email?: string;
  createdAt: Date;
}

// Service class
class ProductionProgressService {
  // Projects
  async getProjects(userId: string): Promise<ProductionProject[]> {
    try {
      // Query for projects created by the user
      const userProjectsQuery = query(
        collection(db, "production_projects"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      // Query for projects where user is a collaborator
      const collabProjectsQuery = query(
        collection(db, "production_projects"),
        where(`collaborators.${userId}`, "==", true),
        orderBy("createdAt", "desc")
      );
      
      // Fetch both sets of projects
      const [userSnapshot, collabSnapshot] = await Promise.all([
        getDocs(userProjectsQuery),
        getDocs(collabProjectsQuery)
      ]);
      
      // Combine projects, converting Firestore timestamps to Date objects
      const projects: ProductionProject[] = [];
      
      userSnapshot.forEach(doc => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate(),
          targetCompletionDate: data.targetCompletionDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as ProductionProject);
      });
      
      collabSnapshot.forEach(doc => {
        // Only add if not already added (to avoid duplicates)
        if (!projects.some(p => p.id === doc.id)) {
          const data = doc.data();
          projects.push({
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate(),
            targetCompletionDate: data.targetCompletionDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as ProductionProject);
        }
      });
      
      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  }
  
  async getProjectById(projectId: string): Promise<ProductionProject | null> {
    try {
      const docRef = doc(db, "production_projects", projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          startDate: data.startDate?.toDate(),
          targetCompletionDate: data.targetCompletionDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as ProductionProject;
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  }
  
  async createProject(projectData: Omit<ProductionProject, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const docRef = await addDoc(collection(db, "production_projects"), {
        ...projectData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  }
  
  async updateProject(projectId: string, updates: Partial<ProductionProject>): Promise<void> {
    try {
      const docRef = doc(db, "production_projects", projectId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }
  
  async deleteProject(projectId: string): Promise<void> {
    try {
      // Get all phases for this project
      const phasesQuery = query(
        collection(db, "production_phases"),
        where("projectId", "==", projectId)
      );
      const phasesSnapshot = await getDocs(phasesQuery);
      
      // Get all tasks for this project
      const tasksQuery = query(
        collection(db, "production_tasks"),
        where("projectId", "==", projectId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      
      // Get all notes for this project
      const notesQuery = query(
        collection(db, "production_notes"),
        where("projectId", "==", projectId)
      );
      const notesSnapshot = await getDocs(notesQuery);
      
      // Get all collaborators for this project
      const collabsQuery = query(
        collection(db, "production_collaborators"),
        where("projectId", "==", projectId)
      );
      const collabsSnapshot = await getDocs(collabsQuery);
      
      // Delete all related documents
      const batch = writeBatch(db);
      
      phasesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      notesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      collabsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the project
      const projectRef = doc(db, "production_projects", projectId);
      batch.delete(projectRef);
      
      // Commit all deletions
      await batch.commit();
    } catch (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  }
  
  // Phases
  async getPhasesByProjectId(projectId: string): Promise<ProductionPhase[]> {
    try {
      const phasesQuery = query(
        collection(db, "production_phases"),
        where("projectId", "==", projectId),
        orderBy("createdAt")
      );
      
      const snapshot = await getDocs(phasesQuery);
      const phases: ProductionPhase[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        phases.push({
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate(),
          completionDate: data.completionDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as ProductionPhase);
      });
      
      return phases;
    } catch (error) {
      console.error("Error fetching phases:", error);
      throw error;
    }
  }
  
  async createPhase(phaseData: Omit<ProductionPhase, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const docRef = await addDoc(collection(db, "production_phases"), {
        ...phaseData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating phase:", error);
      throw error;
    }
  }
  
  async updatePhase(phaseId: string, updates: Partial<ProductionPhase>): Promise<void> {
    try {
      const docRef = doc(db, "production_phases", phaseId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating phase:", error);
      throw error;
    }
  }
  
  async deletePhase(phaseId: string): Promise<void> {
    try {
      // Get all tasks for this phase
      const tasksQuery = query(
        collection(db, "production_tasks"),
        where("phaseId", "==", phaseId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      
      // Get all notes for this phase
      const notesQuery = query(
        collection(db, "production_notes"),
        where("phaseId", "==", phaseId)
      );
      const notesSnapshot = await getDocs(notesQuery);
      
      // Delete all related documents
      const batch = writeBatch(db);
      
      tasksSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      notesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the phase
      const phaseRef = doc(db, "production_phases", phaseId);
      batch.delete(phaseRef);
      
      // Commit all deletions
      await batch.commit();
    } catch (error) {
      console.error("Error deleting phase:", error);
      throw error;
    }
  }
  
  // Tasks
  async getTasksByPhaseId(phaseId: string): Promise<ProductionTask[]> {
    try {
      const tasksQuery = query(
        collection(db, "production_tasks"),
        where("phaseId", "==", phaseId),
        orderBy("createdAt")
      );
      
      const snapshot = await getDocs(tasksQuery);
      const tasks: ProductionTask[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          dueDate: data.dueDate?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as ProductionTask);
      });
      
      return tasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  }
  
  async createTask(taskData: Omit<ProductionTask, "id" | "createdAt" | "updatedAt">): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const docRef = await addDoc(collection(db, "production_tasks"), {
        ...taskData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }
  
  async updateTask(taskId: string, updates: Partial<ProductionTask>): Promise<void> {
    try {
      const docRef = doc(db, "production_tasks", taskId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }
  
  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "production_tasks", taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }
  
  // Notes
  async getNotesByPhaseId(phaseId: string): Promise<ProductionNote[]> {
    try {
      const notesQuery = query(
        collection(db, "production_notes"),
        where("phaseId", "==", phaseId),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(notesQuery);
      const notes: ProductionNote[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        } as ProductionNote);
      });
      
      return notes;
    } catch (error) {
      console.error("Error fetching notes:", error);
      throw error;
    }
  }
  
  async createNote(noteData: Omit<ProductionNote, "id" | "createdAt">): Promise<string> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const docRef = await addDoc(collection(db, "production_notes"), {
        ...noteData,
        createdBy: user.uid,
        createdByName: user.displayName || "Unknown User",
        createdAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  }
  
  async deleteNote(noteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "production_notes", noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  }
  
  // Collaborators
  async getCollaboratorsByProjectId(projectId: string): Promise<ProductionCollaborator[]> {
    try {
      const collabsQuery = query(
        collection(db, "production_collaborators"),
        where("projectId", "==", projectId),
        orderBy("createdAt")
      );
      
      const snapshot = await getDocs(collabsQuery);
      const collaborators: ProductionCollaborator[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        collaborators.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        } as ProductionCollaborator);
      });
      
      return collaborators;
    } catch (error) {
      console.error("Error fetching collaborators:", error);
      throw error;
    }
  }
  
  async addCollaborator(collaboratorData: Omit<ProductionCollaborator, "id" | "createdAt">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "production_collaborators"), {
        ...collaboratorData,
        createdAt: serverTimestamp()
      });
      
      // Also update the project's collaborators map
      const projectRef = doc(db, "production_projects", collaboratorData.projectId);
      await updateDoc(projectRef, {
        [`collaborators.${collaboratorData.userId}`]: true,
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error("Error adding collaborator:", error);
      throw error;
    }
  }
  
  async removeCollaborator(collaboratorId: string, projectId: string, userId: string): Promise<void> {
    try {
      // Delete the collaborator document
      await deleteDoc(doc(db, "production_collaborators", collaboratorId));
      
      // Update the project's collaborators map
      const projectRef = doc(db, "production_projects", projectId);
      await updateDoc(projectRef, {
        [`collaborators.${userId}`]: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      throw error;
    }
  }

  // Calculate phase completion percentage based on tasks
  calculatePhaseCompletion(tasks: ProductionTask[]): number {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
  }
  
  // Calculate overall project progress
  calculateProjectProgress(phases: ProductionPhase[]): number {
    if (phases.length === 0) return 0;
    
    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
    return Math.round(totalProgress / phases.length);
  }
}

export const productionProgressService = new ProductionProgressService();