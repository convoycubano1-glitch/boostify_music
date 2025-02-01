import { Button } from "@/components/ui/button";
import { SiInstagram } from "react-icons/si";
import { Card } from "@/components/ui/card";

export function InstagramConnect() {
  const handleConnect = () => {
    // Will implement OAuth flow later
    window.location.href = `/api/instagram/auth`;
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#F77737]/20" />

      {/* Instagram Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-3 gap-0.5 h-full">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-sm" />
          ))}
        </div>
      </div>

      <div className="relative text-center py-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-full animate-ping opacity-20"></div>
          <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-full">
            <SiInstagram className="w-10 h-10 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-3">Connect Instagram</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Boost your social presence by connecting your Instagram account. Track engagement, manage content, and grow your audience.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Button 
            className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white gap-2 px-8"
            size="lg"
            onClick={handleConnect}
          >
            <SiInstagram className="w-5 h-5" />
            Connect Instagram
          </Button>
          <span className="text-xs text-muted-foreground">
            Powered by Instagram Basic Display API
          </span>
        </div>

        {/* Stats Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {[
            { label: "Followers", value: "0" },
            { label: "Following", value: "0" },
            { label: "Posts", value: "0" }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}