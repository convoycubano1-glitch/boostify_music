import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import html2pdf from 'html2pdf.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const AI_COLLECTIONS = [
  { id: 'Video_Director_AI', name: 'Video Director' },
  { id: 'AI_Music_Composer', name: 'Music Composer' },
  { id: 'Strategic_Marketing_AI', name: 'Marketing Strategy' },
  { id: 'Social_Media_AI', name: 'Social Media' },
  { id: 'Merchandise_Designer_AI', name: 'Merchandise Design' },
  { id: 'Manager_AI', name: 'Career Manager' }
];

export function AIDataManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCollection, setSelectedCollection] = useState(AI_COLLECTIONS[0].id);

  const { data: aiData, isLoading, refetch } = useQuery({
    queryKey: ['ai-data', selectedCollection, user?.uid],
    queryFn: async () => {
      if (!user) return [];

      const collectionRef = collection(db, selectedCollection);
      const q = query(collectionRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    },
    enabled: !!user
  });

  // Preparar datos para el gráfico
  const chartData = aiData?.map(item => ({
    date: new Date(item.timestamp?.seconds * 1000).toLocaleDateString(),
    interactions: 1
  })).reduce((acc, curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) {
      existing.interactions += 1;
    } else {
      acc.push(curr);
    }
    return acc;
  }, []) || [];

  const handleDownload = async (item: any) => {
    const content = document.createElement('div');
    content.innerHTML = `
      <h1>${selectedCollection}</h1>
      <div>
        <h2>Content:</h2>
        <pre>${JSON.stringify(item, null, 2)}</pre>
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `${selectedCollection}_${item.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(content).save();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, selectedCollection, id));
      toast({
        title: "Content Deleted",
        description: "The content has been successfully deleted.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete content. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold">Please log in to view your AI content.</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">AI Content Manager</h1>
        <Select
          value={selectedCollection}
          onValueChange={setSelectedCollection}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select AI Type" />
          </SelectTrigger>
          <SelectContent>
            {AI_COLLECTIONS.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6 bg-black/20 backdrop-blur">
              <h3 className="text-lg font-semibold mb-2">Total Items</h3>
              <p className="text-3xl font-bold text-orange-500">{aiData?.length || 0}</p>
            </Card>
            <Card className="p-6 bg-black/20 backdrop-blur">
              <h3 className="text-lg font-semibold mb-2">Last Creation</h3>
              <p className="text-sm text-muted-foreground">
                {aiData?.[0]?.timestamp ? new Date(aiData[0].timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
              </p>
            </Card>
            <Card className="p-6 bg-black/20 backdrop-blur">
              <h3 className="text-lg font-semibold mb-2">Usage Today</h3>
              <p className="text-3xl font-bold text-orange-500">
                {chartData.find(item => item.date === new Date().toLocaleDateString())?.interactions || 0}
              </p>
            </Card>
          </div>

          <Card className="overflow-hidden border-none shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Usage Analytics</h2>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="interactions" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden border-none shadow-xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Content List</h2>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {aiData?.map((item: any) => (
                    <Card key={item.id} className="p-4 bg-black/20 backdrop-blur hover:bg-black/30 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {new Date(item.timestamp?.seconds * 1000).toLocaleString()}
                            </span>
                          </div>
                          <div className="prose prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap text-sm bg-transparent">
                              {item.script || item.strategy || item.content || item.design || item.advice}
                            </pre>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:flex-col">
                          <Button
                            onClick={() => handleDownload(item)}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                          >
                            Download
                          </Button>
                          <Button
                            onClick={() => handleDelete(item.id)}
                            variant="destructive"
                            size="sm"
                            className="flex-1 sm:flex-none"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}