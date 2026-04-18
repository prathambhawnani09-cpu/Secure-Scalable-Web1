import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { 
  useCreateVisit, 
  useListStudents, 
  useListVisits,
  CreateVisitBodyActionTaken
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListVisitsQueryKey } from "@workspace/api-client-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, ChevronsUpDown, Stethoscope, Clock, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Sore Throat", "Nausea", "Vomiting", 
  "Stomach Ache", "Fatigue", "Rash", "Dizziness", "Injury"
];

const formSchema = z.object({
  studentId: z.number({ required_error: "Please select a student" }),
  grade: z.string().min(1, "Grade is required"),
  classroom: z.string().min(1, "Classroom is required"),
  symptoms: z.array(z.string()).min(1, "Select at least one symptom"),
  temperature: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  actionTaken: z.enum([
    "sent_home", "returned_to_class", "called_parent", "referred_to_doctor", "monitored"
  ], { required_error: "Action taken is required" })
});

type FormValues = z.infer<typeof formSchema>;

export default function NursePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openStudentSelect, setOpenStudentSelect] = useState(false);
  const [customSymptom, setCustomSymptom] = useState("");

  const { data: studentsData, isLoading: isLoadingStudents } = useListStudents();
  const { data: recentVisitsData, isLoading: isLoadingVisits } = useListVisits({ limit: 10 });
  const createVisit = useCreateVisit();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: [],
      temperature: null,
      notes: "",
    }
  });

  const onSubmit = (data: FormValues) => {
    createVisit.mutate(
      { data: data as any },
      {
        onSuccess: () => {
          toast({
            title: "Visit Logged",
            description: "The student visit has been successfully recorded.",
          });
          form.reset({
            symptoms: [],
            temperature: null,
            notes: "",
          });
          // Invalidate recent visits to refresh sidebar
          queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to log visit. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleStudentSelect = (studentId: number) => {
    const student = studentsData?.students.find(s => s.id === studentId);
    if (student) {
      form.setValue("studentId", student.id);
      form.setValue("grade", student.grade);
      form.setValue("classroom", student.classroom);
    }
    setOpenStudentSelect(false);
  };

  const toggleSymptom = (symptom: string) => {
    const current = form.getValues("symptoms") || [];
    if (current.includes(symptom)) {
      form.setValue("symptoms", current.filter(s => s !== symptom), { shouldValidate: true });
    } else {
      form.setValue("symptoms", [...current, symptom], { shouldValidate: true });
    }
  };

  const addCustomSymptom = () => {
    if (customSymptom && customSymptom.trim() !== "") {
      const current = form.getValues("symptoms") || [];
      if (!current.includes(customSymptom.trim())) {
        form.setValue("symptoms", [...current, customSymptom.trim()], { shouldValidate: true });
      }
      setCustomSymptom("");
    }
  };

  const formatAction = (action: string) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
      {/* Main Form */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Fast Visit Log</h1>
          <p className="text-muted-foreground">Record a student visit quickly and accurately.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              New Visit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Student Selection */}
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Student</FormLabel>
                      <Popover open={openStudentSelect} onOpenChange={setOpenStudentSelect}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isLoadingStudents}
                            >
                              {field.value && studentsData?.students
                                ? studentsData.students.find(
                                    (s) => s.id === field.value
                                  )?.name
                                : "Search student..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search students..." />
                            <CommandList>
                              <CommandEmpty>No student found.</CommandEmpty>
                              <CommandGroup>
                                {studentsData?.students.map((student) => (
                                  <CommandItem
                                    key={student.id}
                                    value={student.name}
                                    onSelect={() => handleStudentSelect(student.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        student.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {student.name} 
                                    <span className="ml-2 text-muted-foreground text-sm">
                                      ({student.grade} - {student.classroom})
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="classroom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classroom</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className="bg-muted" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Symptoms */}
                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symptoms</FormLabel>
                      <div className="border rounded-md p-4 bg-muted/20">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {COMMON_SYMPTOMS.map(symptom => {
                            const isSelected = field.value?.includes(symptom);
                            return (
                              <Badge
                                key={symptom}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground text-sm py-1 px-3"
                                onClick={() => toggleSymptom(symptom)}
                              >
                                {symptom}
                              </Badge>
                            );
                          })}
                        </div>
                        
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Other symptom..." 
                            value={customSymptom}
                            onChange={(e) => setCustomSymptom(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomSymptom();
                              }
                            }}
                          />
                          <Button type="button" variant="secondary" onClick={addCustomSymptom}>Add</Button>
                        </div>
                        
                        {/* Custom symptoms display */}
                        {field.value?.filter(s => !COMMON_SYMPTOMS.includes(s)).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {field.value.filter(s => !COMMON_SYMPTOMS.includes(s)).map(symptom => (
                              <Badge
                                key={symptom}
                                variant="default"
                                className="cursor-pointer bg-primary/80"
                                onClick={() => toggleSymptom(symptom)}
                              >
                                {symptom} ×
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature (°F) - Optional</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="98.6" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="actionTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Action Taken</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select action..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(CreateVisitBodyActionTaken).map((action) => (
                              <SelectItem key={action} value={action}>
                                {formatAction(action)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clinical Notes - Optional</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional observations..." 
                          className="resize-none h-24" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" size="lg" disabled={createVisit.isPending} className="w-full sm:w-auto">
                    {createVisit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Visit Record
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: Recent Visits */}
      <div className="w-full lg:w-80 space-y-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Visits
            </CardTitle>
            <CardDescription>Recent logs for quick reference</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {isLoadingVisits ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex flex-col gap-2 border-b pb-4">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : recentVisitsData?.visits && recentVisitsData.visits.length > 0 ? (
              <div className="divide-y">
                {recentVisitsData.visits.map((visit) => (
                  <div key={visit.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        {visit.studentName}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(visit.visitDate), "h:mm a")}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {visit.grade} - {visit.classroom}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {visit.symptoms.slice(0, 3).map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {s}
                        </Badge>
                      ))}
                      {visit.symptoms.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          +{visit.symptoms.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-sm inline-block">
                      {formatAction(visit.actionTaken)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-20" />
                No visits logged today yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
