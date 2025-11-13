import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Sparkles, Palette, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ImageEditorModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | undefined;
  originalPrompt?: string;
  onImageEdited: (newImageUrl: string, newPrompt: string) => void;
}

export function ImageEditorModal({
  open,
  onClose,
  imageUrl,
  originalPrompt = '',
  onImageEdited,
}: ImageEditorModalProps) {
  const { toast } = useToast();
  const [editInstructions, setEditInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState('');

  const handleEditImage = async () => {
    if (!editInstructions.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter editing instructions',
        variant: 'destructive',
      });
      return;
    }

    if (!imageUrl) {
      toast({
        title: 'Error',
        description: 'No image to edit',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/gemini-image/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          editInstructions,
          originalPrompt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to edit image');
      }

      const data = await response.json();
      
      setPreviewUrl(data.imageUrl);
      setEditedPrompt(data.prompt || editInstructions);
      
      toast({
        title: 'Image edited successfully',
        description: 'Preview your edited image below',
      });
    } catch (error) {
      console.error('Error editing image:', error);
      toast({
        title: 'Error editing image',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (previewUrl) {
      onImageEdited(previewUrl, editedPrompt);
      handleClose();
    }
  };

  const handleClose = () => {
    setEditInstructions('');
    setPreviewUrl(null);
    setEditedPrompt('');
    onClose();
  };

  const quickEditButtons = [
    { label: 'Make it cinematic', icon: Sparkles, instruction: 'Make this image more cinematic with dramatic lighting and professional color grading' },
    { label: 'Add dramatic lighting', icon: Zap, instruction: 'Add dramatic lighting effects with strong contrast and shadows' },
    { label: 'Enhance colors', icon: Palette, instruction: 'Enhance and saturate the colors to make them more vibrant and eye-catching' },
    { label: 'Add motion blur', icon: Wand2, instruction: 'Add subtle motion blur to create a sense of movement and energy' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Edit Image with Nano Banana AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Before/After Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Original</Badge>
              </div>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Original"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No image</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={previewUrl ? 'bg-green-500/10 border-green-500' : ''}>
                  {previewUrl ? 'Edited' : 'Preview'}
                </Badge>
              </div>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Edited"
                  className="w-full h-64 object-cover rounded-lg border border-green-500"
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Edited image will appear here</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Quick Edit Buttons */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Edits</label>
            <div className="grid grid-cols-2 gap-2">
              {quickEditButtons.map((btn) => (
                <Button
                  key={btn.label}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => setEditInstructions(btn.instruction)}
                  disabled={isProcessing}
                  data-testid={`button-quick-edit-${btn.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <btn.icon className="h-4 w-4 mr-2" />
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Custom Edit Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Edit Instructions</label>
            <Textarea
              placeholder="Describe how you want to edit the image... (e.g., 'Make it darker and add dramatic lighting', 'Change to black and white', 'Add a vintage film look')"
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              rows={4}
              disabled={isProcessing}
              data-testid="textarea-edit-instructions"
            />
          </div>

          {/* Original Prompt (if available) */}
          {originalPrompt && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Original Prompt</label>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {originalPrompt}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            
            {previewUrl && (
              <Button
                variant="secondary"
                onClick={() => {
                  setPreviewUrl(null);
                  setEditedPrompt('');
                }}
                disabled={isProcessing}
                data-testid="button-reset-edit"
              >
                Reset
              </Button>
            )}

            <Button
              onClick={previewUrl ? handleApply : handleEditImage}
              disabled={isProcessing || !editInstructions.trim()}
              data-testid={previewUrl ? 'button-apply-edit' : 'button-generate-edit'}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : previewUrl ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply Changes
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Edit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
