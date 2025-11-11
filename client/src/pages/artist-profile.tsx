import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Head } from "../components/ui/head";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Edit, Share2, Music, ShoppingBag } from "lucide-react";
import { ArtistProfileView } from "../components/artist-profile/artist-profile-view";
import { ArtistProfileEdit } from "../components/artist-profile/artist-profile-edit";

export interface Song {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  audioUrl: string;
  coverArt: string | null;
  genre: string | null;
  releaseDate: Date | null;
  plays: number;
  isPublished: boolean;
  createdAt: Date;
}

export interface Merchandise {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  price: string;
  images: string[];
  category: string;
  stock: number;
  isAvailable: boolean;
  createdAt: Date;
}

export interface ArtistProfile {
  id: number;
  username: string | null;
  artistName: string | null;
  slug: string | null;
  biography: string | null;
  genre: string | null;
  location: string | null;
  website: string | null;
  profileImage: string | null;
  coverImage: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  youtubeChannel: string | null;
  songs: Song[];
  merchandise: Merchandise[];
  videos: any[];
}

export default function ArtistProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);

  const { data: profileData, isLoading, error } = useQuery<ArtistProfile>({
    queryKey: [`/api/profile/${slug}`],
    enabled: !!slug,
  });

  const handleSlugUpdate = (newSlug: string) => {
    setLocation(`/artist/${newSlug}`);
    setEditMode(false);
  };

  const profile = profileData;
  const songs = profile?.songs || [];
  const merchandise = profile?.merchandise || [];
  
  const isOwner = user && profile && user.uid === String(profile.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Artist Not Found</h1>
          <p className="text-muted-foreground">
            The profile you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const fullUrl = window.location.origin + '/' + slug;
  const profileImage = profile.profileImage || '/assets/default-avatar.png';
  const artistName = profile.artistName || profile.username || 'Artist';

  const title = `${artistName} - Music Artist Profile | Boostify Music`;
  const description = `Check out ${artistName}'s music profile on Boostify Music. Listen to songs, view merchandise, and connect with this talented artist.`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: artistName,
          text: `Check out ${artistName} on Boostify Music!`,
          url: fullUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(fullUrl);
      alert('Profile link copied to clipboard!');
    }
  };

  return (
    <>
      <Head
        title={title}
        description={description}
        url={fullUrl}
        image={profileImage}
        type="profile"
        siteName="Boostify Music"
      />
      <div className="min-h-screen bg-background">
        {isOwner && !editMode && (
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="container max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">This is your profile</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  data-testid="button-share"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  size="sm"
                  onClick={() => setEditMode(true)}
                  data-testid="button-edit-profile"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        )}

        {editMode && isOwner ? (
          <ArtistProfileEdit
            profile={profile}
            songs={songs}
            merchandise={merchandise}
            currentSlug={slug}
            onCancel={() => setEditMode(false)}
            onSlugUpdate={handleSlugUpdate}
          />
        ) : (
          <ArtistProfileView
            profile={profile}
            songs={songs}
            merchandise={merchandise}
            isOwner={!!isOwner}
          />
        )}
      </div>
    </>
  );
}
