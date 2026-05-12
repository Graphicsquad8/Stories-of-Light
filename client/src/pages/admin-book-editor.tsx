import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Save, Loader2, Upload, X, Music,
  Plus, Trash2, ChevronDown, ChevronUp, GripVertical,
  FileText, Edit2, Copy, Video, ImageIcon, List,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import type { Book, BookPartWithPages, BookPage, BookChapter } from "@shared/schema";

function TocEditor({ bookId }: { bookId: string }) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartPage, setNewStartPage] = useState(1);
  const [newEndPage, setNewEndPage] = useState(1);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartPage, setEditStartPage] = useState(1);
  const [editEndPage, setEditEndPage] = useState(1);

  const { data: chapters, isLoading } = useQuery<BookChapter[]>({
    queryKey: ["/api/books", bookId, "chapters"],
    queryFn: () => fetch(`/api/books/${bookId}/chapters`).then(r => r.json()),
    enabled: !!bookId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "chapters"] });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/books/${bookId}/chapters`, {
        title: newTitle,
        description: newDescription || null,
        startPage: newStartPage,
        endPage: newEndPage,
        orderIndex: chapters?.length ?? 0,
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "TOC entry added" });
      setNewTitle(""); setNewDescription(""); setNewStartPage(1); setNewEndPage(1);
      setAdding(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/books/chapters/${id}`, {
        title: editTitle,
        description: editDescription || null,
        startPage: editStartPage,
        endPage: editEndPage,
      });
    },
    onSuccess: () => { invalidate(); toast({ title: "Updated" }); setEditingId(null); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/books/chapters/${id}`); },
    onSuccess: () => { invalidate(); toast({ title: "Removed" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startEdit = (ch: BookChapter) => {
    setEditingId(ch.id);
    setEditTitle(ch.title);
    setEditDescription((ch as any).description || "");
    setEditStartPage(ch.startPage);
    setEditEndPage(ch.endPage);
  };

  return (
    <div className="space-y-4" data-testid="toc-editor">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Table of Contents (TOC)</h2>
        </div>
        <span className="text-sm text-muted-foreground">{chapters?.length || 0} chapters</span>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Define the TOC for this book. Each entry represents a chapter with its title, description, and page range.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : chapters && chapters.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 px-4 py-2 bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b">
            <span>#</span>
            <span>Chapter</span>
            <span className="text-center">Pages</span>
            <span />
          </div>
          <div className="divide-y">
            {chapters.map((ch, idx) => (
              <div key={ch.id} className="grid grid-cols-[2rem_1fr_auto_auto] gap-3 items-start px-4 py-3" data-testid={`toc-chapter-${ch.id}`}>
                <span className="text-sm text-muted-foreground pt-0.5">{idx + 1}</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{ch.title}</p>
                  {(ch as any).description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{(ch as any).description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                  p. {ch.startPage}–{ch.endPage}
                  <span className="ml-1 opacity-60">({ch.endPage - ch.startPage + 1} pgs)</span>
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => startEdit(ch)}
                    data-testid={`button-edit-toc-${ch.id}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                    onClick={() => { if (confirm("Remove this TOC entry?")) deleteMutation.mutate(ch.id); }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-toc-${ch.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-6 text-center border-dashed">
          <List className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No TOC entries yet. Add chapters to define the Table of Contents.</p>
        </Card>
      )}

      {adding ? (
        <Card className="p-4 space-y-3 border-dashed">
          <p className="text-sm font-medium">New TOC Entry</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Chapter Title *</Label>
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Introduction to Tawheed"
              data-testid="input-new-toc-title"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description (what this chapter covers)</Label>
            <Textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Brief summary of the chapter's content..."
              rows={2}
              data-testid="input-new-toc-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Page</Label>
              <Input
                type="number"
                min={1}
                value={newStartPage}
                onChange={e => setNewStartPage(Number(e.target.value))}
                data-testid="input-new-toc-start-page"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Page</Label>
              <Input
                type="number"
                min={newStartPage}
                value={newEndPage}
                onChange={e => setNewEndPage(Number(e.target.value))}
                data-testid="input-new-toc-end-page"
              />
            </div>
          </div>
          {newStartPage <= newEndPage && newEndPage >= newStartPage && (
            <p className="text-xs text-muted-foreground">
              Total pages: {newEndPage - newStartPage + 1}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !newTitle || newEndPage < newStartPage}
              data-testid="button-save-toc-entry"
            >
              {addMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Save Entry
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(""); setNewDescription(""); }}>Cancel</Button>
          </div>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="w-full" data-testid="button-add-toc-entry">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add TOC Entry
        </Button>
      )}

      <Dialog open={!!editingId} onOpenChange={v => { if (!v) setEditingId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit TOC Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Chapter Title *</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} data-testid="input-edit-toc-title" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                placeholder="Brief summary of the chapter's content..."
                rows={3}
                data-testid="input-edit-toc-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Page</Label>
                <Input type="number" min={1} value={editStartPage} onChange={e => setEditStartPage(Number(e.target.value))} data-testid="input-edit-toc-start-page" />
              </div>
              <div className="space-y-1.5">
                <Label>End Page</Label>
                <Input type="number" min={editStartPage} value={editEndPage} onChange={e => setEditEndPage(Number(e.target.value))} data-testid="input-edit-toc-end-page" />
              </div>
            </div>
            {editStartPage <= editEndPage && (
              <p className="text-sm text-muted-foreground">Total pages: {editEndPage - editStartPage + 1}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button
                onClick={() => editingId && updateMutation.mutate(editingId)}
                disabled={updateMutation.isPending || !editTitle || editEndPage < editStartPage}
                data-testid="button-save-edit-toc"
              >
                {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PartEditor({
  bookId,
  part,
  index,
  totalParts,
  onMoveUp,
  onMoveDown,
  autoExpand,
}: {
  bookId: string;
  part: BookPartWithPages;
  index: number;
  totalParts: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  autoExpand?: boolean;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(autoExpand ?? false);
  const [editing, setEditing] = useState(false);
  const [showAddPage, setShowAddPage] = useState(autoExpand ?? false);
  const [editTitle, setEditTitle] = useState(part.title);
  const [editSummary, setEditSummary] = useState(part.summary || "");
  const [editCoverImage, setEditCoverImage] = useState(part.coverImage || "");
  const [editVideoUrl, setEditVideoUrl] = useState(part.videoUrl || "");
  const [editAudioUrl, setEditAudioUrl] = useState(part.audioUrl || "");
  const [newPageContent, setNewPageContent] = useState("");
  const [editingPage, setEditingPage] = useState<BookPage | null>(null);
  const [editPageContent, setEditPageContent] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "parts"] });

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const form = new FormData();
      form.append("audio", file);
      const res = await fetch("/api/upload/audio", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setEditAudioUrl(data.url);
      toast({ title: "Audio uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAudio(false);
      if (audioFileRef.current) audioFileRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const form = new FormData();
      form.append("video", file);
      const res = await fetch("/api/upload/video", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setEditVideoUrl(data.url);
      toast({ title: "Video uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingVideo(false);
      if (videoFileRef.current) videoFileRef.current.value = "";
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const form = new FormData();
      form.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setEditCoverImage(data.url);
      toast({ title: "Cover image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = "";
    }
  };

  const updatePartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/books/parts/${part.id}`, {
        title: editTitle,
        summary: editSummary || null,
        coverImage: editCoverImage || null,
        videoUrl: editVideoUrl || null,
        audioUrl: editAudioUrl || null,
      });
    },
    onSuccess: () => { invalidate(); toast({ title: "Part updated" }); setEditing(false); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePartMutation = useMutation({
    mutationFn: async () => { await apiRequest("DELETE", `/api/books/parts/${part.id}`); },
    onSuccess: () => { invalidate(); toast({ title: "Part deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicatePartMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/books/parts/${part.id}/duplicate`); },
    onSuccess: () => { invalidate(); toast({ title: "Part duplicated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addPageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/books/parts/${part.id}/pages`, { content: newPageContent });
    },
    onSuccess: () => { invalidate(); toast({ title: "Page added" }); setNewPageContent(""); setShowAddPage(false); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updatePageMutation = useMutation({
    mutationFn: async () => {
      if (!editingPage) return;
      await apiRequest("PATCH", `/api/books/pages/${editingPage.id}`, { content: editPageContent });
    },
    onSuccess: () => { invalidate(); toast({ title: "Page updated" }); setEditingPage(null); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: string) => { await apiRequest("DELETE", `/api/books/pages/${pageId}`); },
    onSuccess: () => { invalidate(); toast({ title: "Page deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicatePageMutation = useMutation({
    mutationFn: async (pageId: string) => { await apiRequest("POST", `/api/books/pages/${pageId}/duplicate`); },
    onSuccess: () => { invalidate(); toast({ title: "Page duplicated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card className="overflow-hidden" data-testid={`part-editor-${part.id}`}>
      <div className="flex items-center gap-2 p-3 bg-muted/30 border-b">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
        <button onClick={() => setExpanded(!expanded)} className="flex-1 text-left font-medium text-sm truncate" data-testid={`button-expand-part-${part.id}`}>
          {part.title}
        </button>
        <span className="text-xs text-muted-foreground shrink-0">{part.pages?.length || 0} pages</span>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={onMoveUp}><ChevronUp className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === totalParts - 1} onClick={onMoveDown}><ChevronDown className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)} data-testid={`button-edit-part-${part.id}`}><Edit2 className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicatePartMutation.mutate()} disabled={duplicatePartMutation.isPending} data-testid={`button-duplicate-part-${part.id}`}><Copy className="w-3.5 h-3.5" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this part and all its pages?")) deletePartMutation.mutate(); }} data-testid={`button-delete-part-${part.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>

      {expanded && (
        <div className="p-3 space-y-3">
          {part.pages && part.pages.length > 0 ? (
            <div className="space-y-2">
              {part.pages.map((page, pi) => (
                <div key={page.id} className="border rounded-md" data-testid={`page-item-${page.id}`}>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground flex-1">Page {pi + 1}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingPage(page); setEditPageContent(page.content || ""); }}><Edit2 className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => duplicatePageMutation.mutate(page.id)} disabled={duplicatePageMutation.isPending}><Copy className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm("Delete this page?")) deletePageMutation.mutate(page.id); }}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  {page.content && (
                    <div className="px-3 py-2 text-xs text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: page.content }} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-3">No pages yet</p>
          )}

          {showAddPage ? (
            <div className="border rounded-md p-3 space-y-2 bg-muted/10">
              <div>
                <Label className="text-xs font-semibold">New Page Content (HTML)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Each page is a separate screen in the reader. Use HTML tags like <code className="bg-muted px-0.5 rounded">&lt;p&gt;</code>, <code className="bg-muted px-0.5 rounded">&lt;h2&gt;</code>, <code className="bg-muted px-0.5 rounded">&lt;strong&gt;</code> to format text.</p>
              </div>
              <Textarea
                value={newPageContent}
                onChange={(e) => setNewPageContent(e.target.value)}
                placeholder="<p>Enter your page content here...</p>"
                rows={10}
                className="font-mono text-xs"
                data-testid="input-new-page-content"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addPageMutation.mutate()} disabled={addPageMutation.isPending || !newPageContent} data-testid="button-save-new-page">
                  {addPageMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                  Save Page
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowAddPage(false); setNewPageContent(""); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAddPage(true)} className="w-full" data-testid={`button-add-page-${part.id}`}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Page Content
            </Button>
          )}
        </div>
      )}

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Part</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} data-testid="input-edit-part-title" />
            </div>
            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={3} placeholder="Optional summary..." data-testid="input-edit-part-summary" />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Image</Label>
              {editCoverImage && <img src={editCoverImage} alt="" className="w-full max-h-32 object-cover rounded-md mb-2" />}
              <div className="flex gap-2">
                <Input value={editCoverImage} onChange={(e) => setEditCoverImage(e.target.value)} placeholder="URL or upload..." className="flex-1 text-xs" />
                {editCoverImage && <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setEditCoverImage("")}><X className="w-3.5 h-3.5" /></Button>}
                <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}>
                  {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</Label>
              <div className="flex gap-2">
                <Input value={editAudioUrl} onChange={(e) => setEditAudioUrl(e.target.value)} placeholder="URL or upload MP3/WAV..." className="flex-1 text-xs" />
                {editAudioUrl && <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setEditAudioUrl("")}><X className="w-3.5 h-3.5" /></Button>}
                <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
                <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => audioFileRef.current?.click()} disabled={uploadingAudio}>
                  {uploadingAudio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {editAudioUrl && <p className="text-xs text-emerald-600 truncate">{editAudioUrl}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video</Label>
              <div className="flex gap-2">
                <Input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} placeholder="YouTube URL or upload video..." className="flex-1 text-xs" />
                {editVideoUrl && <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => setEditVideoUrl("")}><X className="w-3.5 h-3.5" /></Button>}
                <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                <Button type="button" size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => videoFileRef.current?.click()} disabled={uploadingVideo}>
                  {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {editVideoUrl && <p className="text-xs text-emerald-600 truncate">{editVideoUrl}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={() => updatePartMutation.mutate()} disabled={updatePartMutation.isPending || !editTitle}>
                {updatePartMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Part
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPage} onOpenChange={(v) => { if (!v) setEditingPage(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Page Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Enter the page content below. HTML is fully supported — use <code className="bg-muted px-1 rounded">&lt;p&gt;</code>, <code className="bg-muted px-1 rounded">&lt;h2&gt;</code>, <code className="bg-muted px-1 rounded">&lt;strong&gt;</code>, etc. Each page becomes a separate screen in the reader.
            </p>
            <Textarea
              value={editPageContent}
              onChange={(e) => setEditPageContent(e.target.value)}
              rows={20}
              placeholder="<p>Enter your page content here...</p>"
              className="font-mono text-sm"
              data-testid="input-edit-page-content"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingPage(null)}>Cancel</Button>
              <Button onClick={() => updatePageMutation.mutate()} disabled={updatePageMutation.isPending}>
                {updatePageMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function AdminBookEditorPage() {
  const params = useParams<{ id: string }>();
  const bookId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newPartTitle, setNewPartTitle] = useState("");
  const [newlyAddedPartId, setNewlyAddedPartId] = useState<string | null>(null);

  const { data: book, isLoading: bookLoading } = useQuery<Book>({
    queryKey: ["/api/books", bookId],
    queryFn: () => fetch(`/api/books/${bookId}`).then(r => r.json()),
    enabled: !!bookId,
  });

  const { data: parts, isLoading: partsLoading } = useQuery<BookPartWithPages[]>({
    queryKey: ["/api/books", bookId, "parts"],
    queryFn: () => fetch(`/api/books/${bookId}/parts`).then(r => r.json()),
    enabled: !!bookId,
  });

  const addPartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/books/${bookId}/parts`, { title: newPartTitle });
      return await res.json();
    },
    onSuccess: (newPart) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "parts"] });
      toast({ title: "Part added", description: "Expand the part below to add page content." });
      setNewPartTitle("");
      setNewlyAddedPartId(newPart.id);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const movePartMutation = useMutation({
    mutationFn: async ({ id, orderIndex }: { id: string; orderIndex: number }) => {
      await apiRequest("PATCH", `/api/books/parts/${id}`, { orderIndex });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "parts"] }),
  });

  const handleMoveUp = (index: number) => {
    if (!parts || index === 0) return;
    const curr = parts[index];
    const prev = parts[index - 1];
    movePartMutation.mutate({ id: curr.id, orderIndex: prev.orderIndex });
    movePartMutation.mutate({ id: prev.id, orderIndex: curr.orderIndex });
  };

  const handleMoveDown = (index: number) => {
    if (!parts || index === parts.length - 1) return;
    const curr = parts[index];
    const next = parts[index + 1];
    movePartMutation.mutate({ id: curr.id, orderIndex: next.orderIndex });
    movePartMutation.mutate({ id: next.id, orderIndex: curr.orderIndex });
  };

  if (bookLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!book) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Book not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/image/books")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Books
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/image/books")} data-testid="button-back-books">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Books
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" data-testid="text-editor-book-title">{book.title}</h1>
            <p className="text-sm text-muted-foreground">{book.author} · Parts &amp; Pages Editor</p>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            {book.coverUrl && <img src={book.coverUrl} alt="" className="w-10 h-14 object-cover rounded" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium">{book.title}</p>
              <p className="text-sm text-muted-foreground truncate">{book.description}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/books/${(book as any).slug}`)} data-testid="button-view-book">
              <Save className="w-3.5 h-3.5 mr-1.5" /> View Book
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <TocEditor bookId={bookId!} />
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Parts</h2>
            <span className="text-sm text-muted-foreground">{parts?.length || 0} parts</span>
          </div>

          {partsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : parts && parts.length > 0 ? (
            <div className="space-y-3">
              {parts.map((part, i) => (
                <PartEditor
                  key={part.id}
                  bookId={bookId!}
                  part={part}
                  index={i}
                  totalParts={parts.length}
                  onMoveUp={() => handleMoveUp(i)}
                  onMoveDown={() => handleMoveDown(i)}
                  autoExpand={part.id === newlyAddedPartId}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">No parts yet. Add the first part below.</p>
            </Card>
          )}

          <Card className="p-4 border-dashed">
            <p className="text-sm font-medium mb-3">Add New Part</p>
            <div className="flex gap-2">
              <Input
                value={newPartTitle}
                onChange={(e) => setNewPartTitle(e.target.value)}
                placeholder="Part title..."
                onKeyDown={(e) => { if (e.key === "Enter" && newPartTitle) addPartMutation.mutate(); }}
                data-testid="input-new-part-title"
              />
              <Button onClick={() => addPartMutation.mutate()} disabled={addPartMutation.isPending || !newPartTitle} data-testid="button-add-part">
                {addPartMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
