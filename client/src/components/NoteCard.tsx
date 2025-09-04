import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

interface NoteCardProps {
  note: any; // Note with author and pet populated
  showPetName?: boolean;
}

export default function NoteCard({ note, showPetName = false }: NoteCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/notes/${note.id}`);
    },
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/pets", note.petId, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      
      toast({
        title: "Éxito",
        description: "Nota eliminada correctamente",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo eliminar la nota",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta nota?")) {
      deleteNoteMutation.mutate();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moods = {
      'muy_feliz': '😸',
      'feliz': '😊',
      'normal': '😐',
      'triste': '😔',
      'enfermo': '🤒',
    };
    return moods[mood as keyof typeof moods] || '';
  };

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow" data-testid={`card-note-${note.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-xl ${
              note.type === 'veterinary' 
                ? 'bg-primary/20 text-primary' 
                : 'bg-secondary/20 text-secondary'
            }`}>
              <i className={`fas ${
                note.type === 'veterinary' ? 'fa-stethoscope' : 'fa-sticky-note'
              } text-lg`}></i>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground" data-testid={`text-note-title-${note.id}`}>
                  {note.title}
                </h3>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  note.type === 'veterinary' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary/10 text-secondary'
                }`}>
                  {note.type === 'veterinary' ? 'Veterinaria' : 'Cotidiana'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                {showPetName && note.pet && (
                  <>
                    <span className="flex items-center">
                      <i className="fas fa-paw mr-1"></i>
                      <span data-testid={`text-note-pet-${note.id}`}>{note.pet.name}</span>
                    </span>
                  </>
                )}
                <span className="flex items-center">
                  <i className="fas fa-calendar mr-1"></i>
                  <span data-testid={`text-note-date-${note.id}`}>
                    {formatDate(note.date)}
                  </span>
                </span>
                <span className="flex items-center">
                  <i className="fas fa-user mr-1"></i>
                  <span data-testid={`text-note-author-${note.id}`}>
                    {note.author?.firstName || note.author?.email || 'Usuario'}
                  </span>
                </span>
              </div>
              
              <p className="text-muted-foreground mb-3" data-testid={`text-note-content-${note.id}`}>
                {note.content}
              </p>
              
              {/* Veterinary-specific information */}
              {note.type === 'veterinary' && (
                <div className="space-y-2">
                  {note.vetName && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <i className="fas fa-user-md mr-2"></i>
                      <span>{note.vetName} {note.vetClinic && `- ${note.vetClinic}`}</span>
                    </div>
                  )}
                  
                  {note.vaccinations && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-foreground mb-2">Vacunas Aplicadas:</p>
                      <p className="text-sm text-muted-foreground">{note.vaccinations}</p>
                    </div>
                  )}
                  
                  {note.medications && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-foreground mb-2">Medicamentos:</p>
                      <p className="text-sm text-muted-foreground">{note.medications}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Daily note-specific information */}
              {note.type === 'daily' && note.mood && (
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-sm font-medium text-foreground">Estado de ánimo:</span>
                  <span className="text-xl">{getMoodEmoji(note.mood)}</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {note.mood.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              data-testid={`button-share-note-${note.id}`}
            >
              <i className="fas fa-share"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              disabled={deleteNoteMutation.isPending}
              data-testid={`button-delete-note-${note.id}`}
            >
              {deleteNoteMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <i className="fas fa-trash"></i>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
