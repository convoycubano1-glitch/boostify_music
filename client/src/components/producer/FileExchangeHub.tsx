import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, RefreshCcw, FolderOpen } from "lucide-react";

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
}

export function FileExchangeHub() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Simulate file upload progress
    Array.from(files).forEach((file) => {
      const newUpload: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: "uploading"
      };

      setUploads(prev => [...prev, newUpload]);

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          setUploads(prev => 
            prev.map(upload => 
              upload.fileName === file.name 
                ? { ...upload, progress } 
                : upload
            )
          );
        } else {
          clearInterval(interval);
          setUploads(prev =>
            prev.map(upload =>
              upload.fileName === file.name
                ? { ...upload, status: "completed" }
                : upload
            )
          );
        }
      }, 500);
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Intercambio de Proyectos</h3>
          <p className="text-sm text-muted-foreground">
            Comparte archivos de ProTools, Cubase y más
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSyncStatus("syncing")}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Sincronizar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Descargar Todo
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative border-2 border-dashed rounded-lg p-6 text-center">
          <input
            type="file"
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileUpload}
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Soporta archivos .ptx, .cpr, .logic, .aup y más
          </p>
        </div>

        {uploads.length > 0 && (
          <div className="space-y-3">
            {uploads.map((upload, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{upload.fileName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {upload.status === "completed" ? "Completado" : `${upload.progress}%`}
                  </span>
                </div>
                <Progress value={upload.progress} className="h-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
