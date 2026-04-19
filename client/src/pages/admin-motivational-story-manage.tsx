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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
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

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingLesson, setEditingLesson] = useState<MotivationalLesson | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/motivational-stories/${id}/lessons`, {
      title: newTitle,
      orderIndex: lessons.length,
      content: newContent,
      storyId: id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories", id] });
      setNewTitle(""); setNewContent("");
      toast({ title: "Lesson added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingLesson) return Promise.resolve();
      return apiRequest("PATCH", `/api/admin/motivational-stories/${id}/lessons/${editingLesson.id}`, {
        title: editTitle,
        content: editContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories", id] });
      setEditingLesson(null);
      toast({ title: "Lesson updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => apiRequest("DELETE", `/api/admin/motivational-stories/${id}/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories", id] });
      setDeleteLessonId(null);
      toast({ title: "Lesson deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startEdit = (lesson: MotivationalLesson) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditContent(lesson.content || "");
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/image/motivational-stories">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Skeleton className="h-7 w-64" />
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold truncate" data-testid="text-story-title">
                  {storyData?.title}
                </h1>
                {storyData && (
                  <Badge variant={storyData.published ? "default" : "secondary"}>
                    {storyData.published ? "Published" : "Draft"}
                  </Badge>
                )}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">Add and manage individual lessons within this story.</p>
          </div>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !newTitle}
            data-testid="button-add-lesson-top"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Lesson
          </Button>
        </div>

        <div className="space-y-3 mb-8">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <p className="font-medium">No lessons yet</p>
              <p className="text-sm mt-1">Add your first lesson using the form below.</p>
            </div>
          ) : (
            lessons.map((lesson, i) => (
              <div key={lesson.id} className="border rounded-lg p-4 space-y-3" data-testid={`lesson-item-${lesson.id}`}>
                {editingLesson?.id === lesson.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Lesson title"
                      data-testid={`input-edit-lesson-title-${lesson.id}`}
                    />
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Lesson content"
                      rows={4}
                      data-testid={`input-edit-lesson-content-${lesson.id}`}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending || !editTitle}
                        data-testid={`button-save-lesson-${lesson.id}`}
                      >
                        {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingLesson(null)} data-testid={`button-cancel-lesson-${lesson.id}`}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          <span className="text-muted-foreground mr-1">{i + 1}.</span>
                          {lesson.title}
                        </p>
                        {lesson.content && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.content}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(lesson)} data-testid={`button-edit-lesson-${lesson.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteLessonId(lesson.id)}
                        data-testid={`button-delete-lesson-${lesson.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border rounded-lg p-5 space-y-4 bg-muted/30">
          <Label className="text-base font-semibold">Add New Lesson</Label>
          <div className="space-y-2">
            <Label className="text-sm">Title</Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Lesson title"
              data-testid="input-new-lesson-title"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Content</Label>
            <Textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Lesson content"
              rows={4}
              data-testid="input-new-lesson-content"
            />
          </div>
          <Button
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending || !newTitle}
            data-testid="button-add-lesson"
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Lesson
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteLessonId} onOpenChange={(o) => { if (!o) setDeleteLessonId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the lesson.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-lesson">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLessonId && deleteMutation.mutate(deleteLessonId)}
              data-testid="button-confirm-delete-lesson"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
