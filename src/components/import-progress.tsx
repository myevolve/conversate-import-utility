"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "./ui/use-toast";
import { Download } from "lucide-react";
import Papa from "papaparse";

import { ImportError } from "@/lib/types";

interface ImportProgressProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  onStartImport: () => Promise<void>;
  errors: ImportError[];
  successCount: number;
}

export function ImportProgress({
  files,
  onRemoveFile,
  onStartImport,
  errors,
  successCount,
}: ImportProgressProps) {
  const [importing, setImporting] = React.useState(false);
  const { toast } = useToast();
  const [startTime, setStartTime] = React.useState<Date | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] =
    React.useState<string>("");
  const totalRows = files.length;
  const progress = totalRows > 0 ? (successCount / totalRows) * 100 : 0;

  React.useEffect(() => {
    if (importing && !startTime) {
      setStartTime(new Date());
    } else if (!importing) {
      setStartTime(null);
      setEstimatedTimeRemaining("");
    } else if (importing && startTime && successCount > 0) {
      const elapsed = (new Date().getTime() - startTime.getTime()) / 1000; // in seconds
      const rate = successCount / elapsed; // contacts per second
      const remaining = (totalRows - successCount) / rate; // seconds remaining

      // Format remaining time
      if (remaining < 60) {
        setEstimatedTimeRemaining(`${Math.round(remaining)} seconds`);
      } else if (remaining < 3600) {
        setEstimatedTimeRemaining(`${Math.round(remaining / 60)} minutes`);
      } else {
        setEstimatedTimeRemaining(`${Math.round(remaining / 3600)} hours`);
      }
    }
  }, [importing, startTime, successCount, totalRows]);

  const handleStartImport = async () => {
    if (importing) return;

    setImporting(true);
    try {
      console.log("Starting import...");
      await onStartImport();
      console.log("Import completed successfully");
      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} contacts. ${errors.length} errors occurred.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during import. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadErrorReport = () => {
    if (errors.length === 0) return;

    // Convert errors to CSV format
    const csvData = errors.map((error) => ({
      Row: error.row,
      "Error Type": error.error.type,
      "Error Message": error.error.message,
      ...error.data, // Include the original row data
    }));

    // Generate CSV
    const csv = Papa.unparse(csvData);

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "import-errors.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Progress</CardTitle>
        <CardDescription>
          {files.length} file{files.length === 1 ? "" : "s"} selected for import
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] rounded-md border p-4">
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {!importing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 space-y-4">
          {importing && (
            <>
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Processing contacts... {Math.round(progress)}% (
                {successCount + errors.length} of {totalRows} contacts)
                {estimatedTimeRemaining &&
                  ` • ${estimatedTimeRemaining} remaining`}
              </p>
              <div className="text-sm text-muted-foreground text-center">
                {successCount} contacts imported successfully
                {errors.length > 0 && <> • {errors.length} failed</>}
              </div>
            </>
          )}
          {!importing && (
            <>
              <Button
                className="w-full"
                onClick={handleStartImport}
                disabled={files.length === 0}
              >
                Start Import
              </Button>
              {errors.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Import Errors</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadErrorReport}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Report
                    </Button>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <div
                          key={index}
                          className="text-sm border-b border-border pb-2 last:border-0"
                        >
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Row {error.row}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                              {error.error.type}
                            </span>
                          </div>
                          <div className="text-destructive mt-1">
                            {error.error.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
