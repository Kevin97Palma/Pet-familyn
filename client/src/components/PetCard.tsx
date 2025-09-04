import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SharePetModal from "./SharePetModal";
import type { Pet } from "@shared/schema";

interface PetCardProps {
  pet: Pet;
}

export default function PetCard({ pet }: PetCardProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  const getAgeString = () => {
    if (!pet.birthDate) return "";
    const age = new Date().getFullYear() - new Date(pet.birthDate).getFullYear();
    return `${age} ${age === 1 ? 'año' : 'años'}`;
  };

  return (
    <>
      <Card className="bg-muted/30 border border-border hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="relative">
              {pet.profileImageUrl ? (
                <img 
                  src={pet.profileImageUrl} 
                  alt={`Foto de ${pet.name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary" 
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted border-2 border-primary flex items-center justify-center">
                  <i className="fas fa-paw text-primary text-xl"></i>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground" data-testid={`text-pet-name-${pet.id}`}>
                {pet.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {pet.breed || pet.species}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getAgeString()}
                {pet.weight && getAgeString() && " • "}
                {pet.weight}
              </p>
              <div className="flex space-x-2 mt-3">
                <Link href={`/pet/${pet.id}`}>
                  <Button 
                    size="sm" 
                    className="bg-primary/10 text-primary hover:bg-primary/20 text-xs"
                    data-testid={`button-view-profile-${pet.id}`}
                  >
                    Ver Perfil
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-secondary/10 text-secondary hover:bg-secondary/20 text-xs"
                  onClick={() => setShowShareModal(true)}
                  data-testid={`button-share-${pet.id}`}
                >
                  Compartir
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Share Modal */}
      <SharePetModal 
        pet={pet}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
