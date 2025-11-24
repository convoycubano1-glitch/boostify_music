import { useQuery } from '@tanstack/react-query';
import { ExtraServiceCard } from './extra-services-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface ExtraServicesSectionProps {
  category: 'youtube_boost' | 'spotify_boost' | 'instagram_boost';
  title?: string;
  description?: string;
  onOrderCreated?: () => void;
}

export function ExtraServicesSection({
  category,
  title = 'Premium Services',
  description = 'Enhance your boost with expert services',
  onOrderCreated,
}: ExtraServicesSectionProps) {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ['/api/services', category],
    queryFn: async () => {
      const res = await fetch(`/api/services?category=${category}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-40 mb-4" />
              <Skeleton className="h-4 mb-3" />
              <Skeleton className="h-6" />
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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            onOrderCreated={onOrderCreated}
          />
        ))}
      </div>
    </div>
  );
}
