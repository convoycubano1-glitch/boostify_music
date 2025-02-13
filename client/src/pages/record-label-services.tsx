import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music2, Wand2, Video, Building2, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function RecordLabelServices() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="relative w-full min-h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-orange-600 opacity-90" />
        <img
          src="/assets/vintage-records.jpg"
          alt="Vintage Records"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Revive Classic Music
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Transform dormant catalogs into modern hits with AI-powered remixes and video content
            </p>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600">
              Start Licensing Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Comprehensive Revival Tools</h2>
          <p className="text-muted-foreground">
            Everything you need to bring classic music into the modern era
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6">
            <Music2 className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Music Generation</h3>
            <p className="text-muted-foreground mb-4">
              Create modern remixes and variations while preserving the original essence
            </p>
            <Button variant="outline" className="w-full">Learn More</Button>
          </Card>

          <Card className="p-6">
            <Wand2 className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Mastering</h3>
            <p className="text-muted-foreground mb-4">
              State-of-the-art AI mastering for perfect sound quality
            </p>
            <Button variant="outline" className="w-full">Learn More</Button>
          </Card>

          <Card className="p-6">
            <Video className="h-12 w-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Video Generation</h3>
            <p className="text-muted-foreground mb-4">
              Create compelling music videos for classic tracks
            </p>
            <Button variant="outline" className="w-full">Learn More</Button>
          </Card>
        </div>
      </div>

      {/* Record Label Registration */}
      <div className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Building2 className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Record Label Registration</h2>
              <p className="text-muted-foreground">
                Get access to our suite of AI-powered music revival tools
              </p>
            </div>

            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        companyName: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        contactName: e.target.value
                      }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        email: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        phone: e.target.value
                      }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Company Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        website: e.target.value
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Additional Information</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({
                        ...prev,
                        message: e.target.value
                    }))}
                    placeholder="Tell us about your catalog and what you're looking to achieve"
                  />
                </div>

                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                  Submit Registration
                </Button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Your information is secure and will never be shared</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
