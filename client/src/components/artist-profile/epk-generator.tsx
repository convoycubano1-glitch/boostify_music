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
  referenceImage?: string;
  pressPhotos: { url: string; caption: string }[];
  socialLinks: {
    spotify?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  boostifyLinks?: {
    profile?: string;
    mainSong?: {
      name: string;
      url: string;
    };
    mainVideo?: {
      title: string;
      url: string;
    };
  };
  pressRelease?: string;
}

interface EPKGeneratorProps {
  artistId?: string | number;
}

export function EPKGenerator({ artistId }: EPKGeneratorProps) {
  const { toast } = useToast();
  const [generatedEPK, setGeneratedEPK] = useState<EPKData | null>(null);

  const generateEPKMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: '/api/epk/generate',
        method: 'POST',
        data: { artistId: artistId ? String(artistId) : undefined }
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
              {/* Hero Section with Professional Image */}
              <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/20">
                {(generatedEPK.coverImage || generatedEPK.profileImage || generatedEPK.referenceImage) && (
                  <img
                    src={generatedEPK.coverImage || generatedEPK.profileImage || generatedEPK.referenceImage}
                    alt={`${generatedEPK.artistName} Hero`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end">
                  <div className="p-8 w-full">
                    <h1 className="text-5xl font-bold text-white mb-2">{generatedEPK.artistName}</h1>
                    {generatedEPK.realName && (
                      <p className="text-xl text-white/80 mb-3">{generatedEPK.realName}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {generatedEPK.genre.map((g, i) => (
                        <span key={i} className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                          {g}
                        </span>
                      ))}
                      {generatedEPK.location && (
                        <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                          📍 {generatedEPK.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Boostify Links Section */}
              {generatedEPK.boostifyLinks && (generatedEPK.boostifyLinks.profile || generatedEPK.boostifyLinks.mainSong || generatedEPK.boostifyLinks.mainVideo) && (
                <div className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 rounded-lg p-4 border border-orange-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    Escucha & Mira en Boostify
                  </h3>
                  <div className="space-y-2">
                    {generatedEPK.boostifyLinks.profile && (
                      <a
                        href={generatedEPK.boostifyLinks.profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 px-4 py-2 rounded transition-colors"
                      >
                        🎤 Perfil Completo en Boostify
                      </a>
                    )}
                    {generatedEPK.boostifyLinks.mainSong && generatedEPK.boostifyLinks.mainSong.url && (
                      <a
                        href={generatedEPK.boostifyLinks.profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm bg-green-500/10 hover:bg-green-500/20 text-green-500 px-4 py-2 rounded transition-colors"
                      >
                        🎵 {generatedEPK.boostifyLinks.mainSong.name}
                      </a>
                    )}
                    {generatedEPK.boostifyLinks.mainVideo && generatedEPK.boostifyLinks.mainVideo.url && (
                      <a
                        href={generatedEPK.boostifyLinks.profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded transition-colors"
                      >
                        🎬 {generatedEPK.boostifyLinks.mainVideo.title}
                      </a>
                    )}
                  </div>
                </div>
              )}

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
