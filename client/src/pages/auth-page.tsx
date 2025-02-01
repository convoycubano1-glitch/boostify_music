import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";
import { Redirect } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user } = useAuth();
  const { signInWithGoogle } = useFirebaseAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo iniciar sesión con Google",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Bienvenido</h1>
            <p className="text-muted-foreground">
              Inicia sesión para acceder a tu cuenta
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleGoogleSignIn}
          >
            <SiGoogle className="w-5 h-5" />
            Continuar con Google
          </Button>
        </Card>
      </div>

      <div 
        className="hidden md:flex flex-col justify-center p-12 bg-black"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${encodeURI("https://images.unsplash.com/photo-1484972759836-b93f9ef2b293")})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <h1 className="text-4xl font-bold text-white mb-6">
          Impulsa tu Carrera Musical
        </h1>
        <p className="text-lg text-gray-300">
          Únete a la próxima generación de marketing musical. Conecta con Spotify, gestiona tu marca y haz crecer tu audiencia.
        </p>
      </div>
    </div>
  );
}