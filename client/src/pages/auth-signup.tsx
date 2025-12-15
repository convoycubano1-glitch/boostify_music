import { SignUp, useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, Sparkles, Rocket } from 'lucide-react';

export default function AuthSignupPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation('/dashboard');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-black to-red-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
          <p className="text-white/70">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-black to-red-900 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="w-10 h-10 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">BOOSTIFY</h1>
            <Rocket className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-white/70 text-lg">
            Crea tu cuenta y empieza tu viaje musical
          </p>
        </div>

        {/* Signup Card */}
        <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-orange-400" />
              Únete a BOOSTIFY
            </CardTitle>
            <CardDescription className="text-white/60">
              Solo necesitas tu email para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-transparent shadow-none border-none',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
                  socialButtonsBlockButtonText: 'text-white',
                  dividerLine: 'bg-white/20',
                  dividerText: 'text-white/50',
                  formFieldLabel: 'text-white/80',
                  formFieldInput: 'bg-white/10 border-white/20 text-white placeholder:text-white/40',
                  formButtonPrimary: 'bg-orange-600 hover:bg-orange-700',
                  footerActionLink: 'text-orange-400 hover:text-orange-300',
                  identityPreviewText: 'text-white',
                  identityPreviewEditButton: 'text-orange-400',
                  formFieldInputShowPasswordButton: 'text-white/60',
                  otpCodeFieldInput: 'bg-white/10 border-white/20 text-white',
                  footer: 'hidden',
                  // Hide phone number field
                  formFieldRow__phoneNumber: 'hidden',
                  phoneInputBox: 'hidden',
                },
                variables: {
                  colorPrimary: '#ea580c',
                  colorBackground: 'transparent',
                  colorText: 'white',
                  colorTextSecondary: 'rgba(255,255,255,0.7)',
                  colorInputBackground: 'rgba(255,255,255,0.1)',
                  colorInputText: 'white',
                }
              }}
              routing="hash"
              signInUrl="/auth"
              afterSignUpUrl="/dashboard"
            />
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-white/5 backdrop-blur">
            <p className="text-2xl mb-1">🎵</p>
            <p className="text-xs text-white/60">Música IA</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 backdrop-blur">
            <p className="text-2xl mb-1">🎬</p>
            <p className="text-xs text-white/60">Videos</p>
          </div>
          <div className="p-3 rounded-lg bg-white/5 backdrop-blur">
            <p className="text-2xl mb-1">💎</p>
            <p className="text-xs text-white/60">NFT</p>
          </div>
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-white/60">
          ¿Ya tienes cuenta?{' '}
          <a href="/auth" className="text-orange-400 hover:text-orange-300 underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
