import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ArtistDashboard from "@/pages/artist-dashboard";
import HomePage from "@/pages/home";
import SpotifyPage from "@/pages/spotify";
import ContractsPage from "@/pages/contracts";
import PRPage from "@/pages/pr";
import NewsPage from "@/pages/news";
import EventsPage from "@/pages/events";
import AnalyticsPage from "@/pages/analytics";
import GlobalPage from "@/pages/global";
import VideosPage from "@/pages/videos";
import BlogPage from "@/pages/blog";
import PromotionPage from "@/pages/promotion";
import SettingsPage from "@/pages/settings";
import YoutubeViewsPage from "@/pages/youtube-views";
import InstagramBoostPage from "@/pages/instagram-boost";
import ContactsPage from "@/pages/contacts";
import MessagesPage from "@/pages/messages";
import ManagerToolsPage from "@/pages/manager-tools";
import ProducerToolsPage from "@/pages/producer-tools";
import MusicVideoCreator from "@/pages/music-video-creator";
import RecordLabelServices from "@/pages/record-label-services";
import AIAgentsPage from "@/pages/ai-agents";
import ArtistImageAdvisor from "@/pages/artist-image-advisor";

const Router = () => {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/artist-dashboard" component={ArtistDashboard} />
      <ProtectedRoute path="/spotify" component={SpotifyPage} />
      <ProtectedRoute path="/contracts" component={ContractsPage} />
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