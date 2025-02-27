import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apifyContactsService, Contact } from "@/lib/api/apify-contacts-service";

export interface MovieNetworksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MovieNetworksDialog({ open, onOpenChange }: MovieNetworksDialogProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Contact[]>([]);
  const [locality, setLocality] = useState("Los Angeles");
  const [searchTerm, setSearchTerm] = useState("movie production companies");

  const handleSearch = async () => {
    if (!locality) {
      toast({
        title: "Error",
        description: "Please enter a location",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const response = await apifyContactsService.extractContacts({
        searchTerm,
        locality,
        category: "movie",
        maxPages: 2
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to extract contacts");
      }

      setResults(response.contacts);
      
      toast({
        title: "Success",
        description: `Found ${response.contacts.length} movie industry contacts in ${locality}`,
      });
    } catch (error) {
      console.error("Error extracting movie networks:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (contact: Contact) => {
    try {
      const response = await apifyContactsService.saveContact(contact);
      
      if (response.success) {
        toast({
          title: "Contact Saved",
          description: `Added ${contact.name} to your contacts`,
        });
      } else {
        throw new Error(response.message || "Failed to save contact");
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Movie Industry Networks</DialogTitle>
          <DialogDescription>
            Find movie production companies, streaming platforms, and film distributors in your area.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="location" className="text-sm font-medium">Location</label>
            <Input
              id="location"
              placeholder="City or region"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="searchTerm" className="text-sm font-medium">Search Term</label>
            <Input
              id="searchTerm"
              placeholder="e.g., movie production companies"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button onClick={handleSearch} disabled={loading} className="w-full">
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : "Find Movie Networks"}
          </Button>

          {loading && (
            <div className="flex justify-center items-center py-8">
              <Spinner className="h-8 w-8" />
              <span className="ml-2">Searching networks in {locality}...</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Results ({results.length})</h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {results.map((contact, index) => (
                  <div key={index} className="border rounded-md p-4 flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <h4 className="font-bold">{contact.name}</h4>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSaveContact(contact)}
                      >
                        Save
                      </Button>
                    </div>
                    {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
                    {contact.company && <p className="text-sm">{contact.company}</p>}
                    {contact.address && <p className="text-sm">{contact.address}</p>}
                    {contact.email && (
                      <p className="text-sm">
                        <a href={`mailto:${contact.email}`} className="text-blue-500 hover:underline">
                          {contact.email}
                        </a>
                      </p>
                    )}
                    {contact.phone && <p className="text-sm">{contact.phone}</p>}
                    {contact.website && (
                      <p className="text-sm">
                        <a 
                          href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Website
                        </a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No results yet. Try searching for movie industry contacts.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}