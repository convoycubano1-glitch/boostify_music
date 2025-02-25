import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  User,
  Shield,
  Palette,
  Globe,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SettingsPage() {
  const isMobile = useIsMobile();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 md:pt-6 md:space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4 md:space-y-6">
        <TabsList className="w-full h-auto flex flex-wrap justify-start md:justify-start gap-1 md:gap-2 p-1">
          <TabsTrigger value="profile" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <User className="h-4 w-4" />
            <span className="text-xs md:text-sm">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <Bell className="h-4 w-4" />
            <span className="text-xs md:text-sm">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <Palette className="h-4 w-4" />
            <span className="text-xs md:text-sm">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 md:flex-none gap-1 md:gap-2 h-10 px-2 md:px-4 py-2">
            <Shield className="h-4 w-4" />
            <span className="text-xs md:text-sm">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Profile Information</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="language">Language</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full md:w-auto">Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Notification Preferences</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Receive real-time notifications
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
                <div className="space-y-0.5">
                  <Label>Newsletter</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Receive our monthly newsletter
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Customization</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="grid gap-1.5 md:gap-2">
                <Label>Theme</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 md:gap-2">
                <Label>Density</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select density" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="p-3 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Account Security</h3>
            <div className="space-y-3 md:space-y-4">
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="grid gap-1.5 md:gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button className="w-full md:w-auto">Update Password</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
