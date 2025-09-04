import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  familyId: string;
}

export default function QRCodeGenerator({ familyId }: QRCodeGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch QR code data
  const { data: qrData, isLoading } = useQuery({
    queryKey: ["/api/families", familyId, "qr"],
    enabled: !!familyId,
    retry: false,
  });

  const handleDownloadQR = async () => {
    if (!qrData?.qrCode) return;

    try {
      setIsGenerating(true);
      
      // Create a temporary link to download the QR code
      const link = document.createElement('a');
      link.href = qrData.qrCode;
      link.download = `pet-family-invite-${familyId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Éxito",
        description: "Código QR descargado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el código QR",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFamilyId = () => {
    if (!qrData?.inviteData?.familyId) return;

    navigator.clipboard.writeText(qrData.inviteData.familyId).then(() => {
      toast({
        title: "Copiado",
        description: "ID de familia copiado al portapapeles",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "No se pudo copiar el ID",
        variant: "destructive",
      });
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Generando código QR...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* QR Code Display */}
      <div className="bg-white p-6 rounded-xl border-2 border-dashed border-muted">
        {qrData?.qrCode ? (
          <div className="flex justify-center">
            <img 
              src={qrData.qrCode} 
              alt="Código QR de invitación familiar"
              className="w-48 h-48"
              data-testid="img-qr-code"
            />
          </div>
        ) : (
          <div className="w-48 h-48 mx-auto flex items-center justify-center">
            <div className="text-center">
              <i className="fas fa-qrcode text-6xl text-muted-foreground mb-2"></i>
              <p className="text-sm text-muted-foreground">Error generando QR</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">ID de Familia</label>
          <div className="flex items-center space-x-2 mt-1">
            <code className="flex-1 bg-muted p-2 rounded-lg text-sm font-mono" data-testid="text-family-id">
              {qrData?.inviteData?.familyId || familyId}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFamilyId}
              className="bg-primary/10 text-primary hover:bg-primary/20"
              data-testid="button-copy-family-id"
            >
              <i className="fas fa-copy"></i>
            </Button>
          </div>
        </div>
        
        <Button
          onClick={handleDownloadQR}
          disabled={!qrData?.qrCode || isGenerating}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          data-testid="button-download-qr"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Descargando...
            </>
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>
              Descargar QR
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
