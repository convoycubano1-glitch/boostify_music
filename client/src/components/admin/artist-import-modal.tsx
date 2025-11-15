import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Upload, FileJson, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ValidationResult {
  index: number;
  valid: boolean;
  data: any;
  warnings: string[];
  errors: string[];
}

interface ValidationResponse {
  success: boolean;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
  };
  results: ValidationResult[];
}

export function ArtistImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');

  const resetState = () => {
    setFile(null);
    setValidationResult(null);
    setStep('upload');
    setImporting(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleFile = async (selectedFile: File) => {
    const fileType = selectedFile.name.toLowerCase();
    
    if (!fileType.endsWith('.json') && !fileType.endsWith('.xlsx') && !fileType.endsWith('.xls')) {
      toast({
        title: 'Archivo no válido',
        description: 'Por favor sube un archivo JSON o Excel (.xlsx, .xls)',
        variant: 'destructive'
      });
      return;
    }

    setFile(selectedFile);
    await validateFile(selectedFile);
  };

  const validateFile = async (file: File) => {
    try {
      setStep('preview');
      const fileType = file.name.toLowerCase().endsWith('.json') ? 'json' : 'excel';
      
      let data: any;
      
      if (fileType === 'json') {
        const text = await file.text();
        data = JSON.parse(text);
      } else {
        // Para Excel, convertir a base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        data = base64;
      }

      const response = await apiRequest({
        url: '/api/admin/import-artists/validate',
        method: 'POST',
        data: { data, fileType }
      });

      setValidationResult(response as ValidationResponse);
      
      if (response.summary.valid === 0) {
        toast({
          title: 'Sin artistas válidos',
          description: 'No se encontraron artistas válidos para importar',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error validating file:', error);
      toast({
        title: 'Error al validar archivo',
        description: error.message || 'No se pudo procesar el archivo',
        variant: 'destructive'
      });
      setStep('upload');
    }
  };

  const handleImport = async () => {
    if (!validationResult) return;

    try {
      setImporting(true);
      setStep('importing');

      // Filtrar solo los artistas válidos
      const validArtists = validationResult.results
        .filter(r => r.valid)
        .map(r => r.data);

      const response = await apiRequest({
        url: '/api/admin/import-artists/import',
        method: 'POST',
        data: { 
          artists: validArtists,
          skipDuplicates: true 
        }
      });

      setStep('complete');
      
      toast({
        title: '¡Importación completada!',
        description: `${response.summary.imported} artistas importados exitosamente`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error importing artists:', error);
      toast({
        title: 'Error al importar',
        description: error.message || 'No se pudieron importar los artistas',
        variant: 'destructive'
      });
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        artistName: "Bad Bunny",
        email: "badbunny@example.com",
        realName: "Benito Antonio Martínez Ocasio",
        biography: "Artista de reggaeton y trap latino de Puerto Rico",
        profileImage: "https://example.com/badbunny.jpg",
        coverImage: "https://example.com/badbunny-cover.jpg",
        country: "Puerto Rico",
        location: "San Juan",
        genre: "Reggaeton",
        genres: ["Reggaeton", "Latin Trap", "Urban"],
        website: "https://badbunny.com",
        instagramHandle: "@badbunny",
        twitterHandle: "@badbunny",
        youtubeChannel: "BadBunnyPR",
        spotifyUrl: "https://open.spotify.com/artist/4q3ewBCX7sLwd24euuV69X",
        facebookUrl: "https://facebook.com/badbunny",
        tiktokUrl: "https://tiktok.com/@badbunny"
      }
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-artistas.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Artistas</DialogTitle>
          <DialogDescription>
            Sube un archivo JSON o Excel con información de artistas para importar a la base de datos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  data-testid="button-download-template"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Plantilla JSON
                </Button>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-zinc-700 hover:border-orange-500/50'
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".json,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-2">
                      Arrastra y suelta tu archivo aquí
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      o haz clic para seleccionar
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Badge variant="outline" className="gap-1">
                        <FileJson className="w-3 h-3" />
                        JSON
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <FileSpreadsheet className="w-3 h-3" />
                        Excel (.xlsx)
                      </Badge>
                    </div>
                  </div>
                </label>
              </div>

              <Card className="bg-zinc-900/50 border-orange-500/20">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">📋 Formato Requerido</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Campos requeridos:</strong> artistName, email</li>
                    <li>• <strong>Campos opcionales:</strong> realName, biography, profileImage, coverImage, country, location, genre, géneros, redes sociales, etc.</li>
                    <li>• <strong>Duplicados:</strong> Se saltarán artistas con email duplicado</li>
                    <li>• <strong>Slug:</strong> Se genera automáticamente desde el artistName</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'preview' && validationResult && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="grid grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{validationResult.summary.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-500">{validationResult.summary.valid}</div>
                    <div className="text-xs text-muted-foreground">Válidos</div>
                  </CardContent>
                </Card>
                <Card className="border-red-500/20 bg-red-500/5">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-500">{validationResult.summary.invalid}</div>
                    <div className="text-xs text-muted-foreground">Errores</div>
                  </CardContent>
                </Card>
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-500">{validationResult.summary.duplicates}</div>
                    <div className="text-xs text-muted-foreground">Duplicados</div>
                  </CardContent>
                </Card>
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-4 space-y-2">
                  {validationResult.results.map((result, idx) => (
                    <Card
                      key={idx}
                      className={`${
                        result.valid
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-red-500/30 bg-red-500/5'
                      }`}
                    >
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {result.valid ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="font-semibold">
                                {result.data.artistName || 'Sin nombre'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {result.data.email}
                            </div>
                          </div>
                          <Badge variant={result.valid ? 'default' : 'destructive'}>
                            {result.valid ? 'Válido' : 'Error'}
                          </Badge>
                        </div>

                        {result.warnings.length > 0 && (
                          <div className="flex items-start gap-2 text-sm text-yellow-500">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>{result.warnings.join(', ')}</div>
                          </div>
                        )}

                        {result.errors.length > 0 && (
                          <div className="flex items-start gap-2 text-sm text-red-500">
                            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>{result.errors.join(', ')}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetState();
                  }}
                  data-testid="button-cancel-import"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validationResult.summary.valid === 0 || importing}
                  className="flex-1"
                  data-testid="button-confirm-import"
                >
                  Importar {validationResult.summary.valid} Artistas
                </Button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-semibold">Importando artistas...</p>
              <p className="text-sm text-muted-foreground">Por favor espera</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-lg font-semibold">¡Importación completada!</p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  resetState();
                }}
                data-testid="button-close-import"
              >
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
