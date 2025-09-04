import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender: string;
  birthDate?: string;
  profileImageUrl?: string;
  description?: string;
}

interface PetFile {
  id: string;
  fileName: string;
  filePath: string;
  description?: string;
  createdAt: string;
}

interface Note {
  id: string;
  type: 'daily' | 'veterinary';
  title: string;
  content: string;
  date: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

interface Vaccination {
  id: string;
  vaccineName: string;
  administrationDate: string;
  nextDueDate?: string;
  veterinarianName?: string;
  clinicName?: string;
}

interface PublicPetData {
  pet: Pet;
  files: PetFile[];
}

export default function PublicPetProfile() {
  const { id } = useParams();
  const [petData, setPetData] = useState<PublicPetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPetData(id);
    }
  }, [id]);

  const fetchPetData = async (petId: string) => {
    try {
      const response = await fetch(`/public/pet/${petId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("Mascota no encontrada");
        } else {
          setError("Error al cargar la información de la mascota");
        }
        return;
      }
      const data = await response.json();
      setPetData(data);
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
      return years - 1 === 0 ? `${12 + months} meses` : `${years - 1} años`;
    }
    return years === 0 ? `${months} meses` : `${years} años`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !petData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Error
            </CardTitle>
            <CardDescription>{error || "Mascota no encontrada"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { pet, files } = petData;
  const photoFiles = files.filter(file => file.filePath.includes('image') || file.fileName.match(/\.(jpg|jpeg|png|gif)$/i));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fas fa-paw text-2xl text-blue-600"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pet-Family</h1>
                <p className="text-gray-600">Perfil Público de Mascota</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Main Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Profile Image */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 mx-auto lg:mx-0">
                  {pet.profileImageUrl ? (
                    <img
                      src={pet.profileImageUrl}
                      alt={pet.name}
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 rounded-xl flex items-center justify-center">
                      <i className="fas fa-paw text-6xl text-white"></i>
                    </div>
                  )}
                </div>
              </div>

              {/* Pet Info */}
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">
                  <i className="fas fa-heart text-red-500 mr-2"></i>
                  {pet.name}
                </CardTitle>
                <CardDescription className="text-lg mb-4">
                  {pet.breed ? `${pet.breed} • ` : ''}{pet.species}
                </CardDescription>

                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                    <Badge variant="secondary" className="text-sm">
                      <i className={`fas ${pet.gender === 'male' ? 'fa-mars text-blue-500' : 'fa-venus text-pink-500'} mr-1`}></i>
                      {pet.gender === 'male' ? 'Macho' : 'Hembra'}
                    </Badge>
                    {pet.birthDate && (
                      <Badge variant="outline" className="text-sm">
                        <i className="fas fa-birthday-cake text-yellow-500 mr-1"></i>
                        {calculateAge(pet.birthDate)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Description */}
                  {pet.description && (
                    <div className="mt-4">
                      <p className="text-gray-700 leading-relaxed">
                        {pet.description}
                      </p>
                    </div>
                  )}
                  
                  {!pet.description && (
                    <div className="mt-4">
                      <p className="text-gray-500 italic">
                        ¡Hola! Soy {pet.name}, una {pet.species.toLowerCase()}{pet.breed ? ` ${pet.breed.toLowerCase()}` : ''}.
                        ¡Me encanta conocer nuevos amigos! 🐾
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Photo Gallery */}
        {photoFiles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>
                <i className="fas fa-images mr-2"></i>
                Galería de Fotos ({photoFiles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photoFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedImage(file.filePath)}
                  >
                    <img
                      src={file.filePath}
                      alt={file.description || file.fileName}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <i className="fas fa-search-plus text-white opacity-0 group-hover:opacity-100 text-xl"></i>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer message */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardContent className="text-center py-8">
            <div className="max-w-md mx-auto">
              <i className="fas fa-paw text-4xl text-blue-500 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                ¡Gracias por conocer a {pet.name}!
              </h3>
              <p className="text-gray-600">
                Este perfil fue compartido con amor desde Pet-Family 💙
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedImage}
              alt="Foto ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setSelectedImage(null)}
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}