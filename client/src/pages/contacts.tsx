import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Upload, UserPlus, Users, FileSpreadsheet, Loader2, Mail, Building2, Phone, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

interface AddContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  notes: string;
}

export default function ContactsPage() {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AddContactFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    notes: ""
  });

  // Query for contacts with loading state
  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ["contacts", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];

      try {
        const contactsRef = collection(db, "contacts");
        const q = query(
          contactsRef,
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Contact[];
      } catch (error) {
        console.error("Error fetching contacts:", error);
        toast({
          title: "Error",
          description: "Could not load contacts. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!auth.currentUser?.uid,
    staleTime: 30000,
    retry: false
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      role: "",
      notes: ""
    });
    setIsDialogOpen(false);
    setIsAddingContact(false);
  };

  const handleAddContact = async () => {
    if (!auth.currentUser?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to add contacts",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingContact(true);

      if (!formData.name || !formData.email) {
        toast({
          title: "Error",
          description: "Name and email are required fields",
          variant: "destructive",
        });
        return;
      }

      const contactData = {
        ...formData,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };

      console.log("Adding contact:", contactData);
      const contactsRef = collection(db, "contacts");
      await addDoc(contactsRef, contactData);

      toast({
        title: "Success",
        description: "Contact added successfully",
      });

      resetForm();
      refetch();

    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingContact(false);
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser?.uid) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(header => header.trim().toLowerCase());
      const validRows = rows.slice(1).filter(row => row.trim());

      const contacts = validRows.map(row => {
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

      console.log("Importing contacts:", contacts);
      const contactsRef = collection(db, "contacts");
      let importedCount = 0;

      // Process contacts in batches for progress tracking
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        if (contact.name && contact.email) {
          await addDoc(contactsRef, contact);
          importedCount++;
          setImportProgress((i + 1) / contacts.length * 100);
        }
      }

      toast({
        title: "Success",
        description: `Imported ${importedCount} contacts successfully`,
      });

      refetch();
    } catch (error) {
      console.error("Error importing contacts:", error);
      toast({
        title: "Error",
        description: "Failed to import contacts. Please check your CSV file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>
                      Fill in the contact details below. Required fields are marked with *
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter contact name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Enter role or position"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Add any additional notes"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={resetForm}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddContact}
                      disabled={isAddingContact}
                    >
                      {isAddingContact ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {isAddingContact ? "Adding..." : "Add Contact"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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

          {/* Import Progress */}
          {isImporting && (
            <Card className="p-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Importing Contacts...</span>
                  <span className="text-sm text-muted-foreground">{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : contacts.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Contacts Yet</h3>
              <p className="text-muted-foreground mt-2">
                Import your contacts using CSV or add them manually
              </p>
            </Card>
          ) : (
            <div className="grid gap-6">
              {contacts.map((contact) => (
                <Card key={contact.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold">{contact.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <p>{contact.email}</p>
                          </div>
                        </div>
                        <Button variant="outline">
                          Edit Contact
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-medium">{contact.phone}</p>
                            </div>
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Company</p>
                              <p className="font-medium">{contact.company}</p>
                            </div>
                          </div>
                        )}
                        {contact.role && (
                          <div>
                            <p className="text-sm text-muted-foreground">Role</p>
                            <p className="font-medium">{contact.role}</p>
                          </div>
                        )}
                      </div>
                      {contact.notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="mt-1">{contact.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}