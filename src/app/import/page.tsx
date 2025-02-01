"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { ImportError } from "@/lib/types";
import { AccountSelector } from "@/components/account-selector";
import { InboxSelector } from "@/components/inbox-selector";
import { FileUpload } from "@/components/file-upload";
import { FieldMapper } from "@/components/field-mapper";
import { ImportProgress } from "@/components/import-progress";
import { parseFile, validateAndFormatContact } from "@/lib/file-parser";
import { useToast } from "@/components/ui/use-toast";

type ImportStep = "account" | "inbox" | "upload" | "mapping" | "importing";

interface ImportFile {
  file: File;
  data: {
    headers: string[];
    rows: Record<string, string | number | boolean | null>[];
  };
  mappings?: { source: string; target: string | null }[];
}

export default function ImportPage() {
  const { toast } = useToast();
  const selectedAccount = useAppStore((state) => state.selectedAccount);
  const selectedInbox = useAppStore((state) => state.selectedInbox);
  const [currentStep, setCurrentStep] = useState<ImportStep>("account");
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [successCount, setSuccessCount] = useState(0);

  const handleFilesAccepted = async (acceptedFiles: File[]) => {
    try {
      const parsedFiles = await Promise.all(
        acceptedFiles.map(async (file) => ({
          file,
          data: await parseFile(file),
        })),
      );
      setFiles(parsedFiles);
      setCurrentStep("mapping");
    } catch (error) {
      console.error("Error parsing files:", error);
      toast({
        title: "Error",
        description: "Failed to parse files. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const handleMappingComplete = async (
    mappings: { source: string; target: string | null }[],
  ) => {
    const updatedFiles = [...files];
    updatedFiles[currentFileIndex] = {
      ...updatedFiles[currentFileIndex],
      mappings,
    };
    setFiles(updatedFiles);

    if (currentFileIndex < files.length - 1) {
      // Move to next file
      setCurrentFileIndex(currentFileIndex + 1);
    } else {
      // All files mapped, start import
      setCurrentStep("importing");
    }
  };

  const handleStartImport = async () => {
    if (!selectedAccount || !selectedInbox) return;

    const errors: ImportError[] = [];
    let imported = 0;

    for (const file of files) {
      if (!file.mappings) continue;

      for (const [index, row] of file.data.rows.entries()) {
        try {
          const {
            isValid,
            errors: validationErrors,
            formatted,
          } = validateAndFormatContact(row, file.mappings);

          if (!isValid) {
            errors.push({
              row: index + 1,
              data: row,
              error: {
                type: "validation",
                message: validationErrors.join(", "),
              },
            });
            continue;
          }

          // Add inbox_id to the contact data
          const contactData = {
            ...formatted,
            inbox_id: selectedInbox.id,
          };

          const { api } = await import("@/lib/api");
          const result = await api.createContact(
            selectedAccount.id,
            contactData,
          );

          // Add labels if present
          if (
            result.success &&
            result.contact?.id &&
            formatted.labels &&
            Array.isArray(formatted.labels) &&
            formatted.labels.length > 0
          ) {
            await api.addLabelsToContact(
              selectedAccount.id,
              result.contact.id,
              formatted.labels,
            );
          }

          if (!result.success) {
            errors.push({
              row: index + 1,
              data: row,
              error: result.error || {
                type: "other",
                message: "Unknown error occurred",
              },
            });
          } else {
            imported++;
          }

          // Update progress after each contact
          setSuccessCount(imported);
          setImportErrors(errors);
        } catch (err) {
          const error = err as Error;
          errors.push({
            row: index + 1,
            data: row,
            error: {
              type: "other",
              message: error.message || "Unknown error occurred",
            },
          });
          // Update errors immediately when an error occurs
          setImportErrors(errors);
        }
      }
    }

    toast({
      title: "Import Complete",
      description: `Successfully imported ${imported} contacts. ${errors.length} errors occurred.`,
    });
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (currentFileIndex >= newFiles.length) {
      setCurrentFileIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const getCurrentStep = () => {
    if (!selectedAccount) return "account";
    if (!selectedInbox) return "inbox";
    if (files.length === 0) return "upload";
    if (currentStep === "importing") return "importing";
    return "mapping";
  };

  const renderStep = () => {
    switch (getCurrentStep()) {
      case "account":
        return <AccountSelector />;
      case "inbox":
        return <InboxSelector />;
      case "upload":
        return <FileUpload onFilesAccepted={handleFilesAccepted} />;
      case "mapping":
        return files[currentFileIndex] ? (
          <FieldMapper
            headers={files[currentFileIndex].data.headers}
            sampleData={files[currentFileIndex].data.rows[0]}
            onMappingComplete={handleMappingComplete}
            onBack={() => {
              if (currentFileIndex > 0) {
                setCurrentFileIndex(currentFileIndex - 1);
              } else {
                setFiles([]);
                setCurrentStep("upload");
              }
            }}
          />
        ) : null;
      case "importing":
        return (
          <ImportProgress
            files={files.map((f) => f.file)}
            onRemoveFile={handleRemoveFile}
            onStartImport={handleStartImport}
            errors={importErrors}
            successCount={successCount}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-8">
        {renderStep()}
      </div>
    </main>
  );
}
