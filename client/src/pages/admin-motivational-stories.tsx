import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, BookOpen, Loader2, Star, Eye, Search, GripVertical, Copy } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { MotivationalStory, MotivationalStoryWithLessons, MotivationalLesson } from "@shared/schema";


function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function LessonsManager({ storyId }: { storyId: string }) {
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingLesson, setEditingLesson] = useState<MotivationalLesson | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  const { data: storyData, isLoading } = useQuery<MotivationalStoryWithLessons>({
    queryKey: ["/api/admin/motivational-stories", storyId],
    queryFn: () => fetch(`/api/admin/motivational-stories/${storyId}`, { credentials: "include" }).then(r => r.json()),
  });

  const lessons = storyData?.lessons || [];

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/admin/motivational-stories/${storyId}/lessons`, {
        title: newTitle,
        orderIndex: lessons.length,
        content: newContent,
        storyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories", storyId] });
      setNewTitle("");
      setNewContent("");
      toast({ title: "Lesson added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingLesson) return;
      await apiRequest("PATCH", `/api/admin/motivational-stories/${storyId}/lessons/${editingLesson.id}`, {
        title: editTitle,
        content: editContent,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories", storyId] });
      setEditingLesson(null);
      toast({ title: "Lesson updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await apiRequest("DELETE", `/api/admin/motivational-stories/${storyId}/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories", storyId] });
      setDeleteLessonId(null);
      toast({ title: "Lesson deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const startEdit = (lesson: MotivationalLesson) => {
    setEditingLesson(lesson);
    setEditTitle(lesson.title);
    setEditContent(lesson.content || "");
  };

  const cancelEdit = () => {
    setEditingLesson(null);
  };

  return (
    <div className="space-y-4" data-testid="lessons-manager">
      <Label className="text-sm font-semibold">Lessons</Label>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, i) => (
            <div key={lesson.id} className="border rounded-md p-3 space-y-2" data-testid={`lesson-item-${lesson.id}`}>
              {editingLesson?.id === lesson.id ? (
                <div className="space-y-2">
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
                    rows={3}
                    data-testid={`input-edit-lesson-content-${lesson.id}`}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !editTitle} data-testid={`button-save-lesson-${lesson.id}`}>
                      {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit} data-testid={`button-cancel-lesson-${lesson.id}`}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground mr-1">{i + 1}.</span>
                        {lesson.title}
                      </p>
                      {lesson.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{lesson.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(lesson)} data-testid={`button-edit-lesson-${lesson.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteLessonId(lesson.id)} data-testid={`button-delete-lesson-${lesson.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {lessons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No lessons yet</p>
          )}
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <Label className="text-sm font-semibold">Add Lesson</Label>
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Lesson title"
          data-testid="input-new-lesson-title"
        />
        <Textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Lesson content"
          rows={3}
          data-testid="input-new-lesson-content"
        />
        <Button
          onClick={() => addMutation.mutate()}
          disabled={addMutation.isPending || !newTitle}
          size="sm"
          data-testid="button-add-lesson"
        >
          {addMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Lesson
        </Button>
      </div>

      <AlertDialog open={!!deleteLessonId} onOpenChange={(open) => { if (!open) setDeleteLessonId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lesson.
            </AlertDialogDescription>
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
    </div>
  );
}

function StoryFormDialog({ story, open, onOpenChange }: {
  story?: MotivationalStory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!story;

  const [title, setTitle] = useState(story?.title || "");
  const [slug, setSlug] = useState(story?.slug || "");
  const [category, setCategory] = useState(story?.category || "");
  const [description, setDescription] = useState(story?.description || "");
  const [content, setContent] = useState(story?.content || "");
  const [published, setPublished] = useState(story?.published || false);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEdit) setSlug(slugify(val));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data: any = {
        title, slug, category: category || null, description, content, published,
      };
      if (isEdit) {
        await apiRequest("PATCH", `/api/admin/motivational-stories/${story.id}`, data);
      } else {
        await apiRequest("POST", "/api/admin/motivational-stories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories"] });
      toast({ title: isEdit ? "Story updated" : "Story created" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-motivational-story-form">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Story" : "Create Story"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Story title" data-testid="input-story-title" />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="story-slug" data-testid="input-story-slug" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Patience, Gratitude, Faith..."
              data-testid="input-story-category"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." rows={3} data-testid="input-story-description" />
          </div>
          <div className="space-y-2">
            <Label>Content (HTML)</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Full story content..." rows={8} className="font-mono text-sm" data-testid="input-story-content" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={published} onCheckedChange={setPublished} data-testid="switch-story-published" />
            <Label>Published</Label>
          </div>

          {isEdit && story && (
            <div className="border-t pt-4">
              <LessonsManager storyId={story.id} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-story-cancel">Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title || !slug} data-testid="button-story-save">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Update" : "Create"} Story
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminMotivationalStoriesPage() {
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<MotivationalStory | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useQuery<{ stories: MotivationalStory[]; total: number }>({
    queryKey: ["/api/admin/motivational-stories"],
  });

  const stories = data?.stories || [];

  const filteredStories = stories.filter((s) => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (statusFilter === "published" && !s.published) return false;
    if (statusFilter === "draft" && s.published) return false;
    return true;
  });

  const publishedCount = stories.filter((s) => s.published).length;
  const mostViewed = stories.length > 0
    ? stories.reduce((prev, curr) => ((curr.views || 0) > (prev.views || 0) ? curr : prev), stories[0])
    : null;
  const highestRated = stories.length > 0
    ? stories.reduce((prev, curr) => ((curr.averageRating || 0) > (prev.averageRating || 0) ? curr : prev), stories[0])
    : null;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/motivational-stories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories"] });
      toast({ title: "Story deleted" });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      await apiRequest("PATCH", `/api/admin/motivational-stories/${id}`, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/motivational-stories/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/motivational-stories"] });
      toast({ title: "Story duplicated", description: "A draft copy has been created." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openCreate = () => { setEditingStory(undefined); setFormOpen(true); };
  const openEdit = (story: MotivationalStory) => { setEditingStory(story); setFormOpen(true); };
  const handleDelete = (id: string) => { setDeleteTarget(id); setDeleteDialogOpen(true); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-admin-motivational-stories-title">Motivational Stories</h1>
            <p className="text-sm text-muted-foreground">Manage motivational stories and lessons</p>
          </div>
          <Button onClick={openCreate} data-testid="button-add-motivational-story">
            <Plus className="w-4 h-4 mr-2" /> Add Story
          </Button>
        </div>

        {stories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Stories</p>
              <p className="text-2xl font-bold" data-testid="stat-total-stories">{stories.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold" data-testid="stat-published-stories">{publishedCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Most Viewed</p>
              <p className="text-sm font-medium truncate" data-testid="stat-most-viewed-story">{mostViewed?.title || "—"}</p>
              <p className="text-xs text-muted-foreground">{mostViewed?.views || 0} views</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Highest Rated</p>
              <p className="text-sm font-medium truncate" data-testid="stat-highest-rated-story">{highestRated?.title || "—"}</p>
              <p className="text-xs text-muted-foreground">{(highestRated?.averageRating || 0).toFixed(1)} stars</p>
            </Card>
          </div>
        )}

        <Card>
          <div className="flex items-center gap-3 p-4 border-b flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-motivational-stories"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.from(new Set(stories.map(s => s.category).filter(Boolean))).map((cat) => (
                  <SelectItem key={cat as string} value={cat as string}>{cat as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredStories.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-semibold mb-2">No stories found</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {stories.length === 0 ? "Add your first motivational story." : "Try adjusting your filters."}
              </p>
              {stories.length === 0 && (
                <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> Add Story</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="table-motivational-stories">
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStories.map((story) => (
                    <TableRow key={story.id} data-testid={`row-motivational-story-${story.id}`}>
                      <TableCell>
                        <span className="font-medium line-clamp-1" data-testid={`text-story-title-${story.id}`}>{story.title}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">/{story.slug}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {story.category ? (
                          <Badge variant="secondary">{story.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="w-3.5 h-3.5" />
                          {story.views || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {(story.averageRating || 0).toFixed(1)}
                          <span className="text-muted-foreground">({story.totalRatings || 0})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!story.published}
                          onCheckedChange={(checked) => togglePublishMutation.mutate({ id: story.id, published: checked })}
                          data-testid={`switch-publish-${story.id}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(story)} data-testid={`button-edit-story-${story.id}`}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => duplicateMutation.mutate(story.id)}
                            disabled={duplicateMutation.isPending}
                            title="Duplicate story"
                            data-testid={`button-duplicate-story-${story.id}`}
                          >
                            {duplicateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(story.id)} data-testid={`button-delete-story-${story.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <StoryFormDialog
        key={editingStory?.id || "new"}
        story={editingStory}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the story and all its lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-story">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              data-testid="button-confirm-delete-story"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
