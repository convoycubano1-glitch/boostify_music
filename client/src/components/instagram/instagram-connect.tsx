import { Button } from "@/components/ui/button";
import { SiInstagram } from "react-icons/si";
import { Card } from "@/components/ui/card";

export function InstagramConnect() {
  const handleConnect = () => {
    // Will implement OAuth flow later
    window.location.href = `/api/instagram/auth`;
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
      <div className="text-center py-8">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-full animate-ping opacity-20"></div>
          <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-full">
            <SiInstagram className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2">Connect Your Instagram Account</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Link your Instagram account to showcase your content and track engagement
        </p>
        <Button 
          className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white gap-2"
          size="lg"
          onClick={handleConnect}
        >
          <SiInstagram className="w-5 h-5" />
          Connect Instagram
        </Button>
      </div>
    </Card>
  );
}
