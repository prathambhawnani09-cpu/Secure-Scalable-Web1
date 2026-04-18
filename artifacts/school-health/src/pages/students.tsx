import { useState } from "react";
import { format } from "date-fns";
import { 
  useListStudents, 
  useGetStudent
} from "@workspace/api-client-react";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle,
} from "@/components/ui/sheet";
import { Search, Loader2, Activity, Phone, Mail, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: listData, isLoading: isLoadingList } = useListStudents({ search: searchQuery || undefined });
  
  // Only fetch student detail if an ID is selected
  const { data: detailData, isLoading: isLoadingDetail } = useGetStudent(
    selectedStudentId || 0, 
    { query: { enabled: !!selectedStudentId } }
  );

  const handleRowClick = (id: number) => {
    setSelectedStudentId(id);
    setIsSheetOpen(true);
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-destructive";
    if (score >= 40) return "text-warning";
    return "text-success";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Student Directory</h1>
        <p className="text-muted-foreground">Manage student health profiles and histories.</p>
      </div>

      <div className="flex bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or ID..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Grade & Class</TableHead>
              <TableHead>Conditions/Allergies</TableHead>
              <TableHead className="text-right">Total Visits</TableHead>
              <TableHead className="text-right">Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingList ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : listData?.students && listData.students.length > 0 ? (
              listData.students.map((student) => (
                <TableRow 
                  key={student.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(student.id)}
                >
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">{student.studentCode}</TableCell>
                  <TableCell>{student.grade} - {student.classroom}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.chronicConditions.map((c, i) => (
                        <Badge key={`c-${i}`} variant="outline" className="bg-primary/5 text-primary border-primary/20">{c}</Badge>
                      ))}
                      {student.allergies.map((a, i) => (
                        <Badge key={`a-${i}`} variant="outline" className="bg-destructive/5 text-destructive border-destructive/20">{a}</Badge>
                      ))}
                      {student.chronicConditions.length === 0 && student.allergies.length === 0 && (
                        <span className="text-sm text-muted-foreground">None reported</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{student.visitCount}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {student.lastVisitDate ? format(new Date(student.lastVisitDate), "MMM d, yyyy") : "Never"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-20" />
                    <p>No students found.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none overflow-y-auto">
          {isLoadingDetail || !detailData ? (
            <div className="flex flex-col h-full items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          ) : (
            <>
              <SheetHeader className="pb-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <SheetTitle className="text-2xl">{detailData.student.name}</SheetTitle>
                    <SheetDescription className="text-base mt-1">
                      {detailData.student.studentCode} • {detailData.student.grade} - {detailData.student.classroom}
                    </SheetDescription>
                  </div>
                  <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 font-bold text-xl ${
                    detailData.riskScore >= 70 ? 'border-destructive text-destructive bg-destructive/10' :
                    detailData.riskScore >= 40 ? 'border-warning text-warning-foreground bg-warning/10' :
                    'border-success text-success bg-success/10'
                  }`}>
                    {detailData.riskScore}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right mt-1">Risk Score</div>
              </SheetHeader>

              <div className="py-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Contact & Info</h3>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>DOB: {detailData.student.dateOfBirth ? format(new Date(detailData.student.dateOfBirth), "MMM d, yyyy") : "N/A"}</span>
                    </div>
                    {detailData.student.parentPhone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${detailData.student.parentPhone}`} className="text-primary hover:underline">
                          {detailData.student.parentPhone}
                        </a>
                      </div>
                    )}
                    {detailData.student.parentEmail && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${detailData.student.parentEmail}`} className="text-primary hover:underline">
                          {detailData.student.parentEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Profile */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Health Profile</h3>
                  
                  {detailData.student.allergies.length > 0 && (
                    <Card className="border-destructive/20 bg-destructive/5">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" /> Allergies
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-0 pb-4 px-4 flex flex-wrap gap-2">
                        {detailData.student.allergies.map(a => (
                          <Badge key={a} variant="destructive">{a}</Badge>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {detailData.student.chronicConditions.length > 0 && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2 text-primary">
                          <Activity className="h-4 w-4" /> Chronic Conditions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-0 pb-4 px-4 flex flex-wrap gap-2">
                        {detailData.student.chronicConditions.map(c => (
                          <Badge key={c} variant="outline" className="border-primary text-primary">{c}</Badge>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {detailData.student.allergies.length === 0 && detailData.student.chronicConditions.length === 0 && (
                    <div className="text-sm text-muted-foreground p-4 bg-muted rounded-md text-center">
                      No known health conditions or allergies.
                    </div>
                  )}
                </div>

                {/* Visit Timeline */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Recent Visits ({detailData.student.visitCount} total)
                  </h3>
                  
                  {detailData.recentVisits.length > 0 ? (
                    <div className="relative border-l border-muted-foreground/30 ml-3 space-y-6 pb-4">
                      {detailData.recentVisits.map((visit) => (
                        <div key={visit.id} className="relative pl-6">
                          <div className="absolute w-3 h-3 bg-primary rounded-full -left-[6.5px] top-1.5 border-2 border-background" />
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{format(new Date(visit.visitDate), "MMM d, yyyy 'at' h:mm a")}</span>
                            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md mt-1 border">
                              <div className="flex gap-2 flex-wrap mb-2">
                                {visit.symptoms.map(s => (
                                  <Badge key={s} variant="secondary" className="text-[10px] py-0">{s}</Badge>
                                ))}
                              </div>
                              {visit.notes && <p className="mb-2 italic">"{visit.notes}"</p>}
                              <div className="text-xs font-medium text-foreground">
                                Action: {visit.actionTaken.replace(/_/g, ' ')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4 border rounded-md">
                      No visit history recorded.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
