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

  // Clerk appearance config - Boostify theme (optimized for mobile)
  const clerkAppearance = {
    variables: {
      colorPrimary: "#f97316",
      colorBackground: "transparent",
      colorText: "#ffffff",
      colorTextSecondary: "#9ca3af",
      colorInputBackground: "#1f2937",
      colorInputText: "#ffffff",
      borderRadius: "0.75rem",
      fontFamily: "inherit",
      fontSize: "14px",
    },
    elements: {
      // Root container - critical for mobile - force proper sizing
      rootBox: "!mx-auto !w-full !max-w-full !box-border",
      card: "!bg-transparent !shadow-none !p-0 !gap-2 sm:!gap-4 !w-full !max-w-full !overflow-visible !box-border",
      cardBox: "!shadow-none !rounded-none !w-full !max-w-full",
      
      // Header - hide Clerk default
      header: "!hidden",
      headerTitle: "!hidden",
      headerSubtitle: "!hidden",
      
      // Main form container - ensure full width
      main: "!gap-2 sm:!gap-4 !w-full !max-w-full !box-border",
      form: "!gap-2 sm:!gap-4 !w-full !max-w-full !flex !flex-col !box-border",
      
      // Form fields - force proper width
      formFieldRow: "!mb-2 sm:!mb-3 !w-full !max-w-full !box-border",
      formFieldLabel: "!text-gray-300 !font-medium !text-xs sm:!text-sm !mb-1",
      formFieldInput: "!bg-gray-800/90 !border !border-gray-600 !text-white placeholder:!text-gray-500 focus:!border-orange-500 focus:!ring-2 focus:!ring-orange-500/20 !rounded-lg sm:!rounded-xl !h-10 sm:!h-12 !px-3 sm:!px-4 !text-sm sm:!text-base !w-full !max-w-full !min-h-[40px] !box-border",
      formFieldInputShowPasswordButton: "!text-gray-400 hover:!text-white !transition-colors !absolute !right-3 !top-1/2 !-translate-y-1/2",
      formFieldHintText: "!text-xs !text-gray-500",
      formFieldSuccessText: "!text-xs !text-green-400",
      formFieldErrorText: "!text-xs !text-red-400",
      formFieldWarningText: "!text-xs !text-yellow-400",
      
      // Primary button - ensure full width and proper centering
      formButtonPrimary: "!bg-gradient-to-r !from-orange-500 !to-orange-600 hover:!from-orange-600 hover:!to-orange-700 !text-white !font-bold !shadow-lg !shadow-orange-500/30 !rounded-lg sm:!rounded-xl !h-10 sm:!h-12 !text-sm sm:!text-base !transition-all !w-full !max-w-full !min-h-[40px] !box-border !flex !items-center !justify-center",
      
      // Footer - hide switch link
      footerAction: "!hidden",
      footerActionLink: "!text-orange-400 hover:!text-orange-300 !font-medium !text-sm",
      footer: "!hidden",
      
      // Social buttons - stack vertically, full width
      socialButtons: "!gap-2 sm:!gap-3 !w-full !max-w-full !flex !flex-col !box-border",
      socialButtonsBlockButton: "!bg-white !border !border-gray-200 !text-gray-800 hover:!bg-gray-100 hover:!border-gray-300 !rounded-lg sm:!rounded-xl !h-10 sm:!h-12 !transition-all !gap-2 !shadow-sm !w-full !max-w-full !min-h-[40px] !box-border !flex !items-center !justify-center",
      socialButtonsBlockButtonText: "!text-gray-800 !font-medium !text-xs sm:!text-sm",
      socialButtonsProviderIcon: "!w-4 !h-4 sm:!w-5 sm:!h-5 !flex-shrink-0",
      socialButtonsBlockButtonArrow: "!hidden",
      
      // Divider
      dividerRow: "!my-2 sm:!my-4 !w-full",
      dividerLine: "!bg-gray-700",
      dividerText: "!text-gray-500 !text-xs sm:!text-sm !px-2 sm:!px-3 !bg-transparent",
      
      // Identity preview (for phone/email verification)
      identityPreview: "!bg-gray-800/50 !border !border-gray-700 !rounded-lg sm:!rounded-xl !p-2 sm:!p-3 !w-full !max-w-full !box-border",
      identityPreviewText: "!text-white !text-xs sm:!text-sm",
      identityPreviewEditButton: "!text-orange-400 hover:!text-orange-300 !text-xs sm:!text-sm",
      identityPreviewEditButtonIcon: "!w-3 !h-3",
      
      // OTP code input - smaller on mobile
      otpCodeFieldInput: "!bg-gray-800 !border-gray-600 !text-white !rounded-lg !h-9 sm:!h-12 !w-9 sm:!w-12 !text-base sm:!text-lg !p-0 !text-center",
      otpCodeField: "!gap-1.5 sm:!gap-2 !justify-center !w-full",
      
      // Alerts
      alert: "!bg-red-500/10 !border !border-red-500/30 !text-red-400 !rounded-lg sm:!rounded-xl !p-2 sm:!p-3 !text-xs sm:!text-sm !w-full",
      alertText: "!text-red-400 !text-xs sm:!text-sm",
      alertIcon: "!w-4 !h-4 !flex-shrink-0",
      
      // Alternative methods - full width
      alternativeMethodsBlockButton: "!bg-gray-800/50 !border !border-gray-700 !text-gray-300 hover:!bg-gray-700 !rounded-lg sm:!rounded-xl !h-10 sm:!h-12 !w-full !max-w-full !min-h-[40px] !text-xs sm:!text-sm !box-border !flex !items-center !justify-center",
      
      // Resend code link
      formResendCodeLink: "!text-orange-400 hover:!text-orange-300 !text-xs sm:!text-sm",
      
      // Phone input specific - fix overflow
      phoneInputBox: "!w-full !max-w-full !box-border",
      formFieldPhoneInput: "!w-full !max-w-full",
      selectButton: "!bg-gray-800 !border-gray-600 !text-white !h-10 sm:!h-12 !rounded-l-lg !flex-shrink-0",
      selectButtonText: "!text-xs sm:!text-sm",
      
      // Internal layout fixes
      internal: "!gap-2 !w-full",
      buttonArrowIcon: "!hidden",
      providerIcon: "!w-4 !h-4 !flex-shrink-0",
      
      // Modal specific (when Clerk opens modals)
      modalBackdrop: "!bg-black/80 !backdrop-blur-sm",
      modalContent: "!bg-gray-900 !border !border-gray-700 !rounded-xl !max-w-[90vw] sm:!max-w-md !p-4 sm:!p-6 !mx-4",
      modalCloseButton: "!text-gray-400 hover:!text-white",
      
      // Action cards and verification
      verificationLinkStatusBox: "!w-full !max-w-full !box-border",
      actionCard: "!w-full !max-w-full !box-border",
    },
    layout: {
      socialButtonsPlacement: "top" as const,
      showOptionalFields: false,
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black">
      {/* Mobile Animation Header - Visible only on mobile/tablet */}
      <div className="lg:hidden relative overflow-hidden bg-gradient-to-b from-orange-600/10 via-black to-transparent">
        {/* Animated grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(249, 115, 22, 0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(249, 115, 22, 0.1) 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />
        
        {/* Glowing orbs - smaller for mobile */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-[60px] animate-pulse" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-red-600/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Mobile Animation Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 py-6">
          {/* Remotion Animation - Mobile optimized */}
          <Suspense fallback={
            <div className="w-full max-w-[280px] aspect-[4/3] bg-gray-900/50 rounded-xl flex items-center justify-center border border-gray-800">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                <p className="text-gray-400 text-xs">Loading...</p>
              </div>
            </div>
          }>
            <AuthAnimationPlayer 
              width={280}
              height={210}
              autoPlay={true}
              loop={true}
              className="mb-4"
            />
          </Suspense>
          
          {/* Mobile Feature Pills - Horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto w-full max-w-full pb-2 px-2 scrollbar-hide">
            <div className="flex-shrink-0 flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-full px-3 py-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-white text-xs font-medium whitespace-nowrap">AI-Powered</span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-full px-3 py-1.5">
              <Zap className="w-3.5 h-3.5 text-green-400" />
              <span className="text-white text-xs font-medium whitespace-nowrap">60s Setup</span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-full px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-white text-xs font-medium whitespace-nowrap">10K+ Artists</span>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 bg-gray-900/60 backdrop-blur-sm border border-gray-800/50 rounded-full px-3 py-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white text-xs font-medium whitespace-nowrap">Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Left Panel - Animation (desktop only) */}
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
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-start sm:items-center justify-center px-4 py-4 sm:p-6 lg:p-8 min-h-[calc(100vh-200px)] lg:min-h-screen overflow-y-auto">
        <div className="w-full max-w-[300px] sm:max-w-md mx-auto my-auto">
        {/* Logo */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 shadow-lg shadow-orange-500/30">
            <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">Boostify Music</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
            {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-800/50 rounded-lg sm:rounded-xl p-0.5 sm:p-1 mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab('signin')}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all ${
              activeTab === 'signin'
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md sm:rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-orange-500 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth Forms */}
        <div className="bg-gradient-to-b from-gray-900/95 to-gray-900/80 border border-gray-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
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
        <p className="text-center text-gray-500 text-[10px] sm:text-xs mt-3 sm:mt-5">
          Free forever • No credit card required
        </p>
        </div>
      </div>
      
      {/* Custom CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
