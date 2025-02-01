import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
}

export interface ContactField {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'url';
  validate?: (value: any) => boolean;
  format?: (value: any) => any;
}

export const CONTACT_FIELDS: ContactField[] = [
  {
    key: 'name',
    label: 'Name',
    required: true,
    type: 'text',
    format: (value) => String(value).trim(),
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    type: 'email',
    validate: (value) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
    },
    format: (value) => String(value).toLowerCase().trim(),
  },
  {
    key: 'phone_number',
    label: 'Phone Number',
    required: false,
    type: 'phone',
    validate: (value) => {
      if (!value) return true;
      const cleaned = String(value).replace(/[^\d+]/g, '');
      
      // Common country codes and their expected lengths (including country code)
      const COUNTRY_CODES = {
        '1': { name: 'US/Canada', length: 11 },    // +1XXXXXXXXXX
        '44': { name: 'UK', length: 12 },          // +44XXXXXXXXXX
        '61': { name: 'Australia', length: 11 },   // +61XXXXXXXXX
        '64': { name: 'New Zealand', length: 11 }, // +64XXXXXXXXX
        '86': { name: 'China', length: 13 },       // +86XXXXXXXXXXX
        '91': { name: 'India', length: 12 },       // +91XXXXXXXXXX
      };

      // If it's a 10-digit number, it's valid (will be formatted as US/Canada)
      if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
        return true;
      }

      // Check if it's a valid international format
      if (cleaned.startsWith('+')) {
        const withoutPlus = cleaned.substring(1);
        for (const [code, info] of Object.entries(COUNTRY_CODES)) {
          if (withoutPlus.startsWith(code) && withoutPlus.length === info.length - 1) {
            return true;
          }
        }
      }

      return false;
    },
    format: (value) => {
      if (!value) return value;
      const cleaned = String(value).replace(/[^\d+]/g, '');
      
      // If it already starts with +, just clean it
      if (cleaned.startsWith('+')) {
        return cleaned;
      }
      
      // If it starts with a country code without +, add it
      for (const code of ['1', '44', '61', '64', '86', '91']) {
        if (cleaned.startsWith(code)) {
          return '+' + cleaned;
        }
      }
      
      // If it's a 10-digit number, assume US/Canada
      if (cleaned.length === 10) {
        return '+1' + cleaned;
      }
      
      throw new Error('Invalid phone number format. Please ensure the number includes a valid country code.');
    },
  },
  {
    key: 'avatar_url',
    label: 'Avatar URL',
    required: false,
    type: 'url',
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
    key: 'identifier',
    label: 'External ID',
    required: false,
    type: 'text',
  },
];

export async function parseFile(file: File): Promise<ParsedData> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      const headers = Array.from(
        new Set(data.flatMap(obj => Object.keys(obj)))
      );
      return { headers, rows: data };
    }
    throw new Error('JSON file must contain an array of objects');
  }

  if (ext === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
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

  if (ext === 'xlsx' || ext === 'xls') {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const headers = Array.from(
      new Set(data.flatMap(obj => Object.keys(obj)))
    );
    return { headers, rows: data };
  }

  throw new Error('Unsupported file type');
}

export function validateAndFormatContact(
  data: Record<string, any>,
  fieldMappings: { source: string; target: string | null }[]
): { isValid: boolean; errors: string[]; formatted: Record<string, any> } {
  const errors: string[] = [];
  const formatted: Record<string, any> = {
    custom_attributes: {},
  };

  // Process mapped fields
  for (const mapping of fieldMappings) {
    if (!mapping.target || mapping.target === 'custom') continue;

    const field = CONTACT_FIELDS.find(f => f.key === mapping.target);
    if (!field) continue;

    const value = data[mapping.source];

    // Skip if value is empty and field is not required
    if (!value && !field.required) continue;

    // Check required fields
    if (field.required && !value) {
      errors.push(`${field.label} is required`);
      continue;
    }

    // Validate if validator exists
    if (field.validate && !field.validate(value)) {
      errors.push(`${field.label} is invalid`);
      continue;
    }

    // Format value if formatter exists
    formatted[field.key] = field.format ? field.format(value) : value;
  }

  // Process custom attributes
  const customFields = fieldMappings.filter(m => m.target === 'custom');
  for (const mapping of customFields) {
    const value = data[mapping.source];
    if (value !== undefined && value !== null) {
      formatted.custom_attributes[mapping.source] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    formatted,
  };
}