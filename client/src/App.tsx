import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";
import AIAgentsPage from "@/pages/ai-agents";
import AnalyticsPage from "@/pages/analytics";
import ArtistDashboard from "@/pages/artist-dashboard";
import ArtistImageAdvisor from "@/pages/artist-image-advisor";
import BlogPage from "@/pages/blog";
import BoostifyInternationalPage from "@/pages/boostify-international";
import BoostifyTVPage from "@/pages/boostify-tv";
import ContactsPage from "@/pages/contacts";
import ContractsPage from "@/pages/contracts";
import CookiesPage from "@/pages/cookies";
import DashboardPage from "@/pages/dashboard";
import EcosystemPage from "@/pages/ecosystem";
import EventsPage from "@/pages/events";
import GlobalPage from "@/pages/global";
import HomePage from "@/pages/home";
import InstagramBoostPage from "@/pages/instagram-boost";
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

const Router = () => {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/cookies" component={CookiesPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      <ProtectedRoute path="/artist-dashboard" component={ArtistDashboard} />
      <ProtectedRoute path="/spotify" component={SpotifyPage} />
      <ProtectedRoute path="/contracts" component={ContractsPage} />
      <ProtectedRoute path="/boostify-international" component={BoostifyInternationalPage} />
      <ProtectedRoute path="/boostify-tv" component={BoostifyTVPage} />
      <ProtectedRoute path="/pr" component={PRPage} />
      <ProtectedRoute path="/news" component={NewsPage} />
      <ProtectedRoute path="/events" component={EventsPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/global" component={GlobalPage} />
      <ProtectedRoute path="/videos" component={VideosPage} />
      <ProtectedRoute path="/blog" component={BlogPage} />
      <ProtectedRoute path="/promotion" component={PromotionPage} />
      <ProtectedRoute path="/youtube-views" component={YoutubeViewsPage} />
      <ProtectedRoute path="/instagram-boost" component={InstagramBoostPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/contacts" component={ContactsPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/manager-tools" component={ManagerToolsPage} />
      <ProtectedRoute path="/producer-tools" component={ProducerToolsPage} />
      <ProtectedRoute path="/music-video-creator" component={MusicVideoCreator} />
      <ProtectedRoute path="/record-label-services" component={RecordLabelServices} />
      <ProtectedRoute path="/ai-agents" component={AIAgentsPage} />
      <ProtectedRoute path="/artist-image-advisor" component={ArtistImageAdvisor} />
      <ProtectedRoute path="/merchandise" component={MerchandisePage} />
      <ProtectedRoute path="/ecosystem" component={EcosystemPage} />
      <ProtectedRoute path="/store" component={StorePage} />
      <ProtectedRoute path="/translator" component={RealTimeTranslator} />
      <ProtectedRoute path="/education" component={EducationPage} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} />
      <Route component={NotFound} />
    </Switch>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;