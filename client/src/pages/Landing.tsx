import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="bg-primary rounded-xl p-4">
              <i className="fas fa-paw text-primary-foreground text-3xl"></i>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Pet-Family</h1>
              <p className="text-lg text-muted-foreground">Tu familia peluda, siempre conectada</p>
            </div>
          </div>

          {/* Hero Section */}
          <div className="mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Gestión completa para tus mascotas
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Lleva un control completo de la salud, notas veterinarias y comparte 
              el cuidado de tus mascotas con toda tu familia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                onClick={() => window.location.href = '/auth'}
                size="lg" 
                className="text-lg px-8 py-3"
                data-testid="button-login"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => window.location.href = '/auth'}
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-3"
                data-testid="button-register"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Crear Cuenta
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 p-4 rounded-xl inline-block mb-4">
                  <i className="fas fa-paw text-primary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Perfiles de Mascotas
                </h3>
                <p className="text-muted-foreground">
                  Crea perfiles completos con fotos, información médica y datos importantes
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="bg-secondary/10 p-4 rounded-xl inline-block mb-4">
                  <i className="fas fa-sticky-note text-secondary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Notas Inteligentes
                </h3>
                <p className="text-muted-foreground">
                  Registra actividades cotidianas y citas veterinarias con facilidad
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="bg-accent/10 p-4 rounded-xl inline-block mb-4">
                  <i className="fas fa-users text-accent text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Familia Conectada
                </h3>
                <p className="text-muted-foreground">
                  Comparte el cuidado con códigos QR y invitaciones familiares
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-left space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">
                Características Principales
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-3"></i>
                  Control de vacunas y medicamentos
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-3"></i>
                  Historial médico completo
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-3"></i>
                  Compartir perfiles con QR
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-3"></i>
                  Notas familiares colaborativas
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-primary mr-3"></i>
                  Gestión de archivos y documentos
                </li>
              </ul>
            </div>

            <div className="text-left space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">
                Para toda la familia
              </h3>
              <p className="text-muted-foreground">
                Pet-Family está diseñado para que todos los miembros de tu familia 
                puedan participar en el cuidado de las mascotas. Con nuestro sistema 
                de invitaciones y códigos QR, es fácil agregar nuevos miembros y 
                mantener a todos informados.
              </p>
              <p className="text-muted-foreground">
                Desde abuelos hasta niños, todos pueden agregar notas, ver el historial 
                y estar al día con las necesidades de sus mascotas favoritas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
