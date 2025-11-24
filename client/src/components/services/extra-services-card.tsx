import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ExtraServiceCardProps {
  id: number;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  image?: string;
  extraFast?: boolean;
  category: string;
  onOrderCreated?: () => void;
}

export function ExtraServiceCard({
  id,
  title,
  price,
  rating,
  reviews,
  image,
  extraFast,
  category,
  onOrderCreated,
}: ExtraServiceCardProps) {
  const [loading, setLoading] = useState(false);

  const handleAddService = async () => {
    try {
      setLoading(true);
      const result = await apiRequest('/api/services/order', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: id,
          quantity: 1,
          category,
        }),
      });

      if (result.success) {
        toast({
          title: 'Service Added',
          description: 'Proceeding to checkout...',
        });
        onOrderCreated?.();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to add service',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add service',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {image && (
        <div className="h-40 bg-gray-100 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E';
            }}
          />
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{title}</h3>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating.toFixed(2)}</span>
            <span className="text-xs text-gray-500">({reviews})</span>
          </div>
          {extraFast && (
            <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded text-xs font-semibold text-orange-700">
              <Zap className="w-3 h-3" />
              Fast
            </div>
          )}
        </div>
        <div className="text-lg font-bold text-primary">${price.toFixed(2)}</div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddService}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          {loading ? 'Adding...' : 'Add to Order'}
        </Button>
      </CardFooter>
    </Card>
  );
}
