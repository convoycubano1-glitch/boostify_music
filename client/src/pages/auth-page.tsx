import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiGoogle } from "react-icons/si";
import { Redirect } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useToast } from "@/hooks/use-toast";
import backgroundVideo from '../images/videos/Standard_Mode_Generated_Video.mp4';

export default function AuthPage() {
  const { user } = useAuth();
  const { signInWithGoogle, signInWithEmailTemporary } = useFirebaseAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: "Could not sign in with Google",
        variant: "destructive",
      });
    }
  };
  
  // Método temporal para iniciar sesión sin popups (solución para problemas con bloqueadores)
  const handleTemporarySignIn = async () => {
    try {
      await signInWithEmailTemporary();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: "Could not sign in with temporary method",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src={backgroundVideo}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

      <div className="relative z-10 text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Welcome </h1>
          <p className="text-lg text-gray-300">
            Sign in to access your dashboard and manage your music career
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            variant="outline" 
            className="w-full gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white border-none hover:from-orange-600 hover:via-red-600 hover:to-orange-600 transition-all duration-300"
            onClick={handleGoogleSignIn}
          >
            <SiGoogle className="w-5 h-5" />
            Continue with Google
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-500" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black px-2 text-gray-400">or</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full gap-2 bg-orange-500/20 text-white border-orange-500/50 hover:bg-orange-500/30"
            onClick={handleTemporarySignIn}
          >
            Login as Demo User
          </Button>
        </div>
      </div>
    </div>
  );
}