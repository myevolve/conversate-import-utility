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
import { validateAndFormatLabels } from "@/lib/label-utils";

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
    if (!selectedAccount || !selectedInbox) {
      console.error("No account or inbox selected");
      toast({
        title: "Error",
        description: "Please select an account and inbox first.",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting import with:", {
      selectedAccount,
      selectedInbox,
      files,
    });

    const errors: ImportError[] = [];
    let imported = 0;

    // Reset state
    setSuccessCount(0);
    setImportErrors([]);

    for (const file of files) {
      if (!file.mappings) {
        console.error("No mappings found for file:", file.file.name);
        continue;
      }

      console.log(
        "Processing file:",
        file.file.name,
        "with mappings:",
        file.mappings,
      );

      for (const [index, row] of file.data.rows.entries()) {
        try {
          console.log("Processing row:", index + 1, "Data:", row);

          const {
            isValid,
            errors: validationErrors,
            formatted,
          } = validateAndFormatContact(row, file.mappings);

          if (!isValid) {
            console.error("Validation errors:", validationErrors);
            errors.push({
              row: index + 1,
              data: row,
              error: {
                type: "validation",
                message: validationErrors.join(", "),
              },
            });
            setImportErrors(errors);
            continue;
          }

          // Add inbox_id to the contact data
          const contactData = {
            ...formatted,
            inbox_id: selectedInbox.id,
          };

          const { api } = await import("@/lib/api");
          console.log("Creating contact with data:", contactData);
          const result = await api.createContact(
            selectedAccount.id,
            contactData,
          );
          console.log("Create contact result:", result);

          // Add labels if present
          if (result.success && result.contact?.id && formatted.labels) {
            const { validLabels, invalidLabels } = validateAndFormatLabels(
              formatted.labels,
            );

            if (validLabels.length > 0) {
              console.log("Adding labels:", validLabels);
              try {
                const response = await fetch("/api/labels", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "access-token":
                      document.cookie.match(/access-token=([^;]+)/)?.[1] || "",
                    client: document.cookie.match(/client=([^;]+)/)?.[1] || "",
                    uid: document.cookie.match(/uid=([^;]+)/)?.[1] || "",
                  },
                  body: JSON.stringify({
                    accountId: selectedAccount.id,
                    contactId: result.contact.id,
                    labels: validLabels,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || "Failed to add labels");
                }

                console.log("Labels added successfully");
              } catch (labelError) {
                console.error("Error adding labels:", labelError);
                errors.push({
                  row: index + 1,
                  data: row,
                  error: {
                    type: "other",
                    message: `Contact created successfully, but failed to add labels: ${(labelError as Error).message}`,
                  },
                });
                setImportErrors(errors);
              }
            }

            if (invalidLabels.length > 0) {
              console.warn("Invalid labels:", invalidLabels);
              errors.push({
                row: index + 1,
                data: row,
                error: {
                  type: "validation",
                  message: `Contact created successfully, but the following labels were skipped due to invalid format: ${invalidLabels.join(", ")}. Labels can only contain letters, numbers, hyphens and underscores.`,
                },
              });
              setImportErrors(errors);
            }
          }

          if (!result.success) {
            console.error("Failed to create contact:", result.error);
            errors.push({
              row: index + 1,
              data: row,
              error: result.error || {
                type: "other",
                message: "Unknown error occurred",
              },
            });
            setImportErrors(errors);
          } else {
            imported++;
            console.log(`Successfully imported contact ${imported}`);
            setSuccessCount(imported);
          }

          // Add a small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (err) {
          const error = err as Error;
          console.error("Error processing row:", error);
          errors.push({
            row: index + 1,
            data: row,
            error: {
              type: "other",
              message: error.message || "Unknown error occurred",
            },
          });
          setImportErrors(errors);
        }
      }
    }

    console.log("Import complete:", { imported, errors });
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
      <div className="container mx-auto max-w-6xl space-y-8 bg-background shadow-sm rounded-lg p-6">
        {renderStep()}
      </div>
    </main>
  );
}
