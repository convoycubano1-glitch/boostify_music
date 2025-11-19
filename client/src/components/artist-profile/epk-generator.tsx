import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/use-toast';
import { FileText, Download, Sparkles, Loader2, Image as ImageIcon, Quote, Award, FileCheck } from 'lucide-react';
import { Separator } from '../ui/separator';

interface EPKData {
  artistName: string;
  realName?: string;
  genre: string[];
  location?: string;
  biography: string;
  oneLineBio?: string;
  shortBio?: string;
  artistQuote?: string;
  achievements: string[];
  factSheet: { label: string; value: string }[];
  profileImage?: string;
  coverImage?: string;
  pressPhotos: { url: string; caption: string }[];
  socialLinks: {
    spotify?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  pressRelease?: string;
}

export function EPKGenerator() {
  const { toast } = useToast();
  const [generatedEPK, setGeneratedEPK] = useState<EPKData | null>(null);

  const generateEPKMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: '/api/epk/generate',
        method: 'POST',
        data: {}
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.success && data.epk) {
        setGeneratedEPK(data.epk);
        toast({
          title: '✨ EPK generado exitosamente',
          description: 'Tu Electronic Press Kit profesional está listo',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al generar EPK',
        variant: 'destructive',
      });
    },
  });

  const handleDownloadPDF = () => {
    if (!generatedEPK) return;
    
    toast({
      title: 'Descarga de PDF',
      description: 'Próximamente: Exportación a PDF profesional',
    });
  };

  const handleDownloadJSON = () => {
    if (!generatedEPK) return;
    
    const dataStr = JSON.stringify(generatedEPK, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${generatedEPK.artistName}-EPK.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'EPK descargado',
      description: 'Archivo JSON guardado exitosamente',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generador de EPK Profesional
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Genera un Electronic Press Kit completo y profesional usando IA. Incluye biografía mejorada, 
            logros, citas del artista, fact sheet y fotos de prensa coherentes con tu estilo musical.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => generateEPKMutation.mutate()}
            disabled={generateEPKMutation.isPending}
            size="lg"
            className="w-full"
            data-testid="button-generate-epk"
          >
            {generateEPKMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generando EPK con IA...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generar EPK Profesional
              </>
            )}
          </Button>

          {generateEPKMutation.isPending && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Generando tu EPK profesional...</p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>✓ Analizando tu perfil de artista</li>
                <li>✓ Generando biografía profesional con IA</li>
                <li>✓ Creando logros y citas inspiradoras</li>
                <li>✓ Generando fotos de prensa coherentes (Nano Banana)</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedEPK && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>EPK Preview</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadJSON}
                    data-testid="button-download-json"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDownloadPDF}
                    data-testid="button-download-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF (Próximamente)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{generatedEPK.artistName}</h1>
                {generatedEPK.realName && (
                  <p className="text-muted-foreground">{generatedEPK.realName}</p>
                )}
                <div className="flex items-center justify-center gap-2 text-sm">
                  {generatedEPK.genre.map((g, i) => (
                    <span key={i} className="bg-primary/10 text-primary px-2 py-1 rounded">
                      {g}
                    </span>
                  ))}
                </div>
                {generatedEPK.location && (
                  <p className="text-sm text-muted-foreground">📍 {generatedEPK.location}</p>
                )}
              </div>

              <Separator />

              {/* One-Line Bio */}
              {generatedEPK.oneLineBio && (
                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="text-lg font-medium text-center italic">
                    "{generatedEPK.oneLineBio}"
                  </p>
                </div>
              )}

              {/* Short Bio */}
              {generatedEPK.shortBio && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Short Bio
                  </h3>
                  <p className="text-sm leading-relaxed">{generatedEPK.shortBio}</p>
                </div>
              )}

              {/* Artist Quote */}
              {generatedEPK.artistQuote && (
                <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
                  <Quote className="h-5 w-5 text-primary mb-2" />
                  <p className="text-sm italic">"{generatedEPK.artistQuote}"</p>
                  <p className="text-xs text-muted-foreground mt-2">— {generatedEPK.artistName}</p>
                </div>
              )}

              <Separator />

              {/* Press Release / Full Bio */}
              {generatedEPK.pressRelease && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Press Release Biography
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    {generatedEPK.pressRelease.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="text-sm leading-relaxed mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Achievements */}
              {generatedEPK.achievements && generatedEPK.achievements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Key Achievements & Highlights
                  </h3>
                  <ul className="space-y-2">
                    {generatedEPK.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-1">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fact Sheet */}
              {generatedEPK.factSheet && generatedEPK.factSheet.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Fact Sheet</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {generatedEPK.factSheet.map((fact, i) => (
                      <div key={i} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium">{fact.label}</p>
                        <p className="text-sm font-semibold">{fact.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Press Photos */}
              {generatedEPK.pressPhotos && generatedEPK.pressPhotos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Press Photos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generatedEPK.pressPhotos.map((photo, i) => (
                      <div key={i} className="space-y-2">
                        <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                          <img
                            src={photo.url}
                            alt={photo.caption}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{photo.caption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {generatedEPK.socialLinks && Object.keys(generatedEPK.socialLinks).some(key => generatedEPK.socialLinks[key as keyof typeof generatedEPK.socialLinks]) && (
                <div>
                  <h3 className="font-semibold mb-3">Links & Contacts</h3>
                  <div className="flex flex-wrap gap-2">
                    {generatedEPK.socialLinks.spotify && (
                      <a
                        href={generatedEPK.socialLinks.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded hover:bg-green-500/20"
                      >
                        Spotify
                      </a>
                    )}
                    {generatedEPK.socialLinks.instagram && (
                      <a
                        href={generatedEPK.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-pink-500/10 text-pink-500 px-3 py-1 rounded hover:bg-pink-500/20"
                      >
                        Instagram
                      </a>
                    )}
                    {generatedEPK.socialLinks.youtube && (
                      <a
                        href={generatedEPK.socialLinks.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded hover:bg-red-500/20"
                      >
                        YouTube
                      </a>
                    )}
                    {generatedEPK.socialLinks.tiktok && (
                      <a
                        href={generatedEPK.socialLinks.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-500/10 text-slate-500 px-3 py-1 rounded hover:bg-slate-500/20"
                      >
                        TikTok
                      </a>
                    )}
                    {generatedEPK.socialLinks.facebook && (
                      <a
                        href={generatedEPK.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded hover:bg-blue-500/20"
                      >
                        Facebook
                      </a>
                    )}
                    {generatedEPK.socialLinks.website && (
                      <a
                        href={generatedEPK.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-primary/10 text-primary px-3 py-1 rounded hover:bg-primary/20"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
