"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { CONTACT_FIELDS } from "@/lib/file-parser";
import { ScrollArea } from "./ui/scroll-area";

interface FieldMapperProps {
  headers: string[];
  sampleData: Record<string, string | number | boolean | null>;
  onMappingComplete: (
    mappings: { source: string; target: string | null }[],
  ) => void;
  onBack: () => void;
}

export function FieldMapper({
  headers,
  sampleData,
  onMappingComplete,
  onBack,
}: FieldMapperProps) {
  const [mappings, setMappings] = useState<
    { source: string; target: string | null }[]
  >(
    headers.map((header) => {
      // Try to auto-map fields based on similar names
      const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, "");
      const matchedField = CONTACT_FIELDS.find(({ key, label }) => {
        const normalizedKey = key.toLowerCase();
        const normalizedLabel = label.toLowerCase().replace(/[^a-z]/g, "");
        return (
          normalizedHeader === normalizedKey ||
          normalizedHeader === normalizedLabel
        );
      });

      return {
        source: header,
        target: matchedField?.key || null,
      };
    }),
  );

  const handleMappingChange = (source: string, target: string | null) => {
    setMappings((prev) =>
      prev.map((m) => (m.source === source ? { ...m, target } : m)),
    );
  };

  const handleSubmit = () => {
    // Validate required fields
    const missingRequired = CONTACT_FIELDS.filter(
      (field) => field.required,
    ).filter((field) => !mappings.some((m) => m.target === field.key));

    if (missingRequired.length > 0) {
      alert(
        `Please map the following required fields: ${missingRequired.map((f) => f.label).join(", ")}`,
      );
      return;
    }

    onMappingComplete(mappings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Fields</CardTitle>
        <CardDescription>
          Map the fields from your file to Conversate AI contact fields. Fields
          that don&apos;t map directly can be imported as custom attributes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {mappings.map(({ source, target }) => (
              <div key={source} className="grid gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Label>{source}</Label>
                    <div className="text-sm text-muted-foreground mt-1">
                      Sample: {String(sampleData[source])}
                    </div>
                  </div>
                  <Select
                    value={target || "_ignore"}
                    onValueChange={(value) =>
                      handleMappingChange(
                        source,
                        value === "_ignore" ? null : value,
                      )
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_ignore">Ignore this field</SelectItem>
                      {CONTACT_FIELDS.map(({ key, label, required }) => (
                        <SelectItem key={key} value={key}>
                          {label} {required ? "(Required)" : ""}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        Import as Custom Attribute
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleSubmit}>Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
}
