import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/helpers/error-messages";
import { triggerBlobDownload } from "@/helpers/download";
import { apiService } from "@/services/api";
import { Loader2, FileSpreadsheet } from "lucide-react";

export function ExportButtons() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const { blob, filename } = await apiService.exportDownload("csv");
      triggerBlobDownload(blob, filename);
      toast({
        title: "Export downloaded",
        description: `${filename} has been saved to your device.`,
      });
    } catch (error: unknown) {
      const { title, description } = getErrorMessage(error, "records");
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExportCsv}
      disabled={exporting}
    >
      {exporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="mr-2 h-4 w-4" />
      )}
      Download CSV
    </Button>
  );
}
