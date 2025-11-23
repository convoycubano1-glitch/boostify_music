import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Trash2, Edit2, Download, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface Artist {
  id: number;
  name: string;
  description: string;
  price: string;
  rating: string;
  isActive: boolean;
  genres: string[];
  instrument: string;
  category: string;
  createdAt: string;
  photo?: string;
  referencePhoto?: string;
  totalReviews?: number;
}

interface ArtistsManagerProps {
  onRefresh?: () => void;
}

export function ArtistsManager({ onRefresh }: ArtistsManagerProps) {
  const { toast } = useToast();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    loadArtists();
  }, [search]);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ search });
      const response = await fetch(`/api/admin/artists?${query}`);
      const data = await response.json();
      setArtists(data.artists || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error loading artists',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;

    try {
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Artist deleted successfully'
        });
        loadArtists();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error deleting artist',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingArtist) return;

    try {
      const response = await fetch(`/api/admin/artists/${editingArtist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingArtist.name,
          description: editingArtist.description,
          price: editingArtist.price,
          rating: editingArtist.rating,
          isActive: editingArtist.isActive,
          genres: editingArtist.genres,
          instrument: editingArtist.instrument,
          category: editingArtist.category
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Artist updated successfully'
        });
        setShowEditDialog(false);
        loadArtists();
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error updating artist',
        variant: 'destructive'
      });
    }
  };

  const exportData = () => {
    const csv = [
      ['ID', 'Name', 'Instrument', 'Category', 'Price', 'Rating', 'Active', 'Genres', 'Reviews'].join(','),
      ...artists.map(a => [
        a.id,
        `"${a.name}"`,
        a.instrument,
        a.category,
        a.price,
        a.rating,
        a.isActive ? 'Yes' : 'No',
        `"${a.genres.join(';')}"`,
        a.totalReviews || 0
      ].join(','))
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'artists.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search artists by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border-slate-700"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadArtists}
            variant="outline"
            size="sm"
            className="border-cyan-500/50 text-cyan-300"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
            className="border-cyan-500/50 text-cyan-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Artists Table */}
      <Card className="bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-cyan-500/20">
        <CardHeader>
          <CardTitle className="text-cyan-300">
            Artists Database ({artists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading artists...</div>
          ) : artists.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No artists found</div>
          ) : (
            <ScrollArea className="h-[600px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900">
                  <tr className="border-b border-slate-700">
                    <th className="text-left p-3 text-slate-400">Name</th>
                    <th className="text-left p-3 text-slate-400">Instrument</th>
                    <th className="text-left p-3 text-slate-400">Category</th>
                    <th className="text-left p-3 text-slate-400">Price</th>
                    <th className="text-left p-3 text-slate-400">Rating</th>
                    <th className="text-left p-3 text-slate-400">Status</th>
                    <th className="text-right p-3 text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {artists.map((artist) => (
                    <tr key={artist.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="p-3 text-white font-medium">{artist.name}</td>
                      <td className="p-3 text-slate-400">{artist.instrument}</td>
                      <td className="p-3 text-slate-400">{artist.category}</td>
                      <td className="p-3 text-slate-400">${parseFloat(artist.price).toFixed(2)}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                          {parseFloat(artist.rating).toFixed(1)} ⭐
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={artist.isActive ? 'default' : 'secondary'}
                          className={artist.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}
                        >
                          {artist.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedArtist(artist);
                            }}
                            className="text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingArtist(artist);
                              setShowEditDialog(true);
                            }}
                            className="text-orange-400 hover:bg-orange-500/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(artist.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingArtist && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Artist: {editingArtist.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingArtist.name}
                  onChange={(e) => setEditingArtist({ ...editingArtist, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={editingArtist.description}
                  onChange={(e) => setEditingArtist({ ...editingArtist, description: e.target.value })}
                  className="w-full mt-1 p-2 rounded border border-slate-700 bg-slate-900 text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Instrument</label>
                  <Input
                    value={editingArtist.instrument}
                    onChange={(e) => setEditingArtist({ ...editingArtist, instrument: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={editingArtist.category}
                    onChange={(e) => setEditingArtist({ ...editingArtist, category: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    value={editingArtist.price}
                    onChange={(e) => setEditingArtist({ ...editingArtist, price: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={editingArtist.rating}
                    onChange={(e) => setEditingArtist({ ...editingArtist, rating: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingArtist.isActive}
                  onChange={(e) => setEditingArtist({ ...editingArtist, isActive: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-orange-500 hover:bg-orange-600">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
