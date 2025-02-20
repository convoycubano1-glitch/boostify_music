import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { translateText, detectLanguage, getTranslationHistory } from "@/lib/api/translation-service";
import { useToast } from "@/hooks/use-toast";
import { Languages, ArrowRight, Loader2, History, ChevronDown } from "lucide-react";
import { debounce } from "lodash";
import { useQuery } from "@tanstack/react-query";
import type { SelectTranslation } from "@db/schema";

const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Español" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
];

export function RealTimeTranslator() {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  // Query for translation history
  const { data: translationHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['translations'],
    queryFn: getTranslationHistory,
  });

  const debouncedTranslate = debounce(async (text: string) => {
    if (!text.trim()) {
      setTranslatedText("");
      return;
    }

    try {
      setIsTranslating(true);
      const response = await translateText({
        text,
        targetLanguage,
      });
      setTranslatedText(response.translatedText);
    } catch (error) {
      toast({
        title: "Error de traducción",
        description: error instanceof Error ? error.message : "No se pudo traducir el texto",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  }, 500);

  useEffect(() => {
    debouncedTranslate(inputText);
    return () => debouncedTranslate.cancel();
  }, [inputText, targetLanguage]);

  const handleDetectLanguage = async () => {
    if (!inputText.trim()) return;

    try {
      const detected = await detectLanguage(inputText);
      const languageName = SUPPORTED_LANGUAGES.find(lang => lang.code === detected)?.name || detected;
      toast({
        title: "Idioma detectado",
        description: `El texto está en ${languageName}`,
      });
      setDetectedLanguage(detected);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo detectar el idioma",
        variant: "destructive",
      });
    }
  };

  const handleHistoryItemClick = (item: SelectTranslation) => {
    setInputText(item.sourceText);
    setTargetLanguage(item.targetLanguage);
    setTranslatedText(item.translatedText);
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Texto original</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDetectLanguage}
                disabled={!inputText.trim()}
              >
                <Languages className="w-4 h-4 mr-2" />
                Detectar idioma
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4 mr-2" />
                Historial
              </Button>
            </div>
          </div>
          <Textarea
            placeholder="Escribe o pega el texto aquí..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Seleccionar idioma" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            {isTranslating && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Traducción</h3>
          <div className="min-h-[100px] p-4 rounded-md bg-muted">
            {translatedText || (
              <span className="text-muted-foreground">
                La traducción aparecerá aquí...
              </span>
            )}
          </div>
        </div>

        {showHistory && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historial de traducciones</h3>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {isLoadingHistory ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : translationHistory.length > 0 ? (
                translationHistory.map((item) => (
                  <Card
                    key={item.id}
                    className="p-3 cursor-pointer hover:bg-accent"
                    onClick={() => handleHistoryItemClick(item)}
                  >
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{item.sourceText.substring(0, 100)}...</p>
                      <p className="text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()} - {item.sourceLanguage} → {item.targetLanguage}
                      </p>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground">
                  No hay traducciones guardadas
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}