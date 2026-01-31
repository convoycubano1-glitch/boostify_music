import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Music, Sparkles, Zap, Users, BarChart3 } from 'lucide-react';

// Lazy load Remotion player to avoid SSR issues
const AuthAnimationPlayer = lazy(() => 
  import('@/components/remotion/AuthAnimationPlayer').then(mod => ({ default: mod.AuthAnimationPlayer }))
);

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

  // Check URL params for signup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'true') {
      setActiveTab('signup');
    }
  }, []);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Clerk appearance config - Boostify theme (same as profile.tsx)
  const clerkAppearance = {
    variables: {
      colorPrimary: "#f97316",
      colorBackground: "transparent",
      colorText: "#ffffff",
      colorTextSecondary: "#9ca3af",
      colorInputBackground: "#1f2937",
      colorInputText: "#ffffff",
      borderRadius: "0.75rem",
    },
    elements: {
      rootBox: "mx-auto w-full",
      card: "bg-transparent shadow-none p-0 gap-4",
      header: "hidden",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      main: "gap-4",
      form: "gap-4",
      formFieldRow: "mb-3",
      formFieldLabel: "text-gray-300 font-medium text-sm mb-1.5",
      formFieldInput: "bg-gray-800/90 border border-gray-600 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-12 px-4 transition-all",
      formFieldInputShowPasswordButton: "text-gray-400 hover:text-white transition-colors",
      formButtonPrimary: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/30 rounded-xl h-12 text-base transition-all",
      footerAction: "hidden",
      footerActionLink: "text-orange-400 hover:text-orange-300 font-medium",
      socialButtons: "gap-3",
      socialButtonsBlockButton: "bg-white border border-gray-200 text-gray-800 hover:bg-gray-100 hover:border-gray-300 rounded-xl h-12 transition-all gap-3 shadow-sm",
      socialButtonsBlockButtonText: "text-gray-800 font-medium text-sm",
      socialButtonsProviderIcon: "w-5 h-5",
      socialButtonsBlockButtonArrow: "hidden",
      dividerRow: "my-4",
      dividerLine: "bg-gray-700",
      dividerText: "text-gray-500 text-sm px-3",
      identityPreview: "bg-gray-800/50 border border-gray-700 rounded-xl",
      identityPreviewText: "text-white",
      identityPreviewEditButton: "text-orange-400 hover:text-orange-300",
      otpCodeFieldInput: "bg-gray-800 border-gray-600 text-white rounded-lg",
      alert: "bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl",
      alertText: "text-red-400",
      footer: "hidden",
      alternativeMethodsBlockButton: "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl",
    },
    layout: {
      socialButtonsPlacement: "top" as const,
      showOptionalFields: false,
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Panel - Animation (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 via-black to-red-900/20" />
        
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Glowing orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-8">
          {/* Remotion Animation */}
          <Suspense fallback={
            <div className="w-full max-w-2xl aspect-[4/3] bg-gray-900/50 rounded-2xl flex items-center justify-center border border-gray-800">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                <p className="text-gray-400">Loading animation...</p>
              </div>
            </div>
          }>
            <AuthAnimationPlayer 
              width={560}
              height={420}
              autoPlay={true}
              loop={true}
              className="mb-8"
            />
          </Suspense>
          
          {/* Features highlights */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-4">
            <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl px-4 py-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">AI-Powered</p>
                <p className="text-gray-500 text-xs">Smart music tools</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl px-4 py-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Instant Setup</p>
                <p className="text-gray-500 text-xs">Ready in 60 seconds</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl px-4 py-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">10K+ Artists</p>
                <p className="text-gray-500 text-xs">Growing community</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl px-4 py-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Analytics</p>
                <p className="text-gray-500 text-xs">Track your growth</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Boostify Music</h1>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-800/50 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'signin'
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Forms */}
        <div className="bg-gradient-to-b from-gray-900/95 to-gray-900/80 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-xl shadow-2xl shadow-black/50">
          {activeTab === 'signin' ? (
            <SignIn 
              appearance={clerkAppearance}
              routing="hash"
              signUpUrl="/auth?signup=true"
              afterSignInUrl="/dashboard"
            />
          ) : (
            <SignUp 
              appearance={clerkAppearance}
              routing="hash"
              signInUrl="/auth"
              afterSignUpUrl="/dashboard"
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-5">
          Free forever • No credit card required
        </p>
        </div>
      </div>
    </div>
  );
}
