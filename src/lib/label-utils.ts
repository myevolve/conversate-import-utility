export interface LabelValidationResult {
  validLabels: string[];
  invalidLabels: string[];
}

export function validateAndFormatLabels(value: unknown): LabelValidationResult {
  if (!value) return { validLabels: [], invalidLabels: [] };

  const validLabelPattern = /^[a-zA-Z0-9_-]+$/;
  const labels = String(value)
    .split(",")
    .map((label) => label.trim())
    .filter((label) => label.length > 0);

  const validLabels: string[] = [];
  const invalidLabels: string[] = [];

  labels.forEach((label) => {
    if (validLabelPattern.test(label)) {
      validLabels.push(label);
    } else {
      invalidLabels.push(label);
    }
  });

  return { validLabels, invalidLabels };
}
