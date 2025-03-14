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
import NotFound from "./pages/not-found";
import AdminPage from "./pages/admin";
import AIAgentsPage from "./pages/ai-agents";
import AIAdvisorsPage from "./pages/ai-advisors";
import AnalyticsPage from "./pages/analytics";
import AnalyticsDashboardPage from "./pages/analytics-dashboard";
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
import VirtualRecordLabelPage from "./pages/virtual-record-label";
import AccountPage from "./pages/account";

const App = () => {
  const { toast } = useToast();
  const [hasError, setHasError] = useState(false);

  // Manejador global de errores
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Error no capturado:", event.error);
      setHasError(true);
      toast({
        title: "Error en la aplicación",
        description: "Ha ocurrido un error inesperado. Por favor, recarga la página.",
        variant: "destructive",
      });
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <EditorProvider>
            <ViteHMRErrorHandler />
            <Toaster />
            <WouterRouter>
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/admin" component={AdminPage} />
                <Route path="/ai-advisors" component={AIAdvisorsPage} />
                <Route path="/ai-agents" component={AIAgentsPage} />
                <Route path="/analytics" component={AnalyticsPage} />
                <Route path="/analytics-dashboard" component={AnalyticsDashboardPage} />
                <Route path="/artist-dashboard" component={ArtistDashboard} />
                <Route path="/artist-generator" component={ArtistGeneratorPage} />
                <Route path="/artist-image-advisor" component={ArtistImageAdvisor} />
                <Route path="/artist-image-advisor-improved" component={ArtistImageAdvisorImproved} />
                <Route path="/blog" component={BlogPage} />
                <Route path="/boostify-international" component={BoostifyInternationalPage} />
                <Route path="/boostify-tv" component={BoostifyTVPage} />
                <Route path="/camera-movements-test" component={CameraMovementsTestPage} />
                <Route path="/contacts" component={ContactsPage} />
                <Route path="/contracts" component={ContractsPage} />
                <Route path="/cookies" component={CookiesPage} />
                <Route path="/dashboard" component={DashboardPage} />
                <Route path="/ecosystem" component={EcosystemPage} />
                <Route path="/education" component={EducationPage} />
                <Route path="/course/:id" component={CourseDetailPage} />
                <Route path="/events" component={EventsPage} />
                <Route path="/face-swap" component={FaceSwapPage} />
                <Route path="/global" component={GlobalPage} />
                <Route path="/image-generator" component={ImageGeneratorPage} />
                <Route path="/image-generator-simple" component={ImageGeneratorSimplePage} />
                <Route path="/instagram-boost" component={InstagramBoostPage} />
                <Route path="/investors-dashboard" component={InvestorsDashboard} />
                <Route path="/kling-store" component={KlingStorePage} />
                <Route path="/kling-test" component={KlingTestPage} />
                <Route path="/kling-tools" component={KlingToolsPage} />
                <Route path="/manager-tools" component={ManagerToolsPage} />
                <Route path="/merchandise" component={MerchandisePage} />
                <Route path="/messages" component={MessagesPage} />
                <Route path="/music-generator" component={MusicGeneratorPage} />
                <Route path="/music-video-creator" component={MusicVideoCreator} />
                <Route path="/music-video-workflow" component={MusicVideoWorkflowPage} />
                <Route path="/news" component={NewsPage} />
                <Route path="/pr" component={PRPage} />
                <Route path="/privacy" component={PrivacyPage} />
                <Route path="/producer-tools" component={ProducerToolsPage} />
                <Route path="/promotion" component={PromotionPage} />
                <Route path="/record-label-services" component={RecordLabelServices} />
                <Route path="/real-time-translator" component={RealTimeTranslator} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/smart-cards" component={SmartCardsPage} />
                <Route path="/social-network" component={SocialNetworkPage} />
                <Route path="/firestore-social" component={FirestoreSocialPage} />
                <Route path="/spotify" component={SpotifyPage} />
                <Route path="/store" component={StorePage} />
                <Route path="/terms" component={TermsPage} />
                <Route path="/try-on" component={TryOnPage} />
                <Route path="/video-generation-test" component={VideoGenerationTestPage} />
                <Route path="/videos" component={VideosPage} />
                <Route path="/virtual-record-label" component={VirtualRecordLabelPage} />
                <Route path="/youtube-views" component={YoutubeViewsPage} />
                <Route path="/account" component={AccountPage} />

                {/* Ruta para manejar rutas no encontradas */}
                <Route component={NotFound} />
              </Switch>
            </WouterRouter>
          </EditorProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;