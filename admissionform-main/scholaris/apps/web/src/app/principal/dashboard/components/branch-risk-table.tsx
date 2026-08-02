import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface BranchRiskProps {
  data: {
    departmentName: string;
    sanctionIntake: number;
    totalVacant: number;
    reservedVacancyCount: number;
    categoryVacancies: Record<string, { total: number; vacant: number }>;
    management: { total: number; filled: number; vacant: number };
  }[];
}

export function BranchRiskTable({ data }: BranchRiskProps) {
  const reservedKeys = ["SC", "ST", "SEBC", "SBC", "EWS"];

  return (
    <Card className="rounded-xl border border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Branch & Category Risk Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Reserved seat vacancies and management quota utilization sorted by vacancy risk
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px] text-xs">Branch / Course</TableHead>
                <TableHead className="text-center text-xs">Total Vacant</TableHead>
                {reservedKeys.map((cat) => (
                  <TableHead key={cat} className="text-center text-xs">
                    {cat} Vacant
                  </TableHead>
                ))}
                <TableHead className="text-center text-xs">Management (Used / Total)</TableHead>
                <TableHead className="text-right text-xs">Risk Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((branch) => {
                const hasHighRisk = branch.reservedVacancyCount > 5;
                const hasModerateRisk = branch.reservedVacancyCount > 0;

                return (
                  <TableRow key={branch.departmentName}>
                    <TableCell className="font-medium text-xs">
                      {branch.departmentName}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        Intake: {branch.sanctionIntake}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs font-semibold">
                      {branch.totalVacant}
                    </TableCell>
                    {reservedKeys.map((cat) => {
                      const catData = branch.categoryVacancies[cat] || { total: 0, vacant: 0 };
                      return (
                        <TableCell key={cat} className="text-center font-mono text-xs">
                          {catData.vacant > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              {catData.vacant}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">0</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-mono text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {branch.management.filled}
                      </span>{" "}
                      / <span className="text-muted-foreground">{branch.management.total}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasHighRisk ? (
                        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[10px]">
                          High Vacancy
                        </Badge>
                      ) : hasModerateRisk ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
                          Partial Seats
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                          <CheckCircle className="h-3 w-3" /> Filled
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
