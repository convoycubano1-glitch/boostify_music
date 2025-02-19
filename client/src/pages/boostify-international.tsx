import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Globe, Home, Building2, Languages, Users, MapPin, BriefcaseIcon } from "lucide-react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Country {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  departments: Department[];
}

interface Department {
  id: string;
  name: string;
  localName: string;
  employees: number;
}

const applicationFormSchema = z.object({
  fullName: z.string().min(2, "El nombre completo es requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(6, "Número de teléfono inválido"),
  country: z.string().min(1, "Selecciona un país"),
  department: z.string().min(1, "Selecciona un departamento"),
  experience: z.string().min(50, "Por favor proporciona más detalles sobre tu experiencia"),
  languages: z.string().min(1, "Lista los idiomas que hablas"),
});

export default function BoostifyInternational() {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const form = useForm<z.infer<typeof applicationFormSchema>>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      country: "",
      department: "",
      experience: "",
      languages: "",
    },
  });

  const countries: Country[] = [
    {
      id: "fr",
      name: "France",
      nativeName: "France",
      flag: "🇫🇷",
      departments: [
        { id: "fr-marketing", name: "Marketing", localName: "Marketing", employees: 25 },
        { id: "fr-sales", name: "Sales", localName: "Ventes", employees: 30 },
        { id: "fr-tech", name: "Technology", localName: "Technologie", employees: 40 }
      ]
    },
    {
      id: "in",
      name: "India",
      nativeName: "भारत",
      flag: "🇮🇳",
      departments: [
        { id: "in-marketing", name: "Marketing", localName: "विपणन", employees: 35 },
        { id: "in-sales", name: "Sales", localName: "बिक्री", employees: 45 },
        { id: "in-tech", name: "Technology", localName: "प्रौद्योगिकी", employees: 60 }
      ]
    },
    {
      id: "us",
      name: "United States",
      nativeName: "United States",
      flag: "🇺🇸",
      departments: [
        { id: "us-marketing", name: "Marketing", localName: "Marketing", employees: 50 },
        { id: "us-sales", name: "Sales", localName: "Sales", employees: 65 },
        { id: "us-tech", name: "Technology", localName: "Technology", employees: 80 }
      ]
    },
    {
      id: "pt",
      name: "Portugal",
      nativeName: "Portugal",
      flag: "🇵🇹",
      departments: [
        { id: "pt-marketing", name: "Marketing", localName: "Marketing", employees: 20 },
        { id: "pt-sales", name: "Sales", localName: "Vendas", employees: 25 },
        { id: "pt-tech", name: "Technology", localName: "Tecnologia", employees: 30 }
      ]
    },
    {
      id: "de",
      name: "Germany",
      nativeName: "Deutschland",
      flag: "🇩🇪",
      departments: [
        { id: "de-marketing", name: "Marketing", localName: "Marketing", employees: 40 },
        { id: "de-sales", name: "Sales", localName: "Vertrieb", employees: 45 },
        { id: "de-tech", name: "Technology", localName: "Technologie", employees: 55 }
      ]
    },
    {
      id: "gb",
      name: "United Kingdom",
      nativeName: "United Kingdom",
      flag: "🇬🇧",
      departments: [
        { id: "gb-marketing", name: "Marketing", localName: "Marketing", employees: 35 },
        { id: "gb-sales", name: "Sales", localName: "Sales", employees: 40 },
        { id: "gb-tech", name: "Technology", localName: "Technology", employees: 50 }
      ]
    },
    {
      id: "au",
      name: "Australia",
      nativeName: "Australia",
      flag: "🇦🇺",
      departments: [
        { id: "au-marketing", name: "Marketing", localName: "Marketing", employees: 25 },
        { id: "au-sales", name: "Sales", localName: "Sales", employees: 30 },
        { id: "au-tech", name: "Technology", localName: "Technology", employees: 35 }
      ]
    },
    {
      id: "se",
      name: "Sweden",
      nativeName: "Sverige",
      flag: "🇸🇪",
      departments: [
        { id: "se-marketing", name: "Marketing", localName: "Marknadsföring", employees: 20 },
        { id: "se-sales", name: "Sales", localName: "Försäljning", employees: 25 },
        { id: "se-tech", name: "Technology", localName: "Teknologi", employees: 30 }
      ]
    }
  ];

  const handleDepartmentAction = (countryId: string, departmentId: string) => {
    toast({
      title: "Department Action",
      description: `Action triggered for department ${departmentId} in country ${countryId}`,
    });
  };

  const onSubmitApplication = (values: z.infer<typeof applicationFormSchema>) => {
    toast({
      title: "Application Submitted",
      description: "Your application has been received. We'll be in touch soon.",
    });
    console.log(values);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Globe className="w-12 h-12 text-orange-500" />
              <div>
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                  Boostify International
                </h1>
                <p className="text-muted-foreground mt-2">
                  Global Departments and Translations Management
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
                    <BriefcaseIcon className="w-4 h-4" />
                    Apply Now
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <div className="mx-auto w-full max-w-2xl">
                    <DrawerHeader>
                      <DrawerTitle>Apply for International Position</DrawerTitle>
                      <DrawerDescription>
                        Fill out the form below to apply for a position in our international offices.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitApplication)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="you@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input type="tel" placeholder="+1234567890" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="country"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Country</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select country" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {countries.map((country) => (
                                        <SelectItem key={country.id} value={country.id}>
                                          <span className="mr-2">{country.flag}</span>
                                          {country.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="department"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {countries
                                        .find(c => c.id === form.watch('country'))
                                        ?.departments.map((dept) => (
                                          <SelectItem key={dept.id} value={dept.id}>
                                            {dept.name}
                                          </SelectItem>
                                        )) || []}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="languages"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Languages</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="English, Spanish, French..." 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  List all languages you speak, separated by commas
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="experience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Professional Experience</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us about your relevant experience..."
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                            Submit Application
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {countries.map((country, index) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 hover:bg-orange-500/5 transition-colors cursor-pointer border-orange-500/20"
                      onClick={() => setSelectedCountry(country.id)}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{country.flag}</span>
                    <div>
                      <h3 className="font-semibold">{country.name}</h3>
                      <p className="text-sm text-muted-foreground">{country.nativeName}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {country.departments.map((dept) => (
                      <div key={dept.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-orange-500" />
                          <span className="text-sm">{dept.localName}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {dept.employees} emp.
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-orange-500/20">
                    <Button
                      variant="outline"
                      className="w-full bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDepartmentAction(country.id, country.departments[0].id);
                      }}
                    >
                      <Languages className="w-4 h-4 mr-2" />
                      Manage Translations
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}