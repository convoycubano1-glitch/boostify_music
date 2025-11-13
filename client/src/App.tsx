import React, { ReactNode, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { SubscriptionProtectedRoute } from "./lib/subscription-protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useToast } from "./hooks/use-toast";
import { SubscriptionProvider } from "./lib/context/subscription-context";
import { SubscriptionPlan } from "./lib/api/subscription-service";
import { ViteHMRErrorHandler } from "./components/improved-websocket-context";
import { EditorProvider } from "./lib/context/editor-context";
import { GlobalAuthGuard } from "./lib/global-auth-guard";
import NotFound from "./pages/not-found";
import AdminPage from "./pages/admin";
import AIAgentsPage from "./pages/ai-agents";
import AIAdvisorsPage from "./pages/ai-advisors";
import AIAdvisorsPageV2 from "./pages/ai-advisors-v2";
import AnalyticsPage from "./pages/analytics";
import ArtistDashboard from "./pages/artist-dashboard";
import ArtistImageAdvisor from "./pages/artist-image-advisor";
import ArtistImageAdvisorImproved from "./pages/artist-image-advisor-improved";
import ArtistGeneratorPage from "./pages/artist-generator";
import BlogPage from "./pages/blog";
import BoostifyInternationalPage from "./pages/boostify-international";
import BoostifyTVPage from "./pages/boostify-tv";
import ContactsPage from "./pages/contacts";
import ContractsPage from "./pages/contracts";
import CookiesPage from "./pages/cookies";
import DashboardPage from "./pages/dashboard";
import EcosystemPage from "./pages/ecosystem";
import EventsPage from "./pages/events";
import FaceSwapPage from "./pages/face-swap";
import GlobalPage from "./pages/global";
import HomePage from "./pages/home";
import ImageGeneratorPage from "./pages/image-generator";
import ImageGeneratorSimplePage from "./pages/image-generator-simple";
import InstagramBoostPage from "./pages/instagram-boost";
import KlingToolsPage from "./pages/kling-tools";
import KlingStorePage from "./pages/kling-store";
import KlingTestPage from "./pages/kling-test";
import ManagerToolsPage from "./pages/manager-tools";
import MerchandisePage from "./pages/merchandise";
import MessagesPage from "./pages/messages";
import MusicVideoCreator from "./pages/music-video-creator";
import MusicVideoWorkflowPage from "./pages/music-video-workflow-page";
import MusicVideoWorkflowEnhancedPage from "./pages/music-video-workflow-enhanced";
import MusicGeneratorPage from "./pages/music-generator";
import NewsPage from "./pages/news";
import PRPage from "./pages/pr";
import PrivacyPage from "./pages/privacy";
import ProducerToolsPage from "./pages/producer-tools";
import PromotionPage from "./pages/promotion";
import RecordLabelServices from "./pages/record-label-services";
import SettingsPage from "./pages/settings";
import SpotifyPage from "./pages/spotify";
import StorePage from "./pages/store";
import TermsPage from "./pages/terms";
import TryOnPage from "./pages/try-on-page";
import VideosPage from "./pages/videos";
import VideoGenerationTestPage from "./pages/video-generation-test";
import CameraMovementsTestPage from "./pages/camera-movements-test";
import YoutubeViewsPage from "./pages/youtube-views";
import RealTimeTranslator from "./pages/real-time-translator";
import EducationPage from "./pages/education";
import AchievementsPage from "./pages/achievements-page";
import CourseDetailPage from "./pages/course-detail";
import SmartCardsPage from "./pages/smart-cards";
import InvestorsDashboard from "./pages/investors-dashboard";
import SocialNetworkPage from "./pages/social-network";
import FirestoreSocialPage from "./pages/firestore-social";
import { BottomNav } from "./components/layout/bottom-nav";
import ProfilePage from "./pages/profile";
import ArtistProfilePage from "./pages/artist-profile";
import DiagnosticsPage from "./pages/diagnostics";
import { BoostifyRadio } from "./components/radio/boostify-radio";
import { CustomerServiceAgent } from "./components/agents/customer-service-agent";
import AffiliatesPage from "./pages/affiliates";
import InitProductsPage from "./pages/init-products";
import MusicMasteringPage from "./pages/music-mastering";
import VirtualRecordLabelPage from "./pages/virtual-record-label";
import TestProgressPage from "./pages/test-progress";
import AuthPage from "./pages/auth-page";
import PluginsPage from "./pages/plugins";
import PricingPage from "./pages/pricing";
import AccountPage from "./pages/account";
import SubscriptionSuccessPage from "./pages/subscription-success";
import SubscriptionCancelledPage from "./pages/subscription-cancelled";
import MusicVideoSuccess from "./pages/music-video-success";
import MusicVideoCancelled from "./pages/music-video-cancelled";
import SubscriptionExamplePage from "./pages/subscription-example";
import ProfessionalEditorPage from "./pages/professional-editor";
import LayerFilterDemoPage from "./pages/layer-filter-demo";
import AnimatedWorkflowPage from "./pages/animated-workflow";
import TokenizationPage from "./pages/tokenization";
import ResourcesPage from "./pages/resources";
import TipsPage from "./pages/tips";
import GuidesPage from "./pages/guides";
import ToolsPage from "./pages/tools";
import FeaturesPage from "./pages/features";
import AIVideoCreationPage from "./pages/ai-video-creation";
import TimelineDemoPage from "./pages/timeline-demo";
import DebugFirebasePage from "./pages/debug-firebase";

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
      <Switch>
        {/* Rutas públicas - accesibles sin autenticación */}
        {getRouteComponent("/", WrappedHomePage, null)}
        {getRouteComponent("/auth", WrappedAuthPage, null)}
        {getRouteComponent("/diagnostics", WrappedDiagnosticsPage, null)}
        {getRouteComponent("/terms", WrappedTermsPage, null)}
        {getRouteComponent("/privacy", WrappedPrivacyPage, null)}
        {getRouteComponent("/cookies", WrappedCookiesPage, null)}
        {getRouteComponent("/profile/:id", WrappedProfilePage, null)}
        {getRouteComponent("/artist/:slug", WrappedArtistProfilePage, null)}
        {getRouteComponent("/pricing", WrappedPricingPage, null)}
        
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
          <AuthProvider>
            <SubscriptionProvider>
              <GlobalAuthGuard>
                <EditorProvider>
                  <Router />
                  <Toaster />
                </EditorProvider>
              </GlobalAuthGuard>
            </SubscriptionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </div>
    </ErrorBoundary>
  );
};

export default App;