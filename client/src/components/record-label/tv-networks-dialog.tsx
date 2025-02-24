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

const tvNetworks = [
  {
    category: "Music Licensing Companies",
    networks: [
      { name: "INDART MUSIC", url: "https://www.indartmusic.com" },
      { name: "Universal Production Music", url: "https://www.universalproductionmusic.com" },
      { name: "Warner Chappell Production Music", url: "https://www.warnerchappellpm.com" },
      { name: "BMG Production Music", url: "https://www.bmgproductionmusic.com" }
    ]
  },
  {
    category: "TV Networks",
    networks: [
      { name: "NBC Universal", url: "https://www.nbcuniversal.com" },
      { name: "CBS", url: "https://www.paramount.com" },
      { name: "ABC", url: "https://www.abc.com" },
      { name: "FOX", url: "https://www.fox.com" }
    ]
  },
  {
    category: "Streaming Platforms",
    networks: [
      { name: "Netflix", url: "https://www.netflix.com" },
      { name: "Amazon Prime", url: "https://www.primevideo.com" },
      { name: "Disney+", url: "https://www.disneyplus.com" },
      { name: "HBO Max", url: "https://www.max.com" }
    ]
  }
];

interface TVNetworksDialogProps {
  children: React.ReactNode;
}

export function TVNetworksDialog({ children }: TVNetworksDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>TV Licensing Directory</DialogTitle>
          <DialogDescription>
            License your music to leading TV networks and streaming platforms
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {tvNetworks.map((category) => (
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
