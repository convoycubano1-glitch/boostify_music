/**
 * Este es un archivo temporal con la solución para la función updateWorkflowData
 * 
 * Solución para corregir los problemas en el editor-context.tsx:
 * 
 * 1. Al inicio del archivo, después de importar los tipos:
 */

// Definimos una interfaz para WorkflowData para mayor tipado
export interface WorkflowData {
  steps?: { id: string; status: 'pending' | 'in-progress' | 'completed' | 'skipped'; timestamp?: Date }[];
  activeTimeline?: boolean;
  timelineProgress?: number;
  [key: string]: any; // Para permitir campos adicionales específicos
}

/**
 * 2. Actualizar la declaración de workflowData en EditorContextType:
 */
updateWorkflowData: (data: Partial<WorkflowData>) => void;
workflowData: WorkflowData; // Estado de datos del workflow

/**
 * 3. Eliminar la definición redundante de WorkflowData dentro de EditorProvider
 * y reemplazarla con:
 */
// Estado para manejar datos del workflow separados del estado principal
const [workflowData, setWorkflowData] = useState<WorkflowData>({});

/**
 * 4. Reemplazar la implementación de updateWorkflowData por:
 */
/**
 * Actualiza los datos del flujo de trabajo
 * @param data Datos del flujo de trabajo a actualizar
 */
const updateWorkflowData = useCallback((data: Partial<WorkflowData>) => {
  // Actualizamos el estado local para workflowData
  setWorkflowData((prevData: WorkflowData) => ({
    ...prevData,
    ...data
  }));
  
  // También actualizamos los datos en el proyecto si es necesario
  if (state.project) {
    updateProject(prevProject => {
      if (!prevProject) return null;
      
      return {
        ...prevProject,
        // Añadimos un objeto workflowData al proyecto con la información actualizada
        workflowData: {
          ...(prevProject.workflowData || {}),
          ...data
        }
      };
    });
  }
}, [updateProject, state.project]);