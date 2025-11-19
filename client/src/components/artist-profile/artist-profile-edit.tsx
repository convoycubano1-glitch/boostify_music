import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { Save, X, Upload, Music, ShoppingBag, Image as ImageIcon, Trash2, Sparkles, FileText } from "lucide-react";
import type { ArtistProfile, Song, Merchandise } from "../../pages/artist-profile";
import { Textarea } from "../ui/textarea";
import { AIAssistant } from "./ai-assistant";
import { EPKGenerator } from "./epk-generator";

interface ArtistProfileEditProps {
  profile: ArtistProfile;
  songs: Song[];
  merchandise: Merchandise[];
  currentSlug: string;
  onCancel: () => void;
  onSlugUpdate: (newSlug: string) => void;
}

export function ArtistProfileEdit({
  profile,
  songs,
  merchandise,
  currentSlug,
  onCancel,
  onSlugUpdate
}: ArtistProfileEditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [artistName, setArtistName] = useState(profile.artistName || '');
  const [slug, setSlug] = useState(profile.slug || '');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { artistName: string; slug: string }) => {
      return await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (_, variables) => {
      const newSlug = variables.slug;
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${newSlug}`] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      if (newSlug !== currentSlug) {
        onSlugUpdate(newSlug);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ artistName, slug });
  };

  const handleImageUpload = async (type: 'profile' | 'cover', file: File) => {
    const formData = new FormData();
    formData.append(type === 'profile' ? 'profileImage' : 'coverImage', file);
    
    try {
      await apiRequest('/api/profile/upload', {
        method: 'POST',
        body: formData,
        headers: {},
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/profile/${currentSlug}`] });
      toast({
        title: "Success",
        description: `${type === 'profile' ? 'Profile' : 'Cover'} image uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-edit"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={updateProfileMutation.isPending}
            data-testid="button-save-profile"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="ai-assistant">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="epk">
            <FileText className="h-4 w-4 mr-2" />
            EPK Generator
          </TabsTrigger>
          <TabsTrigger value="songs">Songs ({songs.length})</TabsTrigger>
          <TabsTrigger value="merch">Merch ({merchandise.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="artistName">Artist Name</Label>
                <Input
                  id="artistName"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Your artist name"
                  data-testid="input-artist-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Profile URL (slug)
                  <span className="text-sm text-muted-foreground ml-2">
                    boostify.com/{slug || 'your-name'}
                  </span>
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-artist-name"
                  data-testid="input-slug"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  {profile.profileImage && (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('profile', file);
                      }}
                      data-testid="input-profile-image"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: Square image, at least 400x400px
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="space-y-4">
                  {profile.coverImage && (
                    <img
                      src={profile.coverImage}
                      alt="Cover"
                      className="w-full h-48 rounded object-cover"
                    />
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('cover', file);
                      }}
                      data-testid="input-cover-image"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: Wide image, at least 1200x400px
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-6">
          <AIAssistant 
            profileSlug={currentSlug} 
            artistName={artistName}
            onProfileUpdate={() => {
              if (currentSlug) {
                queryClient.invalidateQueries({ queryKey: [`/api/profile/${currentSlug}`] });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="epk" className="space-y-6">
          <EPKGenerator />
        </TabsContent>

        <TabsContent value="songs" className="space-y-6">
          <SongManager userId={profile.id} songs={songs} profileSlug={currentSlug} />
        </TabsContent>

        <TabsContent value="merch" className="space-y-6">
          <MerchManager userId={profile.id} merchandise={merchandise} profileSlug={currentSlug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SongManager({ userId, songs, profileSlug }: { userId: number; songs: Song[]; profileSlug: string | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploadForm, setShowUploadForm] = useState(false);

  const deleteSongMutation = useMutation({
    mutationFn: async (songId: number) => {
      return await apiRequest(`/api/songs/${songId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      if (profileSlug) {
        queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileSlug}`] });
      }
      toast({
        title: "Success",
        description: "Song deleted successfully",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Songs</h3>
        <Button onClick={() => setShowUploadForm(!showUploadForm)} data-testid="button-add-song">
          <Music className="h-4 w-4 mr-2" />
          {showUploadForm ? 'Cancel' : 'Add Song'}
        </Button>
      </div>

      {showUploadForm && <SongUploadForm onSuccess={() => setShowUploadForm(false)} profileSlug={profileSlug} />}

      <div className="space-y-3">
        {songs.map((song) => (
          <Card key={song.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold" data-testid={`text-song-title-${song.id}`}>{song.title}</h4>
                  <p className="text-sm text-muted-foreground">{song.genre || 'No genre'}</p>
                  <p className="text-xs text-muted-foreground">{song.plays} plays</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSongMutation.mutate(song.id)}
                  data-testid={`button-delete-song-${song.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SongUploadForm({ onSuccess, profileSlug }: { onSuccess: () => void; profileSlug: string | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const uploadSongMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest('/api/songs', {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
    onSuccess: () => {
      if (profileSlug) {
        queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileSlug}`] });
      }
      toast({
        title: "Success",
        description: "Song uploaded successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload song",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile || !title) {
      toast({
        title: "Error",
        description: "Please provide title and audio file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('genre', genre);
    formData.append('audio', audioFile);
    if (coverFile) formData.append('coverArt', coverFile);

    uploadSongMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Song</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="song-title">Title *</Label>
            <Input
              id="song-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="input-song-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="song-description">Description</Label>
            <Textarea
              id="song-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-song-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="song-genre">Genre</Label>
            <Input
              id="song-genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              data-testid="input-song-genre"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="song-audio">Audio File *</Label>
            <Input
              id="song-audio"
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              required
              data-testid="input-song-audio"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="song-cover">Cover Art</Label>
            <Input
              id="song-cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              data-testid="input-song-cover"
            />
          </div>

          <Button type="submit" disabled={uploadSongMutation.isPending} data-testid="button-upload-song">
            <Upload className="h-4 w-4 mr-2" />
            {uploadSongMutation.isPending ? 'Uploading...' : 'Upload Song'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MerchManager({ userId, merchandise, profileSlug }: { userId: number; merchandise: Merchandise[]; profileSlug: string | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploadForm, setShowUploadForm] = useState(false);

  const deleteMerchMutation = useMutation({
    mutationFn: async (merchId: number) => {
      return await apiRequest(`/api/merch/${merchId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      if (profileSlug) {
        queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileSlug}`] });
      }
      toast({
        title: "Success",
        description: "Merchandise deleted successfully",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage Merchandise</h3>
        <Button onClick={() => setShowUploadForm(!showUploadForm)} data-testid="button-add-merch">
          <ShoppingBag className="h-4 w-4 mr-2" />
          {showUploadForm ? 'Cancel' : 'Add Merchandise'}
        </Button>
      </div>

      {showUploadForm && <MerchUploadForm onSuccess={() => setShowUploadForm(false)} profileSlug={profileSlug} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {merchandise.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                {item.images[0] && (
                  <img src={item.images[0]} alt={item.name} className="w-20 h-20 object-cover rounded" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold" data-testid={`text-merch-name-${item.id}`}>{item.name}</h4>
                  <p className="text-sm text-muted-foreground">${item.price}</p>
                  <p className="text-xs text-muted-foreground">{item.stock} in stock</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMerchMutation.mutate(item.id)}
                  data-testid={`button-delete-merch-${item.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MerchUploadForm({ onSuccess, profileSlug }: { onSuccess: () => void; profileSlug: string | null }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('apparel');
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const uploadMerchMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiRequest('/api/merch', {
        method: 'POST',
        body: formData,
        headers: {},
      });
    },
    onSuccess: () => {
      if (profileSlug) {
        queryClient.invalidateQueries({ queryKey: [`/api/profile/${profileSlug}`] });
      }
      toast({
        title: "Success",
        description: "Merchandise added successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add merchandise",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price || !imageFiles || imageFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please provide name, price, and at least one image",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('category', category);
    
    Array.from(imageFiles).forEach((file) => {
      formData.append('images', file);
    });

    uploadMerchMutation.mutate(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Merchandise</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merch-name">Name *</Label>
            <Input
              id="merch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-testid="input-merch-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merch-description">Description</Label>
            <Textarea
              id="merch-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-merch-description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merch-price">Price *</Label>
              <Input
                id="merch-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                data-testid="input-merch-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merch-stock">Stock</Label>
              <Input
                id="merch-stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                data-testid="input-merch-stock"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merch-category">Category</Label>
            <Input
              id="merch-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              data-testid="input-merch-category"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merch-images">Images * (multiple allowed)</Label>
            <Input
              id="merch-images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
              required
              data-testid="input-merch-images"
            />
          </div>

          <Button type="submit" disabled={uploadMerchMutation.isPending} data-testid="button-upload-merch">
            <Upload className="h-4 w-4 mr-2" />
            {uploadMerchMutation.isPending ? 'Uploading...' : 'Add Merchandise'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
