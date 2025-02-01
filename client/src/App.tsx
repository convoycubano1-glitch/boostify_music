import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import HomePage from "@/pages/home";
import SpotifyPage from "@/pages/spotify";
import ContractsPage from "@/pages/contracts";
import PRPage from "@/pages/pr";
import SettingsPage from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/spotify" component={SpotifyPage} />
      <Route path="/contracts" component={ContractsPage} />
      <Route path="/pr" component={PRPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;