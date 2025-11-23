import { Header } from "../components/layout/header";
import { PaymentArtistDashboard } from "../components/services/PaymentArtistDashboard";
import { useAuth } from "../hooks/use-auth";
import { Redirect } from "wouter";

export default function EarningsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your earnings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth?returnTo=/earnings" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PaymentArtistDashboard />
      </div>
    </div>
  );
}
