import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ContactData {
  name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  identifier?: string;
  custom_attributes?: Record<string, string | number | boolean>;
}

export interface ParsedData {
  headers: string[];
  rows: Record<string, string | number | boolean | null>[];
}

export interface FormattedContact {
  [key: string]:
    | string
    | number
    | boolean
    | string[]
    | Record<string, string | number | boolean>
    | undefined;
  name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  identifier?: string;
  inbox_id?: number;
  custom_attributes: Record<string, string | number | boolean>;
}

export interface ContactField {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "email" | "phone" | "url";
  validate?: (value: unknown) => boolean;
  format?: (value: unknown) => string | number | boolean | string[] | undefined;
}

export const CONTACT_FIELDS: ContactField[] = [
  {
    key: "name",
    label: "Name",
    required: true,
    type: "text",
    format: (value) => String(value).trim(),
  },
  {
    key: "email",
    label: "Email",
    required: false,
    type: "email",
    validate: (value) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
    },
    format: (value) => String(value).toLowerCase().trim(),
  },
  {
    key: "phone_number",
    label: "Phone Number",
    required: false,
    type: "phone",
    validate: (value) => {
      if (!value) return true;
      const cleaned = String(value).replace(/[^\d+]/g, "");

      // Valid formats:
      // 1. +1XXXXXXXXXX (12 chars)
      // 2. XXXXXXXXXX (10 digits)
      // 3. 1XXXXXXXXXX (11 digits)
      return (
        (cleaned.startsWith("+1") && cleaned.length === 12) ||
        (cleaned.length === 10 && /^\d+$/.test(cleaned)) ||
        (cleaned.length === 11 &&
          cleaned.startsWith("1") &&
          /^\d+$/.test(cleaned))
      );
    },
    format: (value): string | undefined => {
      if (!value) return undefined;
      const cleaned = String(value).replace(/[^\d+]/g, "");

      // If it's already in the correct format, return it
      if (cleaned.startsWith("+1") && cleaned.length === 12) {
        return cleaned;
      }

      // If it's a 10-digit number, add +1
      if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
        return "+1" + cleaned;
      }

      // If it starts with 1 and has 11 digits, add +
      if (
        cleaned.length === 11 &&
        cleaned.startsWith("1") &&
        /^\d+$/.test(cleaned)
      ) {
        return "+" + cleaned;
      }

      throw new Error(
        "Invalid phone number format. Please provide a 10-digit number or use +1XXXXXXXXXX format.",
      );
    },
  },
  {
    key: "avatar_url",
    label: "Avatar URL",
    required: false,
    type: "url",
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(String(value));
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    key: "identifier",
    label: "External ID",
    required: false,
    type: "text",
  },
  {
    key: "labels",
    label: "Labels",
    required: false,
    type: "text",
    validate: (value) => {
      if (!value) return true;
      const labels = String(value)
        .split(",")
        .map((label) => label.trim())
        .filter((label) => label.length > 0);

      // Check if all labels match the allowed pattern
      const validLabelPattern = /^[a-zA-Z0-9_-]+$/;
      const invalidLabels = labels.filter(
        (label) => !validLabelPattern.test(label),
      );

      if (invalidLabels.length > 0) {
        throw new Error(
          `Invalid label(s): ${invalidLabels.join(", ")}. Labels can only contain letters, numbers, hyphens and underscores.`,
        );
      }

      return true;
    },
    format: (value): string[] => {
      if (!value) return [];
      // Split by comma and clean up each label
      return String(value)
        .split(",")
        .map((label) => label.trim())
        .filter((label) => label.length > 0);
    },
  },
];

export async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    const text = await file.text();
    const data = JSON.parse(text) as Record<
      string,
      string | number | boolean | null
    >[];
    if (Array.isArray(data)) {
      const headers = Array.from(
        new Set(data.flatMap((obj) => Object.keys(obj))),
      );
      return { headers, rows: data };
    }
    throw new Error("JSON file must contain an array of objects");
  }

  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string | number | boolean | null>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({ headers, rows: results.data });
        },
        error: reject,
      });
    });
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<
      string,
      string | number | boolean | null
    >[];
    const headers = Array.from(
      new Set(data.flatMap((obj) => Object.keys(obj))),
    );
    return { headers, rows: data };
  }

  throw new Error("Unsupported file type");
}

export function validateAndFormatContact(
  data: Record<string, unknown>,
  fieldMappings: { source: string; target: string | null }[],
): { isValid: boolean; errors: string[]; formatted: FormattedContact } {
  const errors: string[] = [];
  const formatted: FormattedContact = {
    custom_attributes: {},
  };

  // Process mapped fields
  for (const mapping of fieldMappings) {
    if (!mapping.target || mapping.target === "custom") continue;

    const field = CONTACT_FIELDS.find((f) => f.key === mapping.target);
    if (!field) continue;

    const value = data[mapping.source];

    // Skip if value is empty and field is not required
    if (!value && !field.required) continue;

    // Check required fields
    if (field.required && !value) {
      errors.push(`${field.label} is required`);
      continue;
    }

    try {
      // Validate if validator exists
      if (field.validate && !field.validate(value)) {
        errors.push(`${field.label} is invalid`);
        continue;
      }

      // Format value if formatter exists
      const formattedValue = field.format ? field.format(value) : String(value);
      if (formattedValue !== undefined) {
        if (field.key === "labels") {
          // Handle labels specially - store as array
          formatted.labels = Array.isArray(formattedValue)
            ? formattedValue.map(String)
            : [String(formattedValue)];
        } else {
          formatted[field.key] = formattedValue;
        }
      }
    } catch (err) {
      const error = err as Error;
      errors.push(error.message);
      continue;
    }
  }

  // Process custom attributes
  const customFields = fieldMappings.filter((m) => m.target === "custom");
  for (const mapping of customFields) {
    const value = data[mapping.source];
    if (value !== undefined && value !== null) {
      formatted.custom_attributes[mapping.source] =
        typeof value === "object" ? JSON.stringify(value) : String(value);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    formatted,
  };
}
