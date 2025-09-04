import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SharePetModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  petName: string;
}

export default function SharePetModal({ isOpen, onClose, petId, petName }: SharePetModalProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/share/pet/${petId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace se ha copiado al portapapeles",
      });
      
      // Reset copied state after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${petName}`,
          text: `¡Conoce a ${petName}! Mira su perfil completo con fotos y información.`,
          url: shareUrl,
        });
      } catch (error) {
        // User canceled sharing or error occurred
        console.log('Sharing canceled or failed');
      }
    } else {
      // Fallback to copying link
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="share-pet-description">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center space-x-2">
            <i className="fas fa-share text-primary"></i>
            <span>Compartir perfil de {petName}</span>
          </DialogTitle>
          <DialogDescription>
            Comparte el perfil público de {petName} con tus amigos y familiares
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* URL Display */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  Enlace público:
                </p>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {shareUrl}
                </p>
              </div>
            </div>
          </div>

          {/* Preview Card */}
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <i className="fas fa-paw text-primary"></i>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{petName}</h4>
                <p className="text-sm text-muted-foreground">
                  Perfil público con fotos y descripción
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleCopyLink}
              className="w-full"
              data-testid="button-copy-link"
            >
              <i className={`mr-2 ${copied ? 'fas fa-check' : 'fas fa-copy'}`}></i>
              {copied ? '¡Copiado!' : 'Copiar enlace'}
            </Button>
            
            {navigator.share && (
              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full"
                data-testid="button-share-native"
              >
                <i className="fas fa-share-alt mr-2"></i>
                Compartir
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full"
              data-testid="button-close-modal"
            >
              Cerrar
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              <i className="fas fa-lock mr-1"></i>
              Este enlace es público y no requiere registro
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}