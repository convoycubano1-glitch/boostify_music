/**
 * Componente CharacterDialogueEditor
 * Editor para añadir y configurar diálogos de personajes en la escena
 */
import React, { useState } from 'react';
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import { 
  MessageCircle, 
  Users, 
  Volume, 
  VolumeX,
  Mic
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible";
import { Switch } from "../../ui/switch";

interface CharacterDialogueEditorProps {
  characterName?: string;
  dialogue?: string;
  onUpdate: (dialogue: string, characterName?: string) => void;
}

export function CharacterDialogueEditor({ 
  characterName = '', 
  dialogue = '', 
  onUpdate 
}: CharacterDialogueEditorProps) {
  const [isOpen, setIsOpen] = useState(Boolean(dialogue));
  const [localName, setLocalName] = useState(characterName);
  const [localDialogue, setLocalDialogue] = useState(dialogue);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    setLocalName(name);
    onUpdate(localDialogue, name);
  };
  
  const handleDialogueChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setLocalDialogue(text);
    onUpdate(text, localName);
  };
  
  const toggleAudio = () => {
    setAudioEnabled(prev => !prev);
  };
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-md border p-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <Label className="text-sm font-medium">Character Dialogue</Label>
        </div>
        
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isOpen ? "Hide" : "Add Dialogue"}
          </Button>
        </CollapsibleTrigger>
      </div>
      
      <CollapsibleContent className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Character Name</Label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input
                value={localName}
                onChange={handleNameChange}
                className="h-8"
                placeholder="e.g. Narrator, Main Character, etc."
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs">Voice Audio</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={audioEnabled}
                  onCheckedChange={toggleAudio}
                  id="audio-enabled"
                />
                <Label htmlFor="audio-enabled" className="text-xs cursor-pointer">
                  {audioEnabled ? (
                    <div className="flex items-center gap-1">
                      <Volume className="h-3 w-3" />
                      <span>Enabled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <VolumeX className="h-3 w-3" />
                      <span>Disabled</span>
                    </div>
                  )}
                </Label>
              </div>
            </div>
            
            {audioEnabled && (
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs w-full"
                  disabled={!localDialogue}
                >
                  <Mic className="h-3 w-3 mr-1" />
                  Generate Voice
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs">Dialogue Text</Label>
          <Textarea
            value={localDialogue}
            onChange={handleDialogueChange}
            className="min-h-[80px] resize-none"
            placeholder="Add character dialogue or narration text here..."
          />
        </div>
        
        {localDialogue && (
          <div className="rounded-md bg-muted p-2 text-xs space-y-1">
            <p className="font-medium">{localName || "Character"}</p>
            <p className="text-muted-foreground italic">"{localDialogue}"</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}