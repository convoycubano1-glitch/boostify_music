import { SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2, Music } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
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
  );
}
