import React, { lazy, Suspense, ReactNode, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { PageLoader } from "./components/ui/page-loader";
import { ProtectedRoute } from "./lib/protected-route";
import { SubscriptionProtectedRoute } from "./lib/subscription-protected-route";
import { useToast } from "./hooks/use-toast";
import { SubscriptionProvider } from "./lib/context/subscription-context";
import { SubscriptionPlan } from "./lib/api/subscription-service";
import { ViteHMRErrorHandler } from "./components/improved-websocket-context";
import { EditorProvider } from "./lib/context/editor-context";
import { GlobalAuthGuard } from "./lib/global-auth-guard";
import { BottomNav } from "./components/layout/bottom-nav";
import { BoostifyRadio } from "./components/radio/boostify-radio";
import { CustomerServiceAgent } from "./components/agents/customer-service-agent";

import NotFound from "./pages/not-found";
import HomePage from "./pages/home";
import AuthPage from "./pages/auth-page";
import LoginPage from "./pages/login";
import AuthSignupPage from "./pages/auth-signup";
import DashboardPage from "./pages/dashboard";
import ProfilePage from "./pages/profile";

const AdminPage = lazy(() => import("./pages/admin"));
const AIAgentsPage = lazy(() => import("./pages/ai-agents"));
const AIAdvisorsPage = lazy(() => import("./pages/ai-advisors"));
const AIAdvisorsPageV2 = lazy(() => import("./pages/ai-advisors-v2"));
const AnalyticsPage = lazy(() => import("./pages/analytics"));
const ArtistDashboard = lazy(() => import("./pages/artist-dashboard"));
const ArtistImageAdvisor = lazy(() => import("./pages/artist-image-advisor"));
const ArtistImageAdvisorImproved = lazy(() => import("./pages/artist-image-advisor-improved"));
const ArtistGeneratorPage = lazy(() => import("./pages/artist-generator"));
const BlogPage = lazy(() => import("./pages/blog"));
const BoostifyInternationalPage = lazy(() => import("./pages/boostify-international"));
const BoostifyTVPage = lazy(() => import("./pages/boostify-tv"));
const BoostifyExplicitPage = lazy(() => import("./pages/boostify-explicit"));
const ContactsPage = lazy(() => import("./pages/contacts"));
const ContractsPage = lazy(() => import("./pages/contracts"));
const CookiesPage = lazy(() => import("./pages/cookies"));
const EcosystemPage = lazy(() => import("./pages/ecosystem"));
const EventsPage = lazy(() => import("./pages/events"));
const FaceSwapPage = lazy(() => import("./pages/face-swap"));
const GlobalPage = lazy(() => import("./pages/global"));
const ImageGeneratorPage = lazy(() => import("./pages/image-generator"));
const ImageGeneratorSimplePage = lazy(() => import("./pages/image-generator-simple"));
const InstagramBoostPage = lazy(() => import("./pages/instagram-boost"));
const KlingToolsPage = lazy(() => import("./pages/kling-tools"));
const KlingStorePage = lazy(() => import("./pages/kling-store"));
const KlingTestPage = lazy(() => import("./pages/kling-test"));
const ManagerToolsPage = lazy(() => import("./pages/manager-tools"));
const MerchandisePage = lazy(() => import("./pages/merchandise"));
const MessagesPage = lazy(() => import("./pages/messages"));
const MusicVideoCreator = lazy(() => import("./pages/music-video-creator"));
const MusicVideoWorkflowPage = lazy(() => import("./pages/music-video-workflow-page"));
const MusicVideoWorkflowEnhancedPage = lazy(() => import("./pages/music-video-workflow-enhanced"));
const MusicGeneratorPage = lazy(() => import("./pages/music-generator"));
const NewsPage = lazy(() => import("./pages/news"));
const PRPage = lazy(() => import("./pages/pr"));
const PrivacyPage = lazy(() => import("./pages/privacy"));
const ProducerToolsPage = lazy(() => import("./pages/producer-tools"));
const PromotionPage = lazy(() => import("./pages/promotion"));
const RecordLabelServices = lazy(() => import("./pages/record-label-services"));
const SettingsPage = lazy(() => import("./pages/settings"));
const SpotifyPage = lazy(() => import("./pages/spotify"));
const StorePage = lazy(() => import("./pages/store"));
const TermsPage = lazy(() => import("./pages/terms"));
const TryOnPage = lazy(() => import("./pages/try-on-page"));
const VideosPage = lazy(() => import("./pages/videos"));
const VideoGenerationTestPage = lazy(() => import("./pages/video-generation-test"));
const CameraMovementsTestPage = lazy(() => import("./pages/camera-movements-test"));
const YoutubeViewsPage = lazy(() => import("./pages/youtube-views"));
const RealTimeTranslator = lazy(() => import("./pages/real-time-translator"));
const EducationPage = lazy(() => import("./pages/education"));
const AchievementsPage = lazy(() => import("./pages/achievements-page"));
const CourseDetailPage = lazy(() => import("./pages/course-detail"));
const SmartCardsPage = lazy(() => import("./pages/smart-cards"));
const InvestorsDashboard = lazy(() => import("./pages/investors-dashboard"));
const SocialNetworkPage = lazy(() => import("./pages/social-network"));
const FirestoreSocialPage = lazy(() => import("./pages/firestore-social"));
const ArtistProfilePage = lazy(() => import("./pages/artist-profile"));
const DiagnosticsPage = lazy(() => import("./pages/diagnostics"));
const AffiliatesPage = lazy(() => import("./pages/affiliates"));
const InitProductsPage = lazy(() => import("./pages/init-products"));
const MusicMasteringPage = lazy(() => import("./pages/music-mastering"));
const VirtualRecordLabelPage = lazy(() => import("./pages/virtual-record-label"));
const TestProgressPage = lazy(() => import("./pages/test-progress"));
const PluginsPage = lazy(() => import("./pages/plugins"));
const PricingPage = lazy(() => import("./pages/pricing"));
const AccountPage = lazy(() => import("./pages/account"));
const SubscriptionSuccessPage = lazy(() => import("./pages/subscription-success"));
const SubscriptionCancelledPage = lazy(() => import("./pages/subscription-cancelled"));
const MusicVideoSuccess = lazy(() => import("./pages/music-video-success"));
const MusicVideoCancelled = lazy(() => import("./pages/music-video-cancelled"));
const SubscriptionExamplePage = lazy(() => import("./pages/subscription-example"));
const ProfessionalEditorPage = lazy(() => import("./pages/professional-editor"));
const LayerFilterDemoPage = lazy(() => import("./pages/layer-filter-demo"));
const AnimatedWorkflowPage = lazy(() => import("./pages/animated-workflow"));
const TokenizationPage = lazy(() => import("./pages/tokenization"));
const ResourcesPage = lazy(() => import("./pages/resources"));
const TipsPage = lazy(() => import("./pages/tips"));
const GuidesPage = lazy(() => import("./pages/guides"));
const ToolsPage = lazy(() => import("./pages/tools"));
const FeaturesPage = lazy(() => import("./pages/features"));
const AIVideoCreationPage = lazy(() => import("./pages/ai-video-creation"));
const TimelineDemoPage = lazy(() => import("./pages/timeline-demo"));
const DebugFirebasePage = lazy(() => import("./pages/debug-firebase"));

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md p-8 rounded-lg bg-card border text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              className="bg-primary text-primary-foreground px-4 py-2 rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div className="pb-20">
      {children}
    </div>
  );
};

// HOC para envolver componentes con el PageWrapper
const withPageWrapper = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <PageWrapper>
      <Component {...props} />
    </PageWrapper>
  );
};

// Función para seleccionar qué componente de ruta usar según el nivel de suscripción requerido
const getRouteComponent = (path: string, Component: React.ComponentType<any>, requiredPlan: SubscriptionPlan | null = null) => {
  // Si no se requiere nivel de suscripción, usar ruta normal (pública)
  if (requiredPlan === null) {
    return <Route path={path} component={Component} />;
  }
  
  // Si solo se requiere autenticación pero no suscripción, usar ProtectedRoute
  if (requiredPlan === 'free') {
    return <ProtectedRoute path={path} component={Component} />;
  }
  
  // Si se requiere suscripción específica, usar SubscriptionProtectedRoute
  return <SubscriptionProtectedRoute path={path} component={Component} requiredPlan={requiredPlan} />;
};

const Router = () => {
  const [showRadio, setShowRadio] = useState(false);

  useEffect(() => {
    const handleToggleRadio = () => setShowRadio(prev => !prev);
    window.addEventListener('toggle-radio', handleToggleRadio);
    return () => window.removeEventListener('toggle-radio', handleToggleRadio);
  }, []);

  // Aplicamos el HOC a todos los componentes de página
  const WrappedHomePage = withPageWrapper(HomePage);
  const WrappedTermsPage = withPageWrapper(TermsPage);
  const WrappedPrivacyPage = withPageWrapper(PrivacyPage);
  const WrappedCookiesPage = withPageWrapper(CookiesPage);
  const WrappedProfilePage = withPageWrapper(ProfilePage);
  const WrappedArtistProfilePage = withPageWrapper(ArtistProfilePage);
  const WrappedDashboardPage = withPageWrapper(DashboardPage);
  const WrappedAdminPage = withPageWrapper(AdminPage);
  const WrappedArtistDashboard = withPageWrapper(ArtistDashboard);
  const WrappedSpotifyPage = withPageWrapper(SpotifyPage);
  const WrappedContractsPage = withPageWrapper(ContractsPage);
  const WrappedBoostifyInternationalPage = withPageWrapper(BoostifyInternationalPage);
  const WrappedBoostifyTVPage = withPageWrapper(BoostifyTVPage);
  const WrappedBoostifyExplicitPage = withPageWrapper(BoostifyExplicitPage);
  const WrappedPRPage = withPageWrapper(PRPage);
  const WrappedNewsPage = withPageWrapper(NewsPage);
  const WrappedEventsPage = withPageWrapper(EventsPage);
  const WrappedAnalyticsPage = withPageWrapper(AnalyticsPage);
  const WrappedGlobalPage = withPageWrapper(GlobalPage);
  const WrappedVideosPage = withPageWrapper(VideosPage);
  const WrappedBlogPage = withPageWrapper(BlogPage);
  const WrappedPromotionPage = withPageWrapper(PromotionPage);
  const WrappedYoutubeViewsPage = withPageWrapper(YoutubeViewsPage);
  const WrappedInstagramBoostPage = withPageWrapper(InstagramBoostPage);
  const WrappedSettingsPage = withPageWrapper(SettingsPage);
  const WrappedContactsPage = withPageWrapper(ContactsPage);
  const WrappedMessagesPage = withPageWrapper(MessagesPage);
  const WrappedManagerToolsPage = withPageWrapper(ManagerToolsPage);
  const WrappedProducerToolsPage = withPageWrapper(ProducerToolsPage);
  const WrappedMusicVideoCreator = withPageWrapper(MusicVideoCreator);
  const WrappedMusicVideoWorkflowPage = withPageWrapper(MusicVideoWorkflowPage);
  const WrappedMusicVideoWorkflowEnhancedPage = withPageWrapper(MusicVideoWorkflowEnhancedPage);
  const WrappedMusicGeneratorPage = withPageWrapper(MusicGeneratorPage);
  const WrappedRecordLabelServices = withPageWrapper(RecordLabelServices);
  const WrappedAIAgentsPage = withPageWrapper(AIAgentsPage);
  const WrappedAIAdvisorsPage = withPageWrapper(AIAdvisorsPage);
  const WrappedAIAdvisorsPageV2 = withPageWrapper(AIAdvisorsPageV2);
  const WrappedArtistImageAdvisor = withPageWrapper(ArtistImageAdvisor);
  const WrappedArtistImageAdvisorImproved = withPageWrapper(ArtistImageAdvisorImproved);
  const WrappedArtistGeneratorPage = withPageWrapper(ArtistGeneratorPage);
  const WrappedMerchandisePage = withPageWrapper(MerchandisePage);
  const WrappedEcosystemPage = withPageWrapper(EcosystemPage);
  const WrappedStorePage = withPageWrapper(StorePage);
  const WrappedRealTimeTranslator = withPageWrapper(RealTimeTranslator);
  const WrappedEducationPage = withPageWrapper(EducationPage);
  const WrappedAchievementsPage = withPageWrapper(AchievementsPage);
  const WrappedCourseDetailPage = withPageWrapper(CourseDetailPage);
  const WrappedSmartCardsPage = withPageWrapper(SmartCardsPage);
  const WrappedInvestorsDashboard = withPageWrapper(InvestorsDashboard);
  const WrappedAffiliatesPage = withPageWrapper(AffiliatesPage);
  const WrappedInitProductsPage = withPageWrapper(InitProductsPage);
  const WrappedSocialNetworkPage = withPageWrapper(SocialNetworkPage);
  const WrappedFirestoreSocialPage = withPageWrapper(FirestoreSocialPage);
  const WrappedImageGeneratorPage = withPageWrapper(ImageGeneratorPage);
  const WrappedImageGeneratorSimplePage = withPageWrapper(ImageGeneratorSimplePage);
  const WrappedFaceSwapPage = withPageWrapper(FaceSwapPage);
  const WrappedKlingToolsPage = withPageWrapper(KlingToolsPage);
  const WrappedKlingStorePage = withPageWrapper(KlingStorePage);
  const WrappedKlingTestPage = withPageWrapper(KlingTestPage);
  const WrappedVideoGenerationTestPage = withPageWrapper(VideoGenerationTestPage);
  const WrappedCameraMovementsTestPage = withPageWrapper(CameraMovementsTestPage);
  const WrappedMusicMasteringPage = withPageWrapper(MusicMasteringPage);
  const WrappedVirtualRecordLabelPage = withPageWrapper(VirtualRecordLabelPage);
  const WrappedTestProgressPage = withPageWrapper(TestProgressPage);
  const WrappedAuthPage = withPageWrapper(AuthPage);
  const WrappedLoginPage = withPageWrapper(LoginPage);
  const WrappedAuthSignupPage = withPageWrapper(AuthSignupPage);
  const WrappedPluginsPage = withPageWrapper(PluginsPage);
  const WrappedTryOnPage = withPageWrapper(TryOnPage);
  const WrappedPricingPage = withPageWrapper(PricingPage);
  const WrappedAccountPage = withPageWrapper(AccountPage);
  const WrappedSubscriptionSuccessPage = withPageWrapper(SubscriptionSuccessPage);
  const WrappedSubscriptionCancelledPage = withPageWrapper(SubscriptionCancelledPage);
  const WrappedSubscriptionExamplePage = withPageWrapper(SubscriptionExamplePage);
  const WrappedMusicVideoSuccess = withPageWrapper(MusicVideoSuccess);
  const WrappedMusicVideoCancelled = withPageWrapper(MusicVideoCancelled);
  const WrappedProfessionalEditorPage = withPageWrapper(ProfessionalEditorPage);
  const WrappedLayerFilterDemoPage = withPageWrapper(LayerFilterDemoPage);
  const WrappedAnimatedWorkflowPage = withPageWrapper(AnimatedWorkflowPage);
  const WrappedTokenizationPage = withPageWrapper(TokenizationPage);
  const WrappedResourcesPage = withPageWrapper(ResourcesPage);
  const WrappedTipsPage = withPageWrapper(TipsPage);
  const WrappedGuidesPage = withPageWrapper(GuidesPage);
  const WrappedToolsPage = withPageWrapper(ToolsPage);
  const WrappedFeaturesPage = withPageWrapper(FeaturesPage);
  const WrappedAIVideoCreationPage = withPageWrapper(AIVideoCreationPage);
  const WrappedTimelineDemoPage = withPageWrapper(TimelineDemoPage);
  const WrappedDebugFirebasePage = withPageWrapper(DebugFirebasePage);
  const WrappedDiagnosticsPage = withPageWrapper(DiagnosticsPage);
  const WrappedNotFound = withPageWrapper(NotFound);

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* Rutas públicas - accesibles sin autenticación */}
          {getRouteComponent("/", WrappedHomePage, null)}
          {getRouteComponent("/auth", WrappedAuthPage, null)}
          {getRouteComponent("/login", WrappedLoginPage, null)}
          {getRouteComponent("/signup", WrappedAuthSignupPage, null)}
          {getRouteComponent("/diagnostics", WrappedDiagnosticsPage, null)}
          {getRouteComponent("/terms", WrappedTermsPage, null)}
          {getRouteComponent("/privacy", WrappedPrivacyPage, null)}
          {getRouteComponent("/cookies", WrappedCookiesPage, null)}
          {getRouteComponent("/profile/:id", WrappedProfilePage, null)}
          {getRouteComponent("/artist/:slug", WrappedArtistProfilePage, null)}
          {getRouteComponent("/pricing", WrappedPricingPage, null)}
          {getRouteComponent("/boostify-explicit", WrappedBoostifyExplicitPage, null)}
          
          {/* Rutas de ejemplo básicas - requieren autenticación pero no suscripción */}
          {getRouteComponent("/dashboard", WrappedDashboardPage, 'free')}
          {getRouteComponent("/profile", WrappedProfilePage, 'free')}
          {getRouteComponent("/settings", WrappedSettingsPage, 'free')}
          {getRouteComponent("/messages", WrappedMessagesPage, 'free')}
          {getRouteComponent("/account", WrappedAccountPage, 'free')}
          {getRouteComponent("/subscription/success", WrappedSubscriptionSuccessPage, 'free')}
          {getRouteComponent("/subscription/cancelled", WrappedSubscriptionCancelledPage, 'free')}
          {getRouteComponent("/subscription/example", WrappedSubscriptionExamplePage, 'free')}
          {getRouteComponent("/music-video-success", WrappedMusicVideoSuccess, 'free')}
          {getRouteComponent("/music-video-cancelled", WrappedMusicVideoCancelled, 'free')}
          
          {/* Rutas para suscripción BASIC ($59.99) */}
          {getRouteComponent("/artist-dashboard", WrappedArtistDashboard, 'basic')}
          {getRouteComponent("/spotify", WrappedSpotifyPage, 'basic')}
          {getRouteComponent("/contracts", WrappedContractsPage, 'basic')}
          {getRouteComponent("/pr", WrappedPRPage, 'basic')}
          {getRouteComponent("/news", WrappedNewsPage, 'basic')}
          {getRouteComponent("/events", WrappedEventsPage, 'basic')}
          {getRouteComponent("/videos", WrappedVideosPage, 'basic')}
          {getRouteComponent("/blog", WrappedBlogPage, 'basic')}
          {getRouteComponent("/store", WrappedStorePage, 'free')}
          {getRouteComponent("/education", WrappedEducationPage, 'basic')}
          {getRouteComponent("/course/:id", WrappedCourseDetailPage, 'basic')}
          {getRouteComponent("/social-network", WrappedSocialNetworkPage, 'basic')}
          {getRouteComponent("/firestore-social", WrappedFirestoreSocialPage, 'basic')}
          
          {/* Rutas para suscripción PRO ($99.99) */}
          {getRouteComponent("/analytics", WrappedAnalyticsPage, 'pro')}
          {getRouteComponent("/global", WrappedGlobalPage, 'pro')}
          {getRouteComponent("/promotion", WrappedPromotionPage, 'pro')}
          {getRouteComponent("/youtube-views", WrappedYoutubeViewsPage, 'pro')}
          {getRouteComponent("/instagram-boost", WrappedInstagramBoostPage, 'pro')}
          {getRouteComponent("/contacts", WrappedContactsPage, 'pro')}
          {getRouteComponent("/manager-tools", WrappedManagerToolsPage, 'pro')}
          {getRouteComponent("/producer-tools", WrappedProducerToolsPage, 'pro')}
          {getRouteComponent("/music-generator", WrappedMusicGeneratorPage, 'pro')}
          {getRouteComponent("/artist-image-advisor", WrappedArtistImageAdvisor, 'pro')}
          {getRouteComponent("/merchandise", WrappedMerchandisePage, 'pro')}
          {getRouteComponent("/translator", WrappedRealTimeTranslator, 'pro')}
          {getRouteComponent("/achievements", WrappedAchievementsPage, 'pro')}
          {getRouteComponent("/smart-cards", WrappedSmartCardsPage, 'pro')}
          {getRouteComponent("/image-generator", WrappedImageGeneratorPage, 'pro')}
          
          {/* Rutas para suscripción PREMIUM ($149.99) */}
          {getRouteComponent("/music-video-creator", WrappedMusicVideoCreator, 'free')}
          {getRouteComponent("/music-video-workflow", WrappedMusicVideoWorkflowPage, 'free')}
          {getRouteComponent("/music-video-flow", WrappedMusicVideoWorkflowEnhancedPage, 'free')}
          {getRouteComponent("/record-label-services", WrappedRecordLabelServices, 'premium')}
          {getRouteComponent("/ai-agents", WrappedAIAgentsPage, 'premium')}
          {getRouteComponent("/ai-advisors", WrappedAIAdvisorsPage, 'premium')}
          {getRouteComponent("/artist-generator", WrappedArtistGeneratorPage, 'premium')}
          {getRouteComponent("/ecosystem", WrappedEcosystemPage, 'premium')}
          {getRouteComponent("/investors-dashboard", WrappedInvestorsDashboard, 'premium')}
          {getRouteComponent("/affiliates", WrappedAffiliatesPage, 'free')}
          {getRouteComponent("/init-products", WrappedInitProductsPage, 'free')}
          {getRouteComponent("/boostify-international", WrappedBoostifyInternationalPage, 'premium')}
          
          {/* Rutas administrativas especiales */}
          {getRouteComponent("/admin", WrappedAdminPage, 'free')} {/* Admin tiene acceso con verificación especial */}
          
          {/* Rutas que requieren autenticación con plan 'free' mínimo */}
          {getRouteComponent("/boostify-tv", WrappedBoostifyTVPage, 'free')}
          {getRouteComponent("/artist-image-advisor-improved", WrappedArtistImageAdvisorImproved, 'free')}
          {getRouteComponent("/image-generator-simple", WrappedImageGeneratorSimplePage, 'free')}
          {getRouteComponent("/face-swap", WrappedFaceSwapPage, 'free')}
          {getRouteComponent("/kling-tools", WrappedKlingToolsPage, 'free')}
          {getRouteComponent("/kling-store", WrappedKlingStorePage, 'free')}
          {getRouteComponent("/kling-test", WrappedKlingTestPage, 'free')}
          {getRouteComponent("/video-generation-test", WrappedVideoGenerationTestPage, 'free')}
          {getRouteComponent("/camera-movements-test", WrappedCameraMovementsTestPage, 'free')}
          {getRouteComponent("/music-mastering", WrappedMusicMasteringPage, 'free')}
          {getRouteComponent("/vrl", WrappedVirtualRecordLabelPage, 'free')}
          {getRouteComponent("/virtual-record-label", WrappedVirtualRecordLabelPage, 'free')}
          {getRouteComponent("/test-progress", WrappedTestProgressPage, 'free')}
          {getRouteComponent("/plugins", WrappedPluginsPage, 'free')}
          {getRouteComponent("/try-on", WrappedTryOnPage, 'free')}
          {getRouteComponent("/try-on-page", WrappedTryOnPage, 'free')}
          {getRouteComponent("/professional-editor", WrappedProfessionalEditorPage, 'free')}
          {getRouteComponent("/layer-filter-demo", WrappedLayerFilterDemoPage, 'free')}
          {getRouteComponent("/animated-workflow", WrappedAnimatedWorkflowPage, 'free')}
          {getRouteComponent("/tokenization", WrappedTokenizationPage, 'free')}
          {getRouteComponent("/resources", WrappedResourcesPage, null)}
          {getRouteComponent("/tips", WrappedTipsPage, null)}
          {getRouteComponent("/guides", WrappedGuidesPage, null)}
          {getRouteComponent("/tools", WrappedToolsPage, null)}
          {getRouteComponent("/features", WrappedFeaturesPage, null)}
          {getRouteComponent("/tools/royalty-calculator", WrappedToolsPage, 'free')}
          {getRouteComponent("/tools/press-kit", WrappedToolsPage, 'free')}
          {getRouteComponent("/tools/release-planner", WrappedToolsPage, 'free')}
          {getRouteComponent("/tools/playlist-submission", WrappedToolsPage, 'free')}
          {getRouteComponent("/ai-video-creation", WrappedAIVideoCreationPage, 'free')}
          {getRouteComponent("/timeline-demo", WrappedTimelineDemoPage, 'free')}
          {getRouteComponent("/debug-firebase", WrappedDebugFirebasePage, null)}
          
          {/* Página de error 404 */}
          <Route component={WrappedNotFound} />
        </Switch>
      </Suspense>
      <BottomNav />
      {showRadio && <BoostifyRadio onClose={() => setShowRadio(false)} />}
      {/* CustomerServiceAgent - Temporarily disabled */}
      {/* <CustomerServiceAgent /> */}
    </>
  );
};

const App = () => {
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    // Ya no necesitamos verificar los activos críticos porque
    // los hemos configurado correctamente en index.html
    
    return () => {
      // No hay temporizadores para limpiar
    };
  }, []);

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md p-8 rounded-lg bg-card border text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Initialization Error</h2>
          <p className="text-muted-foreground mb-4">{initError.message}</p>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Componente invisible para manejar errores de WebSocket */}
      <div className="min-h-screen bg-background text-foreground">
        <ViteHMRErrorHandler />
        <QueryClientProvider client={queryClient}>
          <SubscriptionProvider>
            <GlobalAuthGuard>
              <EditorProvider>
                <Router />
                <Toaster />
              </EditorProvider>
            </GlobalAuthGuard>
          </SubscriptionProvider>
        </QueryClientProvider>
      </div>
    </ErrorBoundary>
  );
};

export default App;