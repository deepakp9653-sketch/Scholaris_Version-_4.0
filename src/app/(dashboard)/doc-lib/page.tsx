"use client";

import { useState, useEffect } from "react";
import {
  FolderLock,
  Lock,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  FileText,
  UserCheck,
  Building,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordGateModal } from "@/components/wizard/password-gate-modal";
import { DocumentPreview } from "@/components/documents/document-preview";
import {
  verifyDocLibPassword,
  getDocLibEligibilityFiles,
  getDocLibStudentDocuments,
  type DocLibEligibilityFileItem,
  type StudentDocOverview,
} from "@/lib/actions/doc-lib";

export default function DocLibPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "eligibility">("eligibility");

  // Data states
  const [eligibilityFiles, setEligibilityFiles] = useState<DocLibEligibilityFileItem[]>([]);
  const [studentDocs, setStudentDocs] = useState<StudentDocOverview[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Filters for student docs
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedStudent, setSelectedStudent] = useState<StudentDocOverview | null>(null);

  // Check unlock status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isUnlocked = sessionStorage.getItem("doc_lib_unlocked") === "true";
      setUnlocked(isUnlocked);
      if (!isUnlocked) {
        setPasswordModalOpen(true);
      }
    }
  }, []);

  // Load data when unlocked
  useEffect(() => {
    if (unlocked) {
      loadEligibilityFiles();
      loadStudentDocuments();
    }
  }, [unlocked]);

  async function loadEligibilityFiles() {
    setLoadingFiles(true);
    try {
      const files = await getDocLibEligibilityFiles();
      setEligibilityFiles(files);
    } catch (err) {
      console.error("Failed to load eligibility files:", err);
    } finally {
      setLoadingFiles(false);
    }
  }

  async function loadStudentDocuments(search = searchQuery, branch = selectedBranch) {
    setLoadingStudents(true);
    try {
      const docs = await getDocLibStudentDocuments({ search, branch });
      setStudentDocs(docs);
    } catch (err) {
      console.error("Failed to load student documents:", err);
    } finally {
      setLoadingStudents(false);
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadStudentDocuments(val, selectedBranch);
  };

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    loadStudentDocuments(searchQuery, branch);
  };

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Render locked vault screen if not unlocked
  if (unlocked === false) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center space-y-6 text-center p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
          <FolderLock className="h-10 w-10" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Doc Lib Vault Locked</h2>
          <p className="text-sm text-muted-foreground">
            This section contains official university-linked student documents and protected SPPU eligibility criteria. Password verification is required for access.
          </p>
        </div>
        <Button size="lg" onClick={() => setPasswordModalOpen(true)} className="gap-2">
          <Lock className="h-4 w-4" />
          Enter Vault Password
        </Button>

        <PasswordGateModal
          open={passwordModalOpen}
          onOpenChange={setPasswordModalOpen}
          title="Doc Lib Access Vault"
          description="Enter the Doc Lib password to unlock official student documents and SPPU eligibility criteria."
          onVerify={async (pass) => {
            const res = await verifyDocLibPassword(pass);
            return res.success;
          }}
          onSuccess={() => {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("doc_lib_unlocked", "true");
            }
            setUnlocked(true);
            setPasswordModalOpen(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Doc Lib</h1>
            <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Session Unlocked
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gated vault holding Student Document Archives and SPPU Department Eligibility Criteria.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("doc_lib_unlocked");
            }
            setUnlocked(false);
          }}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Lock className="h-3.5 w-3.5" />
          Lock Vault
        </Button>
      </div>

      {/* Main Navigation Tabs / Section Selectors */}
      <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all border-2 ${
              activeTab === "eligibility"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setActiveTab("eligibility")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Eligibility Criteria</CardTitle>
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Official SPPU protected Excel eligibility templates for 5 engineering departments.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  5 Department Files
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  Byte-for-Byte Protected
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all border-2 ${
              activeTab === "documents"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setActiveTab("documents")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Student Documents</CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Read-only repository of admitted and pipeline student uploaded document sets.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {studentDocs.length} Students Logged
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Read-Only Projection
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: ELIGIBILITY CRITERIA */}
        <TabsContent value="eligibility" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">SPPU Department Eligibility Templates</h3>
              <p className="text-xs text-muted-foreground">
                Download the exact digitally-signed original Excel files issued by Savitribai Phule Pune University.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadEligibilityFiles} disabled={loadingFiles} className="gap-1.5 text-xs">
              <RefreshCw className={`h-3.5 w-3.5 ${loadingFiles ? "animate-spin" : ""}`} />
              Refresh Files
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligibilityFiles.map((file) => (
              <Card key={file.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                        {file.department.toUpperCase()}
                      </Badge>
                      <CardTitle className="text-base font-semibold">
                        {file.department.endsWith("Engineering") ? file.department : `${file.department} Engineering`}
                      </CardTitle>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="rounded-md bg-muted/50 p-2.5 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>File Name:</span>
                      <span className="font-medium text-foreground truncate max-w-[150px]">{file.fileName}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>File Size:</span>
                      <span className="font-medium text-foreground">{formatBytes(file.fileSize)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Integrity:</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        SHA-256 Verified
                      </span>
                    </div>
                  </div>

                  <a href={file.fileUrl} download={file.fileName} className="block">
                    <Button className="w-full gap-2 shadow-sm" size="sm">
                      <Download className="h-3.5 w-3.5" />
                      Download Original File
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-lg border bg-amber-50/60 p-4 border-amber-200/80 text-xs text-amber-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              Digital Protection & Integrity Guarantee
            </p>
            <p className="text-amber-800/90 leading-relaxed">
              These Excel files are digitally signed reference documents from Savitribai Phule Pune University. They are served directly with byte-level checksum verification to ensure zero modification or corruption.
            </p>
          </div>
        </TabsContent>

        {/* SECTION 1: STUDENT DOCUMENTS */}
        <TabsContent value="documents" className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student name, app ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 text-sm h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Branch:</span>
              <div className="flex flex-wrap gap-1">
                {["ALL", "Computer", "Civil", "ENTC", "Mechanical", "Electrical"].map((branch) => (
                  <Button
                    key={branch}
                    size="sm"
                    variant={selectedBranch === branch ? "default" : "outline"}
                    className="h-7 text-xs px-2.5"
                    onClick={() => handleBranchChange(branch)}
                  >
                    {branch}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Document Table */}
          <Card>
            <CardHeader className="py-3.5 px-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Student Document Repository</CardTitle>
                <span className="text-xs text-muted-foreground">Showing {studentDocs.length} records</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStudents ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading student documents...</div>
              ) : studentDocs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No student document records found matching the query.
                </div>
              ) : (
                <div className="divide-y text-xs">
                  <div className="grid grid-cols-12 gap-2 p-3 font-semibold text-muted-foreground bg-muted/30">
                    <span className="col-span-4">Student Name</span>
                    <span className="col-span-3">Branch & Quota</span>
                    <span className="col-span-2">Stage Status</span>
                    <span className="col-span-2">Documents</span>
                    <span className="col-span-1 text-right">Action</span>
                  </div>

                  {studentDocs.map((student) => (
                    <div key={student.recordId} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/20">
                      <div className="col-span-4 space-y-0.5">
                        <p className="font-semibold text-foreground text-sm">{student.studentName}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          ID: {student.applicationId || student.recordId.slice(0, 8)}
                        </p>
                      </div>

                      <div className="col-span-3 space-y-0.5">
                        <p className="font-medium text-foreground">{student.branch || "Not Specified"}</p>
                        <p className="text-[11px] text-muted-foreground">{student.category || "General"}</p>
                      </div>

                      <div className="col-span-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {student.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="col-span-2">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                          {student.verifiedDocuments} / {student.totalDocuments} Verified
                        </span>
                      </div>

                      <div className="col-span-1 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Document Set Modal (Read-Only) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-background shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h3 className="text-lg font-bold">{selectedStudent.studentName}</h3>
                <p className="text-xs text-muted-foreground">
                  Document Archive Set • {selectedStudent.branch || "General"} • App ID: {selectedStudent.applicationId || selectedStudent.recordId}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedStudent(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {selectedStudent.documents.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No uploaded document files recorded for this candidate yet.
                </p>
              ) : (
                selectedStudent.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border bg-muted/30"
                  >
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-foreground">{doc.documentName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Format: {doc.fileType.toUpperCase()}</span>
                        <span>•</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            doc.status === "VERIFIED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DocumentPreview fileRef={doc.fileRef} fileType={doc.fileType} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t bg-muted/40 px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Read-Only Projection Surface</span>
              <Button size="sm" variant="secondary" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
