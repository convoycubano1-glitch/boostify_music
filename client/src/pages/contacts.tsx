import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Upload, UserPlus, Users, FileSpreadsheet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  notes?: string;
  createdAt: Date;
}

export default function ContactsPage() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  // Only fetch contacts when auth is ready
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];

      try {
        const contactsRef = collection(db, "contacts");
        const q = query(
          contactsRef,
          where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Contact[];
      } catch (error) {
        return [];
      }
    },
    enabled: !!auth.currentUser?.uid,
    staleTime: 30000,
    retry: false
  });

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser?.uid) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(header => header.trim().toLowerCase());

      const contacts = rows.slice(1)
        .filter(row => row.trim()) // Skip empty rows
        .map(row => {
          const values = row.split(',').map(value => value.trim());
          const contact: any = {
            userId: auth.currentUser!.uid,
            createdAt: serverTimestamp()
          };

          headers.forEach((header, index) => {
            if (values[index]) {
              contact[header] = values[index];
            }
          });

          return contact;
        });

      const contactsRef = collection(db, "contacts");
      for (const contact of contacts) {
        if (contact.name && contact.email) {  // Only import if required fields exist
          await addDoc(contactsRef, contact);
        }
      }

      toast({
        title: "Success",
        description: `Imported ${contacts.length} contacts successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import contacts",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Manage Your Network
              </h1>
              <p className="text-muted-foreground mt-2">
                Import, organize, and manage your professional contacts
              </p>
            </div>
            <div className="flex gap-4">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isImporting}
                />
                <Button variant="outline" disabled={isImporting}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  {isImporting ? "Importing..." : "Import CSV"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {contacts.map((contact) => (
              <Card key={contact.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{contact.name}</h3>
                        <p className="text-muted-foreground">{contact.email}</p>
                      </div>
                      <Button variant="outline">
                        Edit Contact
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {contact.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-semibold">{contact.phone}</p>
                        </div>
                      )}
                      {contact.company && (
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-semibold">{contact.company}</p>
                        </div>
                      )}
                      {contact.role && (
                        <div>
                          <p className="text-sm text-muted-foreground">Role</p>
                          <p className="font-semibold">{contact.role}</p>
                        </div>
                      )}
                    </div>
                    {contact.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="mt-1">{contact.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}