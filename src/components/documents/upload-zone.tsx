"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface UploadZoneProps {
  onFile: (file: File) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function UploadZone({ onFile, onCancel, disabled }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

  return (
    <div
      className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
        dragOver
          ? "border-accent bg-accent/5"
          : "border-border hover:border-muted-foreground/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleChange}
      />

      {!selectedFile ? (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Drag & drop a file here, or{" "}
            <button
              type="button"
              className="text-accent underline underline-offset-2"
              onClick={() => inputRef.current?.click()}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or PDF — max 10MB
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              Browse Files
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md bg-surface-muted p-2">
          <div className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4 text-accent" />
            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
            <span className="text-muted-foreground">
              ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              onClick={() => onFile(selectedFile)}
              disabled={disabled}
            >
              Upload
            </Button>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
