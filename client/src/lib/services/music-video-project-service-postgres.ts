import type { TimelineItem } from '../../components/timeline/TimelineClipUnified';

/**
 * Interface for Music Video Project (PostgreSQL version)
 */
export interface MusicVideoProjectPostgres {
  id: string;
  userId: string;
  projectName: string;
  audioUrl?: string;
  audioDuration?: number;
  transcription?: string;
  scriptContent?: string;
  timelineItems: any[];
  selectedDirector?: {
    id: string;
    name: string;
    specialty: string;
    style: string;
    experience: string;
  };
  videoStyle?: {
    cameraFormat: string;
    mood: string;
    characterStyle: string;
    colorPalette: string;
    visualIntensity: number;
    narrativeIntensity: number;
    selectedDirector: any;
  };
  artistReferenceImages?: string[];
  selectedEditingStyle?: {
    id: string;
    name: string;
    description: string;
    duration: { min: number; max: number };
  };
  status: "draft" | "generating_script" | "generating_images" | "generating_videos" | "completed";
  progress?: {
    scriptGenerated: boolean;
    imagesGenerated: number;
    totalImages: number;
    videosGenerated: number;
    totalVideos: number;
  };
  lastModified: string;
  createdAt: string;
  tags?: string[];
}

/**
 * Music Video Project Service (PostgreSQL Backend)
 */
class MusicVideoProjectServicePostgres {
  private baseUrl = '/api/music-video-projects';

  /**
   * Save a project to PostgreSQL
   */
  async saveProject(projectData: {
    userId: string;
    projectName: string;
    audioUrl?: string;
    audioDuration?: number;
    transcription?: string;
    scriptContent?: string;
    timelineItems: TimelineItem[];
    selectedDirector?: any;
    videoStyle?: any;
    artistReferenceImages?: string[];
    selectedEditingStyle?: any;
    status?: "draft" | "generating_script" | "generating_images" | "generating_videos" | "completed";
    progress?: {
      scriptGenerated: boolean;
      imagesGenerated: number;
      totalImages: number;
      videosGenerated: number;
      totalVideos: number;
    };
    tags?: string[];
  }): Promise<{ success: boolean; project: MusicVideoProjectPostgres; isNew: boolean }> {
    try {
      console.log('💾 Guardando proyecto:', projectData.projectName);
      
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Proyecto guardado:', result.project.id);
      
      return result;
    } catch (error) {
      console.error('❌ Error guardando proyecto:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId: string): Promise<MusicVideoProjectPostgres[]> {
    try {
      console.log('📋 Cargando proyectos para userId:', userId);
      
      const response = await fetch(`${this.baseUrl}/list/${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Encontrados ${result.projects.length} proyectos`);
      
      return result.projects;
    } catch (error) {
      console.error('❌ Error cargando proyectos:', error);
      throw error;
    }
  }

  /**
   * Load a specific project
   */
  async getProject(projectId: string): Promise<MusicVideoProjectPostgres | null> {
    try {
      console.log('📂 Cargando proyecto:', projectId);
      
      const response = await fetch(`${this.baseUrl}/load/${projectId}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Proyecto cargado:', result.project.projectName);
      
      return result.project;
    } catch (error) {
      console.error('❌ Error cargando proyecto:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      console.log('🗑️ Eliminando proyecto:', projectId);
      
      const response = await fetch(`${this.baseUrl}/delete/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Proyecto eliminado');
    } catch (error) {
      console.error('❌ Error eliminando proyecto:', error);
      throw error;
    }
  }

  /**
   * Auto-save project (debounced)
   */
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  autoSave(
    projectData: Parameters<typeof this.saveProject>[0],
    delay = 5000
  ): void {
    const key = `${projectData.userId}-${projectData.projectName}`;
    
    // Clear existing timer
    if (this.autoSaveTimers.has(key)) {
      clearTimeout(this.autoSaveTimers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.saveProject(projectData)
        .then(() => console.log('✅ Auto-guardado exitoso:', projectData.projectName))
        .catch(err => console.error('❌ Error en auto-guardado:', err));
      this.autoSaveTimers.delete(key);
    }, delay);

    this.autoSaveTimers.set(key, timer);
  }
}

export const musicVideoProjectServicePostgres = new MusicVideoProjectServicePostgres();
