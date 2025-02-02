import { NextResponse } from "next/server";
import { validateAndFormatContact } from "@/lib/file-parser";
import { validateAndFormatLabels } from "@/lib/label-utils";
import { api } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Convert File to text
    const text = await file.text();

    // Parse CSV text directly
    const rows = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [name, email, phone_number, labels] = line
          .split(",")
          .map((val) => val.trim());
        return { name, email, phone_number, labels };
      })
      .slice(1); // Skip header row

    // Map fields
    const fieldMappings = [
      { source: "name", target: "name" },
      { source: "email", target: "email" },
      { source: "phone_number", target: "phone_number" },
      { source: "labels", target: "labels" },
    ];

    const errors = [];
    let imported = 0;

    // Process each row
    for (const [index, row] of rows.entries()) {
      try {
        const {
          isValid,
          errors: validationErrors,
          formatted,
        } = validateAndFormatContact(row, fieldMappings);

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

        // Add inbox_id
        const contactData = {
          ...formatted,
          inbox_id: 1687, // Test inbox
        };

        // Set auth headers
        const accessToken = request.headers.get("access-token");
        const client = request.headers.get("client");
        const uid = request.headers.get("uid");

        if (!accessToken || !client || !uid) {
          throw new Error("Missing authentication headers");
        }

        api.setAuthHeaders({
          "access-token": accessToken,
          client,
          uid,
        });

        // Create contact
        const result = await api.createContact(387, contactData); // Conversate Sales Demo Account

        // Add labels if present
        if (result.success && result.contact?.id && formatted.labels) {
          const { validLabels, invalidLabels } = validateAndFormatLabels(
            formatted.labels,
          );

          if (validLabels.length > 0) {
            try {
              const response = await fetch(
                "http://localhost:53875/api/labels",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "access-token": accessToken,
                    client,
                    uid,
                  },
                  body: JSON.stringify({
                    accountId: 387,
                    contactId: result.contact.id,
                    labels: validLabels,
                  }),
                },
              );

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add labels");
              }
            } catch (labelError) {
              errors.push({
                row: index + 1,
                data: row,
                error: {
                  type: "other",
                  message: `Contact created successfully, but failed to add labels: ${(labelError as Error).message}`,
                },
              });
            }
          }

          if (invalidLabels.length > 0) {
            errors.push({
              row: index + 1,
              data: row,
              error: {
                type: "validation",
                message: `Contact created successfully, but the following labels were skipped due to invalid format: ${invalidLabels.join(
                  ", ",
                )}. Labels can only contain letters, numbers, hyphens and underscores.`,
              },
            });
          }
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
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
