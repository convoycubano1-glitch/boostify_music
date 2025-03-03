import React, { ReactNode, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";
import AIAgentsPage from "@/pages/ai-agents";
import AIAdvisorsPage from "@/pages/ai-advisors";
import AnalyticsPage from "@/pages/analytics";
import AnalyticsDashboardPage from "@/pages/analytics-dashboard";
import ArtistDashboard from "@/pages/artist-dashboard";
import ArtistImageAdvisor from "@/pages/artist-image-advisor";
import ArtistGeneratorPage from "@/pages/artist-generator";
import BlogPage from "@/pages/blog";
import BoostifyInternationalPage from "@/pages/boostify-international";
import BoostifyTVPage from "@/pages/boostify-tv";
import ContactsPage from "@/pages/contacts";
import ContractsPage from "@/pages/contracts";
import CookiesPage from "@/pages/cookies";
import DashboardPage from "@/pages/dashboard";
import EcosystemPage from "@/pages/ecosystem";
import EventsPage from "@/pages/events";
import FaceSwapPage from "@/pages/face-swap";
import GlobalPage from "@/pages/global";
import HomePage from "@/pages/home";
import ImageGeneratorPage from "@/pages/image-generator";
import ImageGeneratorSimplePage from "@/pages/image-generator-simple";
import InstagramBoostPage from "@/pages/instagram-boost";
import KlingToolsPage from "@/pages/kling-tools";
import ManagerToolsPage from "@/pages/manager-tools";
import MerchandisePage from "@/pages/merchandise";
import MessagesPage from "@/pages/messages";
import MusicVideoCreator from "@/pages/music-video-creator";
import NewsPage from "@/pages/news";
import PRPage from "@/pages/pr";
import PrivacyPage from "@/pages/privacy";
import ProducerToolsPage from "@/pages/producer-tools";
import PromotionPage from "@/pages/promotion";
import RecordLabelServices from "@/pages/record-label-services";
import SettingsPage from "@/pages/settings";
import SpotifyPage from "@/pages/spotify";
import StorePage from "@/pages/store";
import TermsPage from "@/pages/terms";
import VideosPage from "@/pages/videos";
import YoutubeViewsPage from "@/pages/youtube-views";
import RealTimeTranslator from "@/pages/real-time-translator";
import EducationPage from "@/pages/education";
import AchievementsPage from "@/pages/achievements-page";
import CourseDetailPage from "@/pages/course-detail";
import SmartCardsPage from "@/pages/smart-cards";
import InvestorsDashboard from "@/pages/investors-dashboard";
import SocialNetworkPage from "@/pages/social-network";
import FirestoreSocialPage from "@/pages/firestore-social";
import { BottomNav } from "@/components/layout/bottom-nav";
import ProfilePage from "@/pages/profile";
import { BoostifyRadio } from "@/components/radio/boostify-radio";
import { CustomerServiceAgent } from "@/components/agents/customer-service-agent";
import AffiliatesPage from "@/pages/affiliates";
import TestPage from "@/pages/test-page";

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
  const WrappedAnalyticsDashboardPage = withPageWrapper(AnalyticsDashboardPage);
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
  const WrappedRecordLabelServices = withPageWrapper(RecordLabelServices);
  const WrappedAIAgentsPage = withPageWrapper(AIAgentsPage);
  const WrappedAIAdvisorsPage = withPageWrapper(AIAdvisorsPage);
  const WrappedArtistImageAdvisor = withPageWrapper(ArtistImageAdvisor);
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
  const WrappedSocialNetworkPage = withPageWrapper(SocialNetworkPage);
  const WrappedFirestoreSocialPage = withPageWrapper(FirestoreSocialPage);
  const WrappedImageGeneratorPage = withPageWrapper(ImageGeneratorPage);
  const WrappedImageGeneratorSimplePage = withPageWrapper(ImageGeneratorSimplePage);
  const WrappedFaceSwapPage = withPageWrapper(FaceSwapPage);
  const WrappedKlingToolsPage = withPageWrapper(KlingToolsPage);
  const WrappedTestPage = withPageWrapper(TestPage);
  const WrappedNotFound = withPageWrapper(NotFound);

  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={WrappedHomePage} />
        <Route path="/terms" component={WrappedTermsPage} />
        <Route path="/privacy" component={WrappedPrivacyPage} />
        <Route path="/cookies" component={WrappedCookiesPage} />
        <Route path="/profile/:id" component={WrappedProfilePage} />

        {/* Protected routes */}
        <ProtectedRoute path="/dashboard" component={WrappedDashboardPage} />
        <ProtectedRoute path="/admin" component={WrappedAdminPage} />
        <ProtectedRoute path="/artist-dashboard" component={WrappedArtistDashboard} />
        <ProtectedRoute path="/spotify" component={WrappedSpotifyPage} />
        <ProtectedRoute path="/contracts" component={WrappedContractsPage} />
        <ProtectedRoute path="/boostify-international" component={WrappedBoostifyInternationalPage} />
        <ProtectedRoute path="/boostify-tv" component={WrappedBoostifyTVPage} />
        <ProtectedRoute path="/pr" component={WrappedPRPage} />
        <ProtectedRoute path="/news" component={WrappedNewsPage} />
        <ProtectedRoute path="/events" component={WrappedEventsPage} />
        <ProtectedRoute path="/analytics" component={WrappedAnalyticsPage} />
        <ProtectedRoute path="/analytics-dashboard" component={WrappedAnalyticsDashboardPage} />
        <ProtectedRoute path="/global" component={WrappedGlobalPage} />
        <ProtectedRoute path="/videos" component={WrappedVideosPage} />
        <ProtectedRoute path="/blog" component={WrappedBlogPage} />
        <ProtectedRoute path="/promotion" component={WrappedPromotionPage} />
        <ProtectedRoute path="/youtube-views" component={WrappedYoutubeViewsPage} />
        <ProtectedRoute path="/instagram-boost" component={WrappedInstagramBoostPage} />
        <ProtectedRoute path="/settings" component={WrappedSettingsPage} />
        <ProtectedRoute path="/contacts" component={WrappedContactsPage} />
        <ProtectedRoute path="/messages" component={WrappedMessagesPage} />
        <ProtectedRoute path="/manager-tools" component={WrappedManagerToolsPage} />
        <ProtectedRoute path="/producer-tools" component={WrappedProducerToolsPage} />
        <ProtectedRoute path="/music-video-creator" component={WrappedMusicVideoCreator} />
        <ProtectedRoute path="/record-label-services" component={WrappedRecordLabelServices} />
        <ProtectedRoute path="/ai-agents" component={WrappedAIAgentsPage} />
        <ProtectedRoute path="/ai-advisors" component={WrappedAIAdvisorsPage} />
        <ProtectedRoute path="/artist-image-advisor" component={WrappedArtistImageAdvisor} />
        <ProtectedRoute path="/artist-generator" component={WrappedArtistGeneratorPage} />
        <ProtectedRoute path="/merchandise" component={WrappedMerchandisePage} />
        <ProtectedRoute path="/ecosystem" component={WrappedEcosystemPage} />
        <ProtectedRoute path="/store" component={WrappedStorePage} />
        <ProtectedRoute path="/translator" component={WrappedRealTimeTranslator} />
        <ProtectedRoute path="/education" component={WrappedEducationPage} />
        <ProtectedRoute path="/achievements" component={WrappedAchievementsPage} />
        <ProtectedRoute path="/course/:id" component={WrappedCourseDetailPage} />
        <ProtectedRoute path="/smart-cards" component={WrappedSmartCardsPage} />
        <ProtectedRoute path="/profile" component={WrappedProfilePage} />
        <ProtectedRoute path="/investors-dashboard" component={WrappedInvestorsDashboard} />
        <ProtectedRoute path="/affiliates" component={WrappedAffiliatesPage} />
        <ProtectedRoute path="/social-network" component={WrappedSocialNetworkPage} />
        <ProtectedRoute path="/firestore-social" component={WrappedFirestoreSocialPage} />
        <ProtectedRoute path="/image-generator" component={WrappedImageGeneratorPage} />
        <Route path="/image-generator-simple" component={WrappedImageGeneratorSimplePage} />
        <Route path="/face-swap" component={WrappedFaceSwapPage} />
        <Route path="/kling-tools" component={WrappedKlingToolsPage} />
        <Route path="/test" component={WrappedTestPage} />
        
        {/* Catch all not found route */}
        <Route component={WrappedNotFound} />
      </Switch>
      <BottomNav />
      {showRadio && <BoostifyRadio onClose={() => setShowRadio(false)} />}
      <CustomerServiceAgent />
    </>
  );
};

const App = () => {
  const [initError, setInitError] = useState<Error | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!document.querySelector('script[src*="index-"]')) {
        console.warn('Critical assets may not have loaded properly');
      }
    }, 5000);

    return () => clearTimeout(timer);
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;