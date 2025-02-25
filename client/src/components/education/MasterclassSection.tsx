import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "@/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getRelevantImage } from "@/lib/unsplash-service";
import { createCourseEnrollmentSession } from "@/lib/api/stripe-service";
import { generateCourseContent } from "@/lib/api/openrouter";
import { User, GraduationCap, Star, DollarSign, Plus, Loader2, Clock, Users, Award, Play, ChevronRight, Sparkles, Video, Music } from "lucide-react";

interface MasterclassFormData {
  title: string;
  description: string;
  price: number;
  musicGenre: string;
  specialization: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

interface Masterclass {
  id: string;
  title: string;
  description: string;
  price: number;
  musicGenre: string;
  specialization: string;
  level: string;
  thumbnail: string;
  rating: number;
  totalReviews: number;
  duration: string;
  lessons: number;
  enrolledStudents: number;
  content?: any;
  createdAt: Date;
  createdBy: string;
  creatorName: string;
  type: "masterclass";
}

export default function MasterclassSection() {
  const { toast } = useToast();
  const [masterclasses, setMasterclasses] = useState<Masterclass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMasterclass, setNewMasterclass] = useState<MasterclassFormData>({
    title: "",
    description: "",
    price: 0,
    musicGenre: "",
    specialization: "",
    level: "Intermediate"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [hoveredMasterclass, setHoveredMasterclass] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchMasterclasses = async () => {
      try {
        const masterclassesRef = collection(db, 'masterclasses');
        const q = query(masterclassesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const masterclassesData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          };
        }) as Masterclass[];
        setMasterclasses(masterclassesData);
      } catch (error) {
        console.error('Error fetching masterclasses:', error);
        toast({
          title: "Error",
          description: "Failed to load masterclasses",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMasterclasses();
  }, [toast]);

  const generateRandomMasterclassData = () => {
    return {
      rating: Number((Math.random() * (5 - 4.0) + 4.0).toFixed(1)),
      totalReviews: Math.floor(Math.random() * (500 - 10 + 1)) + 10,
      enrolledStudents: Math.floor(Math.random() * (2000 - 50 + 1)) + 50,
    };
  };

  const handleCreateMasterclass = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "You must be logged in to create a masterclass",
        variant: "destructive"
      });
      return;
    }

    if (!newMasterclass.title || !newMasterclass.description || !newMasterclass.musicGenre || !newMasterclass.specialization) {
      toast({
        title: "Error",
        description: "Please complete all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);

      const imagePrompt = `professional musician masterclass ${newMasterclass.musicGenre} ${newMasterclass.specialization} cover image, high quality studio`;
      const thumbnailUrl = await getRelevantImage(imagePrompt);

      const prompt = `Generate a professional masterclass content for artist-engineers with these characteristics:
        - Title: "${newMasterclass.title}"
        - Description: "${newMasterclass.description}"
        - Level: ${newMasterclass.level}
        - Music Genre: ${newMasterclass.musicGenre}
        - Specialization: ${newMasterclass.specialization}

        The masterclass should be focused on the engineering and artistic aspects of music production for this genre. 
        Include technical insights, creative approaches, and practical demonstrations.
        Structure the content for a series of video lessons that would be taught by a successful artist-engineer.`;

      const masterclassContent = await generateCourseContent(prompt);
      const randomData = generateRandomMasterclassData();

      const masterclassData = {
        ...newMasterclass,
        content: masterclassContent,
        thumbnail: thumbnailUrl,
        lessons: masterclassContent.curriculum.length,
        duration: `${Math.ceil(masterclassContent.curriculum.length / 1.5)} hours`,
        ...randomData,
        createdAt: Timestamp.now(),
        createdBy: auth.currentUser?.uid || "",
        creatorName: auth.currentUser?.displayName || "Industry Expert",
        type: "masterclass"
      };

      const masterclassRef = await addDoc(collection(db, 'masterclasses'), masterclassData);

      setMasterclasses(prev => [{
        id: masterclassRef.id,
        ...masterclassData,
        createdAt: new Date()
      } as Masterclass, ...prev]);

      toast({
        title: "Success",
        description: "Masterclass created successfully"
      });

      setIsCreating(false);
      setNewMasterclass({
        title: "",
        description: "",
        price: 0,
        musicGenre: "",
        specialization: "",
        level: "Intermediate"
      });
    } catch (error: any) {
      console.error('Error creating masterclass:', error);
      toast({
        title: "Error creating masterclass",
        description: error.message || "Failed to create masterclass. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnrollMasterclass = async (masterclass: Masterclass) => {
    if (!isAuthenticated) {
      toast({
        title: "Error",
        description: "You must be logged in to enroll in a masterclass",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Enrolling in masterclass:', masterclass);

      await createCourseEnrollmentSession({
        courseId: masterclass.id,
        title: masterclass.title,
        price: masterclass.price,
        thumbnail: masterclass.thumbnail
      });
      
      toast({
        title: "Success",
        description: `Successfully enrolled in ${masterclass.title}`
      });
    } catch (error: any) {
      console.error('Error enrolling in masterclass:', error);
      toast({
        title: "Error",
        description: error.message || "Error enrolling in masterclass. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            Artist-Engineer Masterclasses
          </h2>
          <p className="text-gray-400 max-w-2xl mt-2">
            Exclusive masterclasses from successful artist-engineers. Learn production techniques, creative approaches, and industry insights directly from the experts.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Create Masterclass
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Masterclass</DialogTitle>
              <DialogDescription>
                Share your expertise with the music community. Create a masterclass to teach your production techniques and creative process.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">Masterclass Title</label>
                <Input
                  id="title"
                  value={newMasterclass.title}
                  onChange={(e) => setNewMasterclass({ ...newMasterclass, title: e.target.value })}
                  placeholder="e.g., Advanced EDM Production Techniques"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  value={newMasterclass.description}
                  onChange={(e) => setNewMasterclass({ ...newMasterclass, description: e.target.value })}
                  placeholder="Describe what students will learn in your masterclass"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="price" className="text-sm font-medium">Price (USD)</label>
                  <Input
                    id="price"
                    type="number"
                    value={newMasterclass.price}
                    onChange={(e) => setNewMasterclass({ ...newMasterclass, price: Number(e.target.value) })}
                    placeholder="Enter price"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="level" className="text-sm font-medium">Level</label>
                  <select
                    id="level"
                    value={newMasterclass.level}
                    onChange={(e) => setNewMasterclass({ ...newMasterclass, level: e.target.value as "Beginner" | "Intermediate" | "Advanced" })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="musicGenre" className="text-sm font-medium">Music Genre</label>
                <Input
                  id="musicGenre"
                  value={newMasterclass.musicGenre}
                  onChange={(e) => setNewMasterclass({ ...newMasterclass, musicGenre: e.target.value })}
                  placeholder="e.g., Electronic, Hip Hop, Rock"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="specialization" className="text-sm font-medium">Specialization</label>
                <Input
                  id="specialization"
                  value={newMasterclass.specialization}
                  onChange={(e) => setNewMasterclass({ ...newMasterclass, specialization: e.target.value })}
                  placeholder="e.g., Mixing, Sound Design, Arrangement"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateMasterclass} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Masterclass...
                  </>
                ) : (
                  "Create Masterclass"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {masterclasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-black/30 rounded-xl border border-gray-800">
          <Video className="h-16 w-16 text-orange-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No masterclasses available yet</h3>
          <p className="text-gray-400 text-center max-w-md mb-6">
            Be the first to create a masterclass and share your expertise with the music community.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="mr-2 h-4 w-4" />
                Create Your Masterclass
              </Button>
            </DialogTrigger>
            {/* Dialog content is the same as above */}
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {masterclasses.map((masterclass) => (
            <motion.div
              key={masterclass.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onHoverStart={() => setHoveredMasterclass(masterclass.id)}
              onHoverEnd={() => setHoveredMasterclass(null)}
            >
              <Card className="overflow-hidden bg-black/50 backdrop-blur-sm border-gray-800 group h-full flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={masterclass.thumbnail}
                    alt={masterclass.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-full">
                    <span className="text-sm font-medium text-white">{masterclass.level}</span>
                  </div>
                  <div className="absolute top-2 left-2 bg-orange-500/90 px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-white" />
                    <span className="text-xs font-medium text-white">Masterclass</span>
                  </div>

                  <AnimatePresence>
                    {hoveredMasterclass === masterclass.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/75 flex flex-col justify-center items-center p-4 space-y-3"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="rounded-full bg-orange-500 p-3 cursor-pointer hover:bg-orange-600 transition-colors"
                        >
                          <Play className="h-8 w-8 text-white" />
                        </motion.div>
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: 20, opacity: 0 }}
                          className="text-center"
                        >
                          <p className="text-white font-medium mb-2">Preview Masterclass</p>
                          <p className="text-gray-300 text-sm">Watch introduction video</p>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-orange-500 text-sm mb-2">
                    <Music className="h-4 w-4" />
                    <span>{masterclass.musicGenre}</span>
                    <span>•</span>
                    <Clock className="h-4 w-4" />
                    <span>{masterclass.duration}</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-500 transition-colors">
                    {masterclass.title}
                  </h3>
                  
                  <p className="text-gray-400 mb-4 line-clamp-2">{masterclass.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <User className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">By {masterclass.creatorName}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4 mt-auto">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                      <span className="font-medium text-white">
                        {typeof masterclass.rating === 'number'
                          ? masterclass.rating.toFixed(1)
                          : parseFloat(String(masterclass.rating)).toFixed(1)}
                      </span>
                      <span className="text-gray-400">({masterclass.totalReviews} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-white">${masterclass.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 group"
                    onClick={() => handleEnrollMasterclass(masterclass)}
                  >
                    <span>Enroll Now</span>
                    <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}