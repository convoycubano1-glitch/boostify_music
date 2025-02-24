import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Building2, BadgeCheck, Settings, Calendar, ChevronRight } from "lucide-react";

export function TechnicalRiderSection() {
  return (
    <div className="grid gap-6 md:gap-8 md:grid-cols-2">
      <Card className="p-6 md:p-8 hover:bg-orange-500/5 transition-colors">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
            <FileText className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">Generate Technical Rider</h3>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Create and manage technical specifications
            </p>
          </div>
        </div>
        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Stage plot and dimensions</span>
          </div>
          <div className="flex items-center gap-3">
            <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Equipment specifications</span>
          </div>
          <div className="flex items-center gap-3">
            <ChevronRight className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Audio requirements</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button size="lg" className="bg-orange-500 hover:bg-orange-600 h-auto py-3 whitespace-nowrap">
            <Upload className="mr-2 h-5 w-5 flex-shrink-0" />
            Create New
          </Button>
          <Button size="lg" variant="outline" className="h-auto py-3 whitespace-nowrap">
            <Download className="mr-2 h-5 w-5 flex-shrink-0" />
            Download
          </Button>
        </div>
      </Card>

      <Card className="p-6 md:p-8 hover:bg-orange-500/5 transition-colors">
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
            <Building2 className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">Provider Directory</h3>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Connect with technical equipment providers
            </p>
          </div>
        </div>
        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Verified providers network</span>
          </div>
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Equipment specifications</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <span className="text-base md:text-lg">Availability calendar</span>
          </div>
        </div>
        <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 h-auto py-3">
          Browse Providers
        </Button>
      </Card>
    </div>
  );
}