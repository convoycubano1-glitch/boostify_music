import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Radio } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { apifyContactsService } from '@/lib/api/apify-contacts-service';
import { Contact } from '@/lib/api/apify-contacts-service';

interface RadioNetworksDialogProps {
  maxExtractions?: number;
}

export function RadioNetworksDialog({ maxExtractions = 50 }: RadioNetworksDialogProps) {
  const [open, setOpen] = useState(false);
  const [locality, setLocality] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('radio stations');
  const { toast } = useToast();

  // Fetch existing radio contacts
  const {
    data: contactsData,
    isLoading: contactsLoading,
    refetch: refetchContacts
  } = useQuery({
    queryKey: ['contacts', 'radio'],
    queryFn: () => apifyContactsService.getContacts({ category: 'radio' }),
    enabled: open
  });

  const handleExtract = async () => {
    if (!locality) {
      toast({
        title: "Location is required",
        description: "Please enter a location to extract contacts for.",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    try {
      const result = await apifyContactsService.extractContacts({
        searchTerm,
        locality,
        category: 'radio',
        maxPages: 2
      });
      
      toast({
        title: "Extraction Complete",
        description: `Successfully extracted ${result.contacts.length} radio station contacts.`
      });
      
      // Refresh the contacts list
      refetchContacts();
    } catch (error) {
      console.error('Error extracting contacts:', error);
      toast({
        title: "Extraction Failed",
        description: "There was an error extracting contacts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const contacts = contactsData?.contacts || [];
  const contactCount = contacts.length;
  const extractionsRemaining = maxExtractions - contactCount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Radio size={16} />
          <span>Radio Contacts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Radio Stations</DialogTitle>
          <DialogDescription>
            Extract and manage radio station contacts for your promotional campaigns.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="locality">Location</Label>
            <Input
              id="locality"
              placeholder="Enter city, state, or country"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Enter the location to target radio stations (e.g., "Los Angeles" or "New York")
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Search Term</Label>
            <Input
              id="searchTerm"
              placeholder="Enter search term"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Customize your search (e.g., "radio stations", "FM radio", "music directors")
            </p>
          </div>
          
          <div className="rounded-md bg-blue-50 p-3">
            <div className="flex items-center">
              <div className="text-sm text-blue-800">
                <p className="font-medium">Extraction Limits</p>
                <p className="mt-1 text-xs">
                  You have used {contactCount} of {maxExtractions} available extractions.
                  {extractionsRemaining > 0 ? 
                    ` You can extract ${extractionsRemaining} more contacts.` : 
                    ' You have reached your extraction limit.'}
                </p>
              </div>
            </div>
          </div>
          
          {contactsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
                        No contacts found. Extract some contacts to get started.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact: Contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {contact.name}
                          {contact.title && <div className="text-xs text-gray-500">{contact.title}</div>}
                          {contact.company && <div className="text-xs text-gray-500">{contact.company}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {contact.email && <div>{contact.email}</div>}
                          {contact.phone && <div>{contact.phone}</div>}
                          {contact.website && <div className="truncate max-w-[150px]">{contact.website}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {contact.locality || 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button 
            type="button" 
            onClick={handleExtract} 
            disabled={isExtracting || extractionsRemaining <= 0}
            className="ml-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting...
              </>
            ) : (
              'Extract Contacts'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}