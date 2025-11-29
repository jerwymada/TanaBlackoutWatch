import { Download, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadPDF, downloadICal } from "@/lib/export-utils";
import type { OutageSchedule } from "@shared/schema";

interface ExportMenuProps {
  schedules: OutageSchedule[];
  disabled?: boolean;
}

export function ExportMenu({ schedules, disabled }: ExportMenuProps) {
  const handlePDFExport = () => {
    downloadPDF(schedules);
  };

  const handleICalExport = () => {
    downloadICal(schedules);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          disabled={disabled || schedules.length === 0}
          data-testid="button-export-menu"
          className="h-11"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Exporter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={handlePDFExport}
          data-testid="button-export-pdf"
          className="cursor-pointer"
        >
          <FileText className="h-4 w-4 mr-2" />
          Exporter en PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleICalExport}
          data-testid="button-export-ical"
          className="cursor-pointer"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Ajouter au calendrier
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
