import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { TimelineItem } from '../../components/timeline/TimelineClipUnified';

/**
 * Interface for Music Video Project
 */
export interface MusicVideoProject {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Project data
  audioUrl: string;
  audioFile?: File;
  timelineItems: TimelineItem[];
  artistReferences: string[];
  editingStyle: string;
  // Metadata
  totalScenes: number;
  generatedImages: number;
  generatedVideos: number;
  duration: number;
}

/**
 * Music Video Project Service
 * Handles saving and loading projects from Firestore
 */
class MusicVideoProjectService {
  private collectionName = 'musicVideoProjects';

  /**
   * Save a project to Firestore
   */
  async saveProject(
    userId: string,
    projectName: string,
    projectData: {
      audioUrl: string;
      timelineItems: TimelineItem[];
      artistReferences: string[];
      editingStyle: string;
      duration: number;
    },
    projectId?: string
  ): Promise<string> {
    try {
      const id = projectId || doc(collection(db, this.collectionName)).id;
      const now = new Date();

      // Count generated images and videos
      const generatedImages = projectData.timelineItems.filter(
        item => item.generatedImage || item.firebaseUrl
      ).length;
      
      const generatedVideos = projectData.timelineItems.filter(
        item => item.videoUrl || item.metadata?.lipsync?.videoUrl
      ).length;

      const project: MusicVideoProject = {
        id,
        name: projectName,
        userId,
        createdAt: projectId ? (await this.getProject(projectId))?.createdAt || now : now,
        updatedAt: now,
        audioUrl: projectData.audioUrl,
        timelineItems: projectData.timelineItems,
        artistReferences: projectData.artistReferences,
        editingStyle: projectData.editingStyle,
        totalScenes: projectData.timelineItems.length,
        generatedImages,
        generatedVideos,
        duration: projectData.duration
      };

      await setDoc(doc(db, this.collectionName, id), {
        ...project,
        createdAt: Timestamp.fromDate(project.createdAt),
        updatedAt: Timestamp.fromDate(project.updatedAt)
      });

      console.log(`✅ Project saved: ${projectName} (${id})`);
      return id;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  /**
   * Load a project from Firestore
   */
  async getProject(projectId: string): Promise<MusicVideoProject | null> {
    try {
      const docRef = doc(db, this.collectionName, projectId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as MusicVideoProject;
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<MusicVideoProject[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as MusicVideoProject;
      });
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, projectId));
      console.log(`✅ Project deleted: ${projectId}`);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  /**
   * Auto-save project (debounced)
   */
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  autoSave(
    userId: string,
    projectName: string,
    projectData: Parameters<typeof this.saveProject>[2],
    projectId?: string,
    delay = 5000
  ): void {
    const key = projectId || 'temp';
    
    // Clear existing timer
    if (this.autoSaveTimers.has(key)) {
      clearTimeout(this.autoSaveTimers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.saveProject(userId, projectName, projectData, projectId)
        .then(() => console.log('✅ Auto-saved project'))
        .catch(err => console.error('Error auto-saving:', err));
      this.autoSaveTimers.delete(key);
    }, delay);

    this.autoSaveTimers.set(key, timer);
  }
}

export const musicVideoProjectService = new MusicVideoProjectService();
