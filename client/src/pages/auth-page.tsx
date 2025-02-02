import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiGoogle } from "react-icons/si";
import { Redirect } from "wouter";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useToast } from "@/hooks/use-toast";
import backgroundVideo from '../images/videos/Standard_Mode_Generated_Video.mp4';

export default function AuthPage() {
  const { user } = useAuth();
  const { signInWithGoogle } = useFirebaseAuth();
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
          <h1 className="text-4xl font-bold text-white">Welcome Back</h1>
          <p className="text-lg text-gray-300">
            Sign in to access your dashboard and manage your music career
          </p>
        </div>

        <Button 
          variant="outline" 
          className="w-full gap-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white border-none hover:from-orange-600 hover:via-red-600 hover:to-orange-600 transition-all duration-300"
          onClick={handleGoogleSignIn}
        >
          <SiGoogle className="w-5 h-5" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
}