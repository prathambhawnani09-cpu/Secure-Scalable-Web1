import { useState } from "react";
import { format } from "date-fns";
import { useListVisits } from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Loader2 } from "lucide-react";

export default function VisitsPage() {
  const [symptomFilter, setSymptomFilter] = useState<string>("all");
  
  const { data, isLoading } = useListVisits({ 
    limit: 50,
    symptom: symptomFilter !== "all" ? symptomFilter : undefined 
  });

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'sent_home': return 'destructive';
      case 'referred_to_doctor': return 'destructive';
      case 'returned_to_class': return 'success' as any;
      case 'monitored': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Visit History</h1>
        <p className="text-muted-foreground">Chronological log of all student health clinic visits.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={symptomFilter} onValueChange={setSymptomFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by symptom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Symptoms</SelectItem>
              <SelectItem value="Fever">Fever</SelectItem>
              <SelectItem value="Cough">Cough</SelectItem>
              <SelectItem value="Headache">Headache</SelectItem>
              <SelectItem value="Nausea">Nausea</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Export</Button>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Symptoms</TableHead>
              <TableHead>Action Taken</TableHead>
              <TableHead>Logged By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : data?.visits && data.visits.length > 0 ? (
              data.visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-medium">{format(new Date(visit.visitDate), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(visit.visitDate), "h:mm a")}</div>
                  </TableCell>
                  <TableCell className="font-medium">{visit.studentName}</TableCell>
                  <TableCell>
                    {visit.grade} - {visit.classroom}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {visit.symptoms.map((symptom, i) => (
                        <Badge key={i} variant="secondary" className="font-normal">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(visit.actionTaken) as any} className={visit.actionTaken === 'returned_to_class' ? 'bg-success text-success-foreground' : ''}>
                      {formatAction(visit.actionTaken)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {visit.loggedBy}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-8 w-8 mb-2 opacity-20" />
                    <p>No visits found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
