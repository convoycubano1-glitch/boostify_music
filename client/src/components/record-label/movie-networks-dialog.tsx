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

const movieNetworks = [
  {
    category: "Film Production Companies",
    networks: [
      { name: "Universal Pictures", url: "https://www.universalpictures.com" },
      { name: "Paramount Pictures", url: "https://www.paramount.com" },
      { name: "Warner Bros.", url: "https://www.warnerbros.com" },
      { name: "Sony Pictures", url: "https://www.sonypictures.com" }
    ]
  },
  {
    category: "Music Licensing for Film",
    networks: [
      { name: "INDART MUSIC", url: "https://www.indartmusic.com" },
      { name: "Musicbed", url: "https://www.musicbed.com" },
      { name: "Music Supervisor", url: "https://www.musicsupervisor.com" },
      { name: "Epidemic Sound", url: "https://www.epidemicsound.com" }
    ]
  },
  {
    category: "Independent Film Distributors",
    networks: [
      { name: "A24", url: "https://a24films.com" },
      { name: "Neon", url: "https://neonrated.com" },
      { name: "IFC Films", url: "https://www.ifcfilms.com" },
      { name: "Magnolia Pictures", url: "https://www.magnoliapictures.com" }
    ]
  }
];

interface MovieNetworksDialogProps {
  children: React.ReactNode;
}

export function MovieNetworksDialog({ children }: MovieNetworksDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Movie Sync Licensing Directory</DialogTitle>
          <DialogDescription>
            License your music for films, documentaries, and other visual media
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {movieNetworks.map((category) => (
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
