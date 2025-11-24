import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExtraServiceCard } from './extra-services-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface ExtraServicesSectionProps {
  category: 'youtube_boost' | 'spotify_boost' | 'instagram_boost';
  title?: string;
  description?: string;
  onOrderCreated?: () => void;
}

export function ExtraServicesSection({
  category,
  title = 'Premium Services',
  description = 'Enhance your boost with expert services from verified creators',
  onOrderCreated,
}: ExtraServicesSectionProps) {
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/services', category],
    queryFn: async () => {
      const res = await fetch(`/api/services?category=${category}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const handleOrderCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/services/orders'] });
    onOrderCreated?.();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 py-8">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service: any) => (
          <ExtraServiceCard
            key={service.id}
            id={service.id}
            title={service.title}
            price={parseFloat(service.boostifyPrice)}
            rating={parseFloat(service.sellerRating)}
            reviews={service.sellerReviews}
            image={service.imageUrl}
            extraFast={service.extraFast}
            category={category}
            sellerDisplayName={service.sellerDisplayName}
            deliveryDays={service.deliveryDays}
            onOrderCreated={handleOrderCreated}
          />
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <span className="text-primary font-semibold mt-0.5">💡</span>
          <span>All services are delivered by verified creators and charged separately. Your satisfaction is guaranteed with secure payment through Stripe. Available to all users.</span>
        </p>
      </div>
    </div>
  );
}
