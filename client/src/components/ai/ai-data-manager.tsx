import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

  // Consulta de datos
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

  // Función para descargar contenido
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

  // Función para eliminar contenido
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
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Content Manager</h1>
        <Select
          value={selectedCollection}
          onValueChange={setSelectedCollection}
        >
          <SelectTrigger className="w-[200px]">
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
        <div>Loading...</div>
      ) : (
        <>
          <div className="bg-black/20 backdrop-blur rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Usage Analytics</h2>
            <BarChart width={800} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="interactions" fill="#8884d8" />
            </BarChart>
          </div>

          <div className="grid gap-4">
            {aiData?.map((item: any) => (
              <Card key={item.id} className="p-6 bg-black/20 backdrop-blur">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      Created: {new Date(item.timestamp?.seconds * 1000).toLocaleString()}
                    </h3>
                    <pre className="whitespace-pre-wrap text-sm bg-transparent">
                      {item.script || item.strategy || item.content || item.design || item.advice}
                    </pre>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownload(item)}
                      variant="outline"
                      size="sm"
                    >
                      Download
                    </Button>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
