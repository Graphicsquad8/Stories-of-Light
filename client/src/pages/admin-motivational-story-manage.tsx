import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Loader2, Save, FileText } from "lucide-react";
import type { MotivationalStoryWithLessons, MotivationalLesson } from "@shared/schema";

export default function AdminMotivationalStoryManagePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: storyData, isLoading } = useQuery<MotivationalStoryWithLessons>({
    queryKey: ["/api/admin/motivational-stories", id],
    queryFn: () => fetch(`/api/admin/motivational-stories/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const lessons = storyData?.lessons || [];

  const [editingLesson, setEditingLesson] = useState<MotivationalLesson | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories", id] });

  const openEdit = (lesson: MotivationalLesson) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditContent(lesson.content || "");
  };

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/motivational-stories/${id}/lessons`, {
      title: newTitle, orderIndex: lessons.length, content: newContent, storyId: id,
    }),
    onSuccess: () => {
      invalidate();
      setNewTitle(""); setNewContent(""); setShowAdd(false);
      toast({ title: "Lesson added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingLesson) return Promise.resolve();
      return apiRequest("PATCH", `/api/admin/motivational-stories/${id}/lessons/${editingLesson.id}`, {
        title: editTitle, content: editContent,
      });
    },
    onSuccess: () => {
      invalidate();
      setEditingLesson(null);
      toast({ title: "Lesson updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => apiRequest("DELETE", `/api/admin/motivational-stories/${id}/lessons/${lessonId}`),
    onSuccess: () => { invalidate(); toast({ title: "Lesson deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start gap-4">
          <Link href="/image/motivational-stories">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            {isLoading ? <Skeleton className="h-7 w-56" /> : (
              <>
                <h1 className="text-2xl font-semibold" data-testid="text-story-title">{storyData?.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add and manage individual lessons within this story.
                  {storyData?.published ? (
                    <Badge variant="secondary" className="ml-2 text-xs">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">Draft</Badge>
                  )}
                </p>
              </>
            )}
          </div>
          <Button onClick={() => setShowAdd(true)} data-testid="button-add-lesson-top">
            <Plus className="w-4 h-4 mr-2" /> Add Lesson
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        )}

        {!isLoading && lessons.length === 0 && (
          <div className="text-center py-16 border rounded-lg text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium mb-1">No lessons yet.</p>
            <p className="text-sm mb-4">Click "Add Lesson" to add your first lesson.</p>
            <Button onClick={() => setShowAdd(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add First Lesson
            </Button>
          </div>
        )}

        {!isLoading && lessons.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {lessons.map((lesson, idx) => (
              <AccordionItem key={lesson.id} value={lesson.id} className="border rounded-lg px-4 bg-white" data-testid={`accordion-lesson-${lesson.id}`}>
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left flex-1 min-w-0 mr-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium flex-1 min-w-0 truncate">{idx + 1}. {lesson.title}</span>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(lesson)} title="Edit" data-testid={`button-edit-lesson-${lesson.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this lesson?")) deleteMutation.mutate(lesson.id); }} disabled={deleteMutation.isPending} title="Delete" data-testid={`button-delete-lesson-${lesson.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {lesson.content ? (
                    <div
                      className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground border rounded-lg p-4 bg-white"
                      dangerouslySetInnerHTML={{ __html: lesson.content }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">No content yet. Click Edit to add content.</p>
                  )}
                  <div className="flex gap-2 pt-3 mt-1 border-t">
                    <Button size="sm" variant="outline" onClick={() => openEdit(lesson)} data-testid={`button-edit-lesson-detail-${lesson.id}`}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this lesson?")) deleteMutation.mutate(lesson.id); }} disabled={deleteMutation.isPending} data-testid={`button-delete-lesson-detail-${lesson.id}`}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Edit Lesson Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={(open) => { if (!open) setEditingLesson(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Lesson title" data-testid="input-edit-lesson-title" />
            </div>
            <div className="space-y-2">
              <Label>Content (HTML)</Label>
              <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Lesson content..." rows={10} className="font-mono text-sm" data-testid="input-edit-lesson-content" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLesson(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !editTitle} data-testid="button-save-lesson">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); setNewTitle(""); setNewContent(""); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Lesson title" data-testid="input-new-lesson-title" />
            </div>
            <div className="space-y-2">
              <Label>Content (HTML)</Label>
              <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Lesson content..." rows={10} className="font-mono text-sm" data-testid="input-new-lesson-content" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setNewTitle(""); setNewContent(""); }}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !newTitle} data-testid="button-add-lesson">
              {addMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
