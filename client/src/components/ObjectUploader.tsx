import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component that renders as a button and handles file uploads
 * directly to the object storage.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size
    if (file.size > maxFileSize) {
      alert(`El archivo es muy grande. El tamaño máximo es ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Get upload parameters
      const { method, url } = await onGetUploadParameters();

      // Upload file directly
      const response = await fetch(url, {
        method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (response.ok) {
        // Call onComplete with success result
        onComplete?.({
          successful: [{
            uploadURL: url.split('?')[0] // Remove query parameters
          }]
        });
      } else {
        throw new Error('Error al subir el archivo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error al subir el archivo. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <Button 
        onClick={handleButtonClick} 
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            Subiendo...
          </>
        ) : (
          children
        )}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
