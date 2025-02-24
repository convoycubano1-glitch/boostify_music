import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

const radioNetworks = [
  {
    category: "National Networks",
    networks: [
      { name: "iHeartRadio", url: "https://www.iheartradio.com" },
      { name: "Cumulus Media", url: "https://www.cumulus.com" },
      { name: "Entercom", url: "https://www.audacy.com" },
      { name: "NPR", url: "https://www.npr.org" }
    ]
  },
  {
    category: "Local Stations",
    networks: [
      { name: "CBS Radio", url: "https://www.audacy.com/stations" },
      { name: "Cox Radio", url: "https://www.coxmedia.com/radio" },
      { name: "Salem Media Group", url: "https://salemmedia.com" },
      { name: "Townsquare Media", url: "https://www.townsquaremedia.com" }
    ]
  },
  {
    category: "Internet Radio",
    networks: [
      { name: "Pandora", url: "https://www.pandora.com" },
      { name: "TuneIn", url: "https://tunein.com" },
      { name: "Live365", url: "https://live365.com" },
      { name: "Radio.com", url: "https://www.radio.com" }
    ]
  }
];

interface RadioNetworksDialogProps {
  children: React.ReactNode;
}

export function RadioNetworksDialog({ children }: RadioNetworksDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Radio Networks Directory</DialogTitle>
          <DialogDescription>
            Connect with leading radio networks and expand your music's reach
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {radioNetworks.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold text-lg mb-3">{category.category}</h3>
              <div className="grid gap-3">
                {category.networks.map((network) => (
                  <a
                    key={network.name}
                    href={network.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-orange-500/20 hover:bg-orange-500/5 hover:border-orange-500/40 transition-all"
                  >
                    <span className="font-medium">{network.name}</span>
                    <ExternalLink className="h-4 w-4 text-orange-500" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
