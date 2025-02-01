"use client";

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFilesAccepted: (files: File[]) => void;
}

export function FileUpload({ onFilesAccepted }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['csv', 'xlsx', 'xls', 'json'].includes(ext || '');
    });

    if (validFiles.length > 0) {
      onFilesAccepted(validFiles);
    }
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
    },
    multiple: true
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Files</CardTitle>
        <CardDescription>
          Drop your CSV, Excel, or JSON files here. You can upload multiple files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg">Drop the files here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-lg">Drag and drop files here, or click to select files</p>
              <p className="text-sm text-muted-foreground">
                Supported formats: CSV, Excel (.xlsx, .xls), JSON
              </p>
              <Button type="button" variant="secondary">
                Select Files
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}