export interface ImportError {
  row: number;
  data: Record<string, string | number | boolean | null>;
  error: {
    type: "duplicate_phone" | "duplicate_email" | "validation" | "other";
    message: string;
  };
}
