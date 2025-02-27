import { PostFeed } from "@/components/social/post-feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, MessageSquare, Bell, Home } from "lucide-react";

export default function SocialNetworkPage() {
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Search",
      description: "This feature is coming soon!",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar/Profile Column */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                Update your profile and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <Button className="w-full justify-start" variant="ghost">
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Button>
                <Button className="w-full justify-start" variant="ghost">
                  <Users className="mr-2 h-4 w-4" />
                  Friends
                </Button>
                <Button className="w-full justify-start" variant="ghost">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
                <Button className="w-full justify-start" variant="ghost">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Trending Topics</CardTitle>
              <CardDescription>
                Popular discussions in music education
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-sm font-medium hover:underline">
                    #MusicEducation
                  </a>
                  <p className="text-xs text-gray-500">1.2K posts</p>
                </li>
                <li>
                  <a href="#" className="text-sm font-medium hover:underline">
                    #ProductionTips
                  </a>
                  <p className="text-xs text-gray-500">876 posts</p>
                </li>
                <li>
                  <a href="#" className="text-sm font-medium hover:underline">
                    #HomeStudio
                  </a>
                  <p className="text-xs text-gray-500">543 posts</p>
                </li>
                <li>
                  <a href="#" className="text-sm font-medium hover:underline">
                    #SongwritingChallenge
                  </a>
                  <p className="text-xs text-gray-500">322 posts</p>
                </li>
                <li>
                  <a href="#" className="text-sm font-medium hover:underline">
                    #MusicTheory
                  </a>
                  <p className="text-xs text-gray-500">289 posts</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Feed Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="mb-4">
            <CardContent className="p-4">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <Input 
                  placeholder="Search posts, people, or topics..."
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Tabs defaultValue="feed">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            <TabsContent value="feed">
              <PostFeed />
            </TabsContent>
            <TabsContent value="trending">
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Trending content coming soon!</p>
              </Card>
            </TabsContent>
            <TabsContent value="following">
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Following feature coming soon!</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}