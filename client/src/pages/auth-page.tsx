import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@db/schema";
import { SiSpotify, SiGoogle } from "react-icons/si";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { signInWithGoogle } = useFirebaseAuth();
  const { toast } = useToast();

  const loginForm = useForm({
    defaultValues: { username: "", password: "" }
  });
  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { username: "", password: "" }
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: "No se pudo iniciar sesión con Google",
        variant: "destructive",
      });
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-6">
          <Button 
            variant="outline" 
            className="w-full mb-6 gap-2"
            onClick={handleGoogleSignIn}
          >
            <SiGoogle className="w-5 h-5" />
            Continuar con Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input {...loginForm.register("username")} />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input type="password" {...loginForm.register("password")} />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    Login
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input {...registerForm.register("username")} />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input type="password" {...registerForm.register("password")} />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    Register
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <div 
        className="hidden md:flex flex-col justify-center p-12 bg-black"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${encodeURI("https://images.unsplash.com/photo-1484972759836-b93f9ef2b293")})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <h1 className="text-4xl font-bold text-white mb-6">
          Elevate Your Music Career
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Join the next generation of music marketing. Connect with Spotify, manage your brand, and grow your audience.
        </p>
        <div className="flex items-center gap-4 text-gray-300">
          <SiSpotify className="w-8 h-8" />
          <span>Integrated with Spotify</span>
        </div>
      </div>
    </div>
  );
}