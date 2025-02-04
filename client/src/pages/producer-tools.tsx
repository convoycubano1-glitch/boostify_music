import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { 
  Music2, 
  DollarSign, 
  Star,
  Music4,
  Mic2,
  Guitar,
  Drum,
  Piano,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

interface MusicianService {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  instrument: string;
  rating: number;
  totalReviews: number;
}

export default function ProducerToolsPage() {
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["musician-services"],
    queryFn: async () => {
      const servicesRef = collection(db, "musician-services");
      const q = query(
        servicesRef,
        orderBy("rating", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MusicianService[];
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Producer Tools
              </h1>
              <p className="text-muted-foreground mt-2">
                Connect with musicians and producers worldwide
              </p>
            </div>
            <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  List Your Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>List Your Music Service</DialogTitle>
                  <DialogDescription>
                    Offer your musical talents and set your own rates
                  </DialogDescription>
                </DialogHeader>
                {/* Service Form Component will go here */}
              </DialogContent>
            </Dialog>
          </div>

          {/* Service Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="p-4 text-center hover:bg-orange-500/5 cursor-pointer transition-colors">
              <Guitar className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">Guitar</p>
            </Card>
            <Card className="p-4 text-center hover:bg-orange-500/5 cursor-pointer transition-colors">
              <Drum className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">Drums</p>
            </Card>
            <Card className="p-4 text-center hover:bg-orange-500/5 cursor-pointer transition-colors">
              <Piano className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">Piano</p>
            </Card>
            <Card className="p-4 text-center hover:bg-orange-500/5 cursor-pointer transition-colors">
              <Mic2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">Vocals</p>
            </Card>
            <Card className="p-4 text-center hover:bg-orange-500/5 cursor-pointer transition-colors">
              <Music4 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">Production</p>
            </Card>
            <Card className="p-4 text-center hover:bg-orange-500/5 cursor-pointer transition-colors">
              <Music2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <p className="font-medium">Other</p>
            </Card>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <div className="aspect-video bg-orange-500/10 relative">
                  {/* Service preview/image placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Music2 className="h-12 w-12 text-orange-500/50" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="font-medium">{service.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({service.totalReviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">${service.price}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
                    Book Service
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
