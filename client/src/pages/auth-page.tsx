import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Music, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation('/dashboard');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-indigo-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
          <p className="text-white/70">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-indigo-900 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">BOOSTIFY</h1>
            <Sparkles className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-white/70 text-lg">
            Tu plataforma de música potenciada por IA
          </p>
        </div>

        {/* Auth Card */}
        <Card className="bg-black/40 backdrop-blur-xl border-purple-500/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">
              {activeTab === 'signin' ? 'Bienvenido de vuelta' : 'Únete a BOOSTIFY'}
            </CardTitle>
            <CardDescription className="text-white/60">
              {activeTab === 'signin' 
                ? 'Inicia sesión para continuar tu viaje musical' 
                : 'Crea tu cuenta y empieza a crear'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-white/70"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="flex justify-center">
                <SignIn 
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
                      formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
                      footerActionLink: 'text-purple-400 hover:text-purple-300',
                      identityPreviewText: 'text-white',
                      identityPreviewEditButton: 'text-purple-400',
                      formFieldInputShowPasswordButton: 'text-white/60',
                      otpCodeFieldInput: 'bg-white/10 border-white/20 text-white',
                      footer: 'hidden',
                    },
                    variables: {
                      colorPrimary: '#9333ea',
                      colorBackground: 'transparent',
                      colorText: 'white',
                      colorTextSecondary: 'rgba(255,255,255,0.7)',
                      colorInputBackground: 'rgba(255,255,255,0.1)',
                      colorInputText: 'white',
                    }
                  }}
                  routing="hash"
                  signUpUrl="#signup"
                  afterSignInUrl="/dashboard"
                />
              </TabsContent>

              <TabsContent value="signup" className="flex justify-center">
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
                      formButtonPrimary: 'bg-purple-600 hover:bg-purple-700',
                      footerActionLink: 'text-purple-400 hover:text-purple-300',
                      identityPreviewText: 'text-white',
                      identityPreviewEditButton: 'text-purple-400',
                      formFieldInputShowPasswordButton: 'text-white/60',
                      otpCodeFieldInput: 'bg-white/10 border-white/20 text-white',
                      footer: 'hidden',
                    },
                    variables: {
                      colorPrimary: '#9333ea',
                      colorBackground: 'transparent',
                      colorText: 'white',
                      colorTextSecondary: 'rgba(255,255,255,0.7)',
                      colorInputBackground: 'rgba(255,255,255,0.1)',
                      colorInputText: 'white',
                    }
                  }}
                  routing="hash"
                  signInUrl="#signin"
                  afterSignUpUrl="/dashboard"
                />
              </TabsContent>
            </Tabs>
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
      </div>
    </div>
  );
}
