"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

interface DocumentPreviewProps {
  fileRef: string;
  fileType: string;
}

export function DocumentPreview({ fileRef, fileType }: DocumentPreviewProps) {
  const [open, setOpen] = useState(false);
  const previewUrl = `/api/uploads/${fileRef.replace(/\\/g, "/")}`;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Eye className="mr-1 h-3 w-3" />
        Preview
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 z-10 rounded-full bg-black/40 p-1 text-white hover:bg-black/60"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>

            {fileType === "pdf" ? (
              <iframe
                src={previewUrl}
                className="h-[80vh] w-[80vw] border-0"
                title="Document Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Document preview"
                className="max-h-[85vh] max-w-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
