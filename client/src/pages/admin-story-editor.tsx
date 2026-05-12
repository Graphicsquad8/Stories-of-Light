import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Save, Loader2, Eye, Upload, X, Music,
  Plus, Trash2, ChevronDown, ChevronUp, GripVertical,
  FileText, Edit2, Copy, Video, ImageIcon, Maximize2, Minimize2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, type ReactNode } from "react";
import type { StoryWithCategory, Category, StoryPartWithPages, StoryPage } from "@shared/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function ResizableModal({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [size, setSize] = useState({ width: 600, height: 680 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prevSize, setPrevSize] = useState({ width: 600, height: 680 });
  const isResizing = useRef<"se" | "e" | "w" | null>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const makeResizeHandler = (direction: "se" | "e" | "w") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = direction;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...size };

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;
      if (isResizing.current === "se") {
        setSize({
          width: Math.max(420, startSize.current.width + dx),
          height: Math.max(300, startSize.current.height + dy),
        });
      } else if (isResizing.current === "e") {
        setSize(prev => ({ ...prev, width: Math.max(420, startSize.current.width + dx) }));
      } else if (isResizing.current === "w") {
        setSize(prev => ({ ...prev, width: Math.max(420, startSize.current.width - dx) }));
      }
    };
    const onMouseUp = () => {
      isResizing.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      setSize(prevSize);
      setIsFullscreen(false);
    } else {
      setPrevSize(size);
      setIsFullscreen(true);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div
        className={`bg-background shadow-2xl flex flex-col overflow-hidden ${isFullscreen ? "fixed inset-0 rounded-none" : "rounded-lg relative"}`}
        style={isFullscreen ? {} : { width: size.width, height: size.height, maxWidth: "95vw", maxHeight: "95vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {!isFullscreen && (
          <div
            className="absolute top-0 bottom-0 left-0 w-2 cursor-ew-resize z-10 hover:bg-primary/10 transition-colors rounded-l-lg"
            onMouseDown={makeResizeHandler("w")}
            title="Drag to resize width"
            data-testid="resize-handle-left"
          />
        )}
        {!isFullscreen && (
          <div
            className="absolute top-0 bottom-0 right-0 w-2 cursor-ew-resize z-10 hover:bg-primary/10 transition-colors rounded-r-lg"
            onMouseDown={makeResizeHandler("e")}
            title="Drag to resize width"
            data-testid="resize-handle-right"
          />
        )}

        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-muted/30">
          <h2 className="font-semibold text-sm">{title}</h2>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit full-page mode" : "Full-page mode"}
              data-testid="button-modal-fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => onOpenChange(false)}
              data-testid="button-modal-close"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {children}
        </div>

        {footer && (
          <div className="border-t px-4 py-3 flex justify-end gap-2 shrink-0 bg-muted/10">
            {footer}
          </div>
        )}

        {!isFullscreen && (
          <div
            className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize z-20 flex items-end justify-end"
            onMouseDown={makeResizeHandler("se")}
            data-testid="resize-handle-se"
            title="Drag to resize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-muted-foreground/60 m-0.5">
              <path d="M9 1L1 9M9 5L5 9M9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function PageRow({ page, storyId, index, totalPages }: { page: StoryPage; storyId: string; index: number; totalPages: number }) {
  const { toast } = useToast();
  const [content, setContent] = useState(page.content || "");
  const [isDirty, setIsDirty] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/admin/stories/pages/${page.id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: `Page ${index + 1} saved` });
      setIsDirty(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/stories/pages/${page.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Page deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-background" data-testid={`page-row-${page.id}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Page {index + 1} <span className="font-normal">of {totalPages}</span>
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive h-7 px-2"
          onClick={() => { if (confirm("Delete this page?")) deleteMutation.mutate(); }}
          disabled={deleteMutation.isPending}
          data-testid={`button-delete-page-${page.id}`}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
        </Button>
      </div>
      <Textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
        rows={10}
        className="font-mono text-sm"
        placeholder="<p>Page content...</p>"
        data-testid={`input-page-content-${page.id}`}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || !isDirty}
          data-testid={`button-save-page-${page.id}`}
        >
          {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
          Save Page
        </Button>
        {isDirty && <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>}
        {!isDirty && !updateMutation.isPending && <span className="text-xs text-muted-foreground">Saved</span>}
      </div>
    </div>
  );
}

function PartEditor({
  storyId,
  part,
  index,
  totalParts,
  onMoveUp,
  onMoveDown,
}: {
  storyId: string;
  part: StoryPartWithPages;
  index: number;
  totalParts: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(part.title);
  const [editSummary, setEditSummary] = useState(part.summary || "");
  const [editCoverImage, setEditCoverImage] = useState(part.coverImage || "");
  const [editVideoUrl, setEditVideoUrl] = useState(part.videoUrl || "");
  const [editAudioUrl, setEditAudioUrl] = useState(part.audioUrl || "");
  const [showAddPage, setShowAddPage] = useState(false);
  const [newPageContent, setNewPageContent] = useState("");
  const [dialogNewPageContent, setDialogNewPageContent] = useState("");
  const [editingDialogPageId, setEditingDialogPageId] = useState<string | null>(null);
  const [dialogEditContent, setDialogEditContent] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const handlePartAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePartVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePartCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      await apiRequest("PATCH", `/api/admin/stories/parts/${part.id}`, {
        title: editTitle,
        summary: editSummary || null,
        coverImage: editCoverImage || null,
        videoUrl: editVideoUrl || null,
        audioUrl: editAudioUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Part updated" });
      setEditing(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/stories/parts/${part.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Part deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicatePartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/admin/stories/parts/${part.id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Part duplicated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addPageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/admin/stories/parts/${part.id}/pages`, {
        content: newPageContent,
        orderIndex: (part.pages?.length || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Page added" });
      setNewPageContent("");
      setShowAddPage(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addAndContinueMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/admin/stories/parts/${part.id}/pages`, {
        content: newPageContent,
        orderIndex: (part.pages?.length || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Page saved — ready for next page" });
      setNewPageContent("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addDialogPageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/admin/stories/parts/${part.id}/pages`, {
        content: dialogNewPageContent,
        orderIndex: (part.pages?.length || 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Page saved" });
      setDialogNewPageContent("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateDialogPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      await apiRequest("PATCH", `/api/admin/stories/pages/${pageId}`, { content: dialogEditContent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Page updated" });
      setEditingDialogPageId(null);
      setDialogEditContent("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteDialogPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      await apiRequest("DELETE", `/api/admin/stories/pages/${pageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Page deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicateDialogPageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      await apiRequest("POST", `/api/admin/stories/pages/${pageId}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });
      toast({ title: "Page duplicated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <Card className="overflow-hidden" data-testid={`part-editor-${part.id}`}>
      <div className="flex items-center gap-2 p-3 bg-muted/30 border-b">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left font-medium text-sm truncate"
          data-testid={`button-expand-part-${part.id}`}
        >
          {part.title}
        </button>
        <span className="text-xs text-muted-foreground shrink-0">
          {part.pages?.length || 0} pages
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0} onClick={onMoveUp} data-testid={`button-move-up-${part.id}`}>
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === totalParts - 1} onClick={onMoveDown} data-testid={`button-move-down-${part.id}`}>
            <ChevronDown className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(true)} data-testid={`button-edit-part-${part.id}`}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => duplicatePartMutation.mutate()}
            disabled={duplicatePartMutation.isPending}
            title="Duplicate Part"
            data-testid={`button-duplicate-part-${part.id}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive"
            onClick={() => { if (confirm("Delete this part and all its pages?")) deletePartMutation.mutate(); }}
            disabled={deletePartMutation.isPending}
            data-testid={`button-delete-part-${part.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {part.summary && (
            <p className="text-sm text-muted-foreground">{part.summary}</p>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Pages</h4>

            {part.pages && part.pages.length > 0 ? (
              <div className="space-y-3">
                {part.pages.map((page, pi) => (
                  <PageRow
                    key={page.id}
                    page={page}
                    storyId={storyId}
                    index={pi}
                    totalPages={part.pages!.length}
                  />
                ))}
              </div>
            ) : !showAddPage ? (
              <p className="text-sm text-muted-foreground italic">No pages yet. Use the button below to add the first page.</p>
            ) : null}

            {showAddPage ? (
              <div className="border rounded-lg p-4 space-y-3 bg-muted/20" data-testid={`new-page-form-${part.id}`}>
                <p className="text-sm font-semibold">Page {(part.pages?.length || 0) + 1}</p>
                <Textarea
                  value={newPageContent}
                  onChange={(e) => setNewPageContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="<p>Write your page content here...</p>"
                  data-testid="input-new-page-content"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => addPageMutation.mutate()}
                    disabled={addPageMutation.isPending || addAndContinueMutation.isPending || !newPageContent.trim()}
                    data-testid="button-save-new-page"
                  >
                    {addPageMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save Page
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addAndContinueMutation.mutate()}
                    disabled={addPageMutation.isPending || addAndContinueMutation.isPending || !newPageContent.trim()}
                    data-testid="button-save-next-page"
                  >
                    {addAndContinueMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                    Save & Next Page
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowAddPage(false); setNewPageContent(""); }}
                    data-testid="button-cancel-new-page"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddPage(true)}
                data-testid={`button-add-page-${part.id}`}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Page
              </Button>
            )}
          </div>
        </div>
      )}

      <input ref={audioFileRef} type="file" accept="audio/*" onChange={handlePartAudioUpload} className="hidden" />
      <input ref={videoFileRef} type="file" accept="video/*" onChange={handlePartVideoUpload} className="hidden" />
      <input ref={coverFileRef} type="file" accept="image/*" onChange={handlePartCoverUpload} className="hidden" />

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} data-testid="input-edit-part-title" />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea value={editSummary} onChange={e => setEditSummary(e.target.value)} rows={3} data-testid="input-edit-part-summary" />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Image</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover} data-testid="button-upload-part-cover">
                  {uploadingCover ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingCover ? "Uploading…" : "Upload Image"}
                </Button>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP</span>
              </div>
              {editCoverImage && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={editCoverImage} alt="Cover" className="h-12 rounded object-cover border" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditCoverImage("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={editCoverImage} onChange={e => setEditCoverImage(e.target.value)} placeholder="/images/... or /uploads/covers/..." data-testid="input-edit-part-cover" className="text-xs" />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => audioFileRef.current?.click()} disabled={uploadingAudio} data-testid="button-upload-part-audio">
                  {uploadingAudio ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingAudio ? "Uploading…" : "Upload Audio"}
                </Button>
                <span className="text-xs text-muted-foreground">MP3, WAV, OGG (max 50 MB)</span>
              </div>
              {editAudioUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <audio src={editAudioUrl} controls className="h-8 flex-1 max-w-xs" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditAudioUrl("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={editAudioUrl} onChange={e => setEditAudioUrl(e.target.value)} placeholder="/uploads/audio/narration.mp3 or external URL" data-testid="input-edit-part-audio" className="text-xs" />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => videoFileRef.current?.click()} disabled={uploadingVideo} data-testid="button-upload-part-video">
                  {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingVideo ? "Uploading…" : "Upload Video"}
                </Button>
                <span className="text-xs text-muted-foreground">MP4, WebM (max 500 MB)</span>
              </div>
              {editVideoUrl && (
                <div className="flex items-center gap-2 mt-1">
                  {editVideoUrl.includes("youtube") || editVideoUrl.includes("youtu.be") ? (
                    <span className="text-xs text-muted-foreground truncate flex-1">{editVideoUrl}</span>
                  ) : (
                    <video src={editVideoUrl} controls className="h-16 rounded flex-1 max-w-xs" />
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditVideoUrl("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... or /uploads/videos/..." data-testid="input-edit-part-video" className="text-xs" />
            </div>

            <div className="space-y-3 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {(part.pages?.length || 0) === 0 ? "Content (HTML)" : `Next Page Content (HTML) Upload`}
              </Label>

              {part.pages && part.pages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Saved pages in this part:</p>
                  {part.pages.map((page, pi) => (
                    <div key={page.id}>
                      {editingDialogPageId === page.id ? (
                        <div className="border rounded-md p-3 space-y-2 bg-background">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">Editing Page {pi + 1}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => { setEditingDialogPageId(null); setDialogEditContent(""); }}
                              data-testid={`button-cancel-dialog-edit-${page.id}`}
                            >
                              Cancel
                            </Button>
                          </div>
                          <Textarea
                            value={dialogEditContent}
                            onChange={e => setDialogEditContent(e.target.value)}
                            rows={8}
                            className="font-mono text-xs"
                            placeholder="<p>Page content...</p>"
                            data-testid={`input-dialog-edit-${page.id}`}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => updateDialogPageMutation.mutate(page.id)}
                              disabled={updateDialogPageMutation.isPending || !dialogEditContent.trim()}
                              data-testid={`button-update-dialog-page-${page.id}`}
                            >
                              {updateDialogPageMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                              Update Page {pi + 1}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-1.5 group">
                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="font-medium text-muted-foreground w-12 shrink-0">Page {pi + 1}</span>
                          <span className="truncate flex-1 text-muted-foreground">
                            {(page.content || "").replace(/<[^>]*>/g, "").slice(0, 55)}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0 ml-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => { setEditingDialogPageId(page.id); setDialogEditContent(page.content || ""); }}
                              title="Edit page"
                              data-testid={`button-dialog-edit-page-${page.id}`}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => duplicateDialogPageMutation.mutate(page.id)}
                              disabled={duplicateDialogPageMutation.isPending}
                              title="Duplicate page"
                              data-testid={`button-dialog-duplicate-page-${page.id}`}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive"
                              onClick={() => { if (confirm(`Delete Page ${pi + 1}?`)) deleteDialogPageMutation.mutate(page.id); }}
                              disabled={deleteDialogPageMutation.isPending}
                              title="Delete page"
                              data-testid={`button-dialog-delete-page-${page.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                value={dialogNewPageContent}
                onChange={e => setDialogNewPageContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder={`<p>Page ${(part.pages?.length || 0) + 1} content here...</p>`}
                data-testid="input-dialog-page-content"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addDialogPageMutation.mutate()}
                  disabled={addDialogPageMutation.isPending || !dialogNewPageContent.trim()}
                  data-testid="button-save-dialog-page"
                >
                  {addDialogPageMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Page {(part.pages?.length || 0) + 1}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={() => updatePartMutation.mutate()} disabled={updatePartMutation.isPending || !editTitle || uploadingAudio || uploadingVideo || uploadingCover} data-testid="button-save-edit-part">
              {updatePartMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  );
}

export default function AdminStoryEditorPage() {
  const params = useParams<{ id: string }>();
  const isEdit = !!params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [tagsString, setTagsString] = useState("");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [ratingEnabled, setRatingEnabled] = useState(true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [deleteStoryOpen, setDeleteStoryOpen] = useState(false);

  const [newCatDialogOpen, setNewCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDescription, setNewCatDescription] = useState("");

  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailFileRef = useRef<HTMLInputElement>(null);

  const [showAddPart, setShowAddPart] = useState(false);
  const [addPartStage, setAddPartStage] = useState<"details" | "pages">("details");
  const [createdPartId, setCreatedPartId] = useState<string | null>(null);
  const [addModalPageContent, setAddModalPageContent] = useState("");
  const [addModalSavedPages, setAddModalSavedPages] = useState<Array<{ id: string; content: string }>>([]);
  const [addModalEditingPageId, setAddModalEditingPageId] = useState<string | null>(null);
  const [addModalEditContent, setAddModalEditContent] = useState("");

  const [newPartTitle, setNewPartTitle] = useState("");
  const [newPartSummary, setNewPartSummary] = useState("");
  const [newPartCoverImage, setNewPartCoverImage] = useState("");
  const [newPartVideoUrl, setNewPartVideoUrl] = useState("");
  const [newPartAudioUrl, setNewPartAudioUrl] = useState("");
  const [uploadingNewPartAudio, setUploadingNewPartAudio] = useState(false);
  const [uploadingNewPartVideo, setUploadingNewPartVideo] = useState(false);
  const [uploadingNewPartCover, setUploadingNewPartCover] = useState(false);
  const newPartAudioRef = useRef<HTMLInputElement>(null);
  const newPartVideoRef = useRef<HTMLInputElement>(null);
  const newPartCoverRef = useRef<HTMLInputElement>(null);

  const { data: story, isLoading: storyLoading } = useQuery<StoryWithCategory>({
    queryKey: ["/api/stories", params.id],
    enabled: isEdit,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: parts } = useQuery<StoryPartWithPages[]>({
    queryKey: ["/api/admin/stories", params.id, "parts"],
    queryFn: () => fetch(`/api/admin/stories/${params.id}/parts`, { credentials: "include" }).then(r => r.json()),
    enabled: isEdit,
  });

  useEffect(() => {
    if (story && isEdit) {
      setTitle(story.title || "");
      setSlug(story.slug || "");
      setExcerpt(story.excerpt || "");
      setContent(story.content || "");
      setCategoryId(story.categoryId || "");
      setThumbnail(story.thumbnail || "");
      setYoutubeUrl(story.youtubeUrl || "");
      setAudioUrl(story.audioUrl || "");
      setTagsString((story.tags || []).join(", "));
      setStatus(story.status || "draft");
      setFeatured(story.featured || false);
      setRatingEnabled(story.ratingEnabled ?? true);
      setSlugManuallyEdited(true);
    }
  }, [story, isEdit]);

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      const name = newCatName.trim();
      if (!name) throw new Error("Category name is required");
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const res = await apiRequest("POST", "/api/categories", {
        name,
        slug,
        description: newCatDescription.trim() || null,
        orderIndex: 0,
      });
      return res.json();
    },
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryId(newCat.id);
      setNewCatDialogOpen(false);
      setNewCatName("");
      setNewCatDescription("");
      toast({ title: "Category created", description: `"${newCat.name}" has been created and selected.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const tags = tagsString.split(",").map((t) => t.trim()).filter(Boolean);
      const data = {
        title,
        slug,
        excerpt,
        content,
        categoryId: categoryId || null,
        thumbnail,
        youtubeUrl,
        audioUrl,
        tags,
        status,
        featured,
        ratingEnabled,
        publishedAt: status === "published" ? new Date().toISOString() : null,
      };

      if (isEdit) {
        await apiRequest("PATCH", `/api/stories/${params.id}`, data);
        return null;
      } else {
        const res = await apiRequest("POST", "/api/stories", data);
        return res.json();
      }
    },
    onSuccess: (newStory) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      if (isEdit) {
        toast({ title: "Story updated" });
        navigate("/image/stories");
      } else {
        toast({ title: "Story created", description: "You can now add Parts and Pages below." });
        navigate(`/image/stories/${newStory.id}/edit`);
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/stories/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      toast({ title: "Story deleted" });
      navigate("/image/stories");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumbnail(true);
    try {
      const form = new FormData();
      form.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setThumbnail(data.url);
      toast({ title: "Thumbnail uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailFileRef.current) thumbnailFileRef.current.value = "";
    }
  };

  const handleNewPartAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNewPartAudio(true);
    try {
      const form = new FormData();
      form.append("audio", file);
      const res = await fetch("/api/upload/audio", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setNewPartAudioUrl(data.url);
      toast({ title: "Audio uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingNewPartAudio(false);
      if (newPartAudioRef.current) newPartAudioRef.current.value = "";
    }
  };

  const handleNewPartVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNewPartVideo(true);
    try {
      const form = new FormData();
      form.append("video", file);
      const res = await fetch("/api/upload/video", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setNewPartVideoUrl(data.url);
      toast({ title: "Video uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingNewPartVideo(false);
      if (newPartVideoRef.current) newPartVideoRef.current.value = "";
    }
  };

  const handleNewPartCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNewPartCover(true);
    try {
      const form = new FormData();
      form.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setNewPartCoverImage(data.url);
      toast({ title: "Cover image uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingNewPartCover(false);
      if (newPartCoverRef.current) newPartCoverRef.current.value = "";
    }
  };

  const resetAddPartModal = () => {
    setShowAddPart(false);
    setAddPartStage("details");
    setCreatedPartId(null);
    setAddModalPageContent("");
    setAddModalSavedPages([]);
    setAddModalEditingPageId(null);
    setAddModalEditContent("");
    setNewPartTitle("");
    setNewPartSummary("");
    setNewPartCoverImage("");
    setNewPartVideoUrl("");
    setNewPartAudioUrl("");
  };

  const addPartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/stories/${params.id}/parts`, {
        title: newPartTitle,
        summary: newPartSummary || null,
        coverImage: newPartCoverImage || null,
        videoUrl: newPartVideoUrl || null,
        audioUrl: newPartAudioUrl || null,
        orderIndex: parts?.length || 0,
      });
      return res.json();
    },
    onSuccess: (createdPart: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", params.id, "parts"] });
      toast({ title: "Part saved! Now add page content below." });
      setCreatedPartId(createdPart.id);
      setAddPartStage("pages");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addModalPageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/stories/parts/${createdPartId}/pages`, {
        content: addModalPageContent,
        orderIndex: addModalSavedPages.length,
      });
      return res.json();
    },
    onSuccess: (newPage: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", params.id, "parts"] });
      setAddModalSavedPages(prev => [...prev, { id: newPage.id, content: addModalPageContent }]);
      setAddModalPageContent("");
      toast({ title: `Page ${addModalSavedPages.length + 1} saved` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addModalUpdatePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      await apiRequest("PATCH", `/api/admin/stories/pages/${pageId}`, { content: addModalEditContent });
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", params.id, "parts"] });
      setAddModalSavedPages(prev => prev.map(p => p.id === pageId ? { ...p, content: addModalEditContent } : p));
      setAddModalEditingPageId(null);
      setAddModalEditContent("");
      toast({ title: "Page updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addModalDeletePageMutation = useMutation({
    mutationFn: async (pageId: string) => {
      await apiRequest("DELETE", `/api/admin/stories/pages/${pageId}`);
    },
    onSuccess: (_, pageId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", params.id, "parts"] });
      setAddModalSavedPages(prev => prev.filter(p => p.id !== pageId));
      toast({ title: "Page deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reorderPartMutation = useMutation({
    mutationFn: async ({ partId, newIndex }: { partId: string; newIndex: number }) => {
      await apiRequest("PATCH", `/api/admin/stories/parts/${partId}`, { orderIndex: newIndex });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", params.id, "parts"] });
    },
  });

  const handleMovePart = (currentIndex: number, direction: "up" | "down") => {
    if (!parts) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentPart = parts[currentIndex];
    const targetPart = parts[targetIndex];
    if (!currentPart || !targetPart) return;
    reorderPartMutation.mutate({ partId: currentPart.id, newIndex: targetIndex });
    reorderPartMutation.mutate({ partId: targetPart.id, newIndex: currentIndex });
  };

  if (isEdit && storyLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-8 w-48" />
          <Card className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/image/stories")} data-testid="button-back-stories">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Stories
          </Button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold" data-testid="text-editor-title">
            {isEdit ? "Edit Story" : "New Story"}
          </h1>
        </div>

        <div className="grid gap-6">
          <Card className="p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter story title..."
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="story-url-slug"
                  data-testid="input-slug"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description of the story..."
                  rows={3}
                  data-testid="input-excerpt"
                />
              </div>

            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={(val) => { if (val === "__new__") { setNewCatDialogOpen(true); } else { setCategoryId(val); } }}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-1.5 text-primary font-medium">
                        <Plus className="w-3.5 h-3.5" /> Create New Category
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail</Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="/images/category-sahaba.png"
                    data-testid="input-thumbnail"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => thumbnailFileRef.current?.click()}
                    disabled={uploadingThumbnail}
                    data-testid="button-upload-thumbnail"
                    className="shrink-0"
                  >
                    {uploadingThumbnail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span className="ml-1.5 hidden sm:inline">{uploadingThumbnail ? "Uploading…" : "Upload"}</span>
                  </Button>
                  <input
                    ref={thumbnailFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </div>
                {thumbnail && (
                  <img src={thumbnail} alt="Thumbnail preview" className="h-16 w-24 object-cover rounded border mt-1" />
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tagsString}
                  onChange={(e) => setTagsString(e.target.value)}
                  placeholder="sahaba, faith, history"
                  data-testid="input-tags"
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={featured}
                  onCheckedChange={setFeatured}
                  data-testid="switch-featured"
                />
                <Label>Featured story</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={ratingEnabled}
                  onCheckedChange={setRatingEnabled}
                  data-testid="switch-rating-enabled"
                />
                <Label>Enable Ratings (allow users to rate this story)</Label>
              </div>
            </div>
          </Card>

          <Card className="p-6" data-testid="card-parts-manager">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Article Parts
              </h2>
              {isEdit && (
                <Button size="sm" onClick={() => setShowAddPart(true)} data-testid="button-add-part">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Part
                </Button>
              )}
            </div>

            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Create the article first to add Parts</p>
                <p className="text-xs mt-1 max-w-xs mx-auto">After clicking "Create Story", you'll be redirected to this article's edit page where you can add Parts and Pages to organize your content.</p>
              </div>
            ) : !parts || parts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No parts yet. Add parts to enable multi-page reading experience.</p>
                <p className="text-xs mt-1">Add your first part, then add pages of content to it.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {parts.map((part, i) => (
                  <PartEditor
                    key={part.id}
                    storyId={params.id!}
                    part={part}
                    index={i}
                    totalParts={parts.length}
                    onMoveUp={() => handleMovePart(i, "up")}
                    onMoveDown={() => handleMovePart(i, "down")}
                  />
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {isEdit && slug && (
              <a href={`/stories/${slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" data-testid="button-preview">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </a>
            )}
            <div className="flex items-center gap-3 ml-auto">
              {isEdit && (
                <Button
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteStoryOpen(true)}
                  disabled={deleteStoryMutation.isPending}
                  data-testid="button-delete-story"
                >
                  {deleteStoryMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete Story
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/image/stories")} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !title || !slug}
                data-testid="button-save"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEdit ? "Update" : "Create"} Story
              </Button>
            </div>
          </div>
        </div>
      </div>

      <input ref={newPartAudioRef} type="file" accept="audio/*" onChange={handleNewPartAudioUpload} className="hidden" />
      <input ref={newPartVideoRef} type="file" accept="video/*" onChange={handleNewPartVideoUpload} className="hidden" />
      <input ref={newPartCoverRef} type="file" accept="image/*" onChange={handleNewPartCoverUpload} className="hidden" />

      <ResizableModal
        open={showAddPart}
        onOpenChange={(open) => { if (!open) resetAddPartModal(); else setShowAddPart(true); }}
        title={addPartStage === "details" ? "Add New Part" : `Add Pages — ${newPartTitle}`}
        footer={
          addPartStage === "details" ? (
            <>
              <Button variant="outline" onClick={resetAddPartModal}>Cancel</Button>
              <Button
                onClick={() => addPartMutation.mutate()}
                disabled={addPartMutation.isPending || !newPartTitle || uploadingNewPartAudio || uploadingNewPartVideo || uploadingNewPartCover}
                data-testid="button-save-new-part"
              >
                {addPartMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Part & Add Pages
              </Button>
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground mr-auto">
                {addModalSavedPages.length} page{addModalSavedPages.length !== 1 ? "s" : ""} saved
              </span>
              <Button variant="outline" onClick={resetAddPartModal} data-testid="button-done-add-part">
                Done
              </Button>
            </>
          )
        }
      >
        {addPartStage === "details" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={newPartTitle}
                onChange={e => setNewPartTitle(e.target.value)}
                placeholder="Part title..."
                data-testid="input-new-part-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                value={newPartSummary}
                onChange={e => setNewPartSummary(e.target.value)}
                placeholder="Brief summary of this part..."
                rows={3}
                data-testid="input-new-part-summary"
              />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Image</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => newPartCoverRef.current?.click()} disabled={uploadingNewPartCover} data-testid="button-upload-new-part-cover">
                  {uploadingNewPartCover ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingNewPartCover ? "Uploading…" : "Upload Image"}
                </Button>
                <span className="text-xs text-muted-foreground">JPG, PNG, WebP</span>
              </div>
              {newPartCoverImage && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={newPartCoverImage} alt="Cover" className="h-12 rounded object-cover border" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewPartCoverImage("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={newPartCoverImage} onChange={e => setNewPartCoverImage(e.target.value)} placeholder="/images/... or /uploads/covers/..." data-testid="input-new-part-cover" className="text-xs" />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => newPartAudioRef.current?.click()} disabled={uploadingNewPartAudio} data-testid="button-upload-new-part-audio">
                  {uploadingNewPartAudio ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingNewPartAudio ? "Uploading…" : "Upload Audio"}
                </Button>
                <span className="text-xs text-muted-foreground">MP3, WAV, OGG (max 50 MB)</span>
              </div>
              {newPartAudioUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <audio src={newPartAudioUrl} controls className="h-8 flex-1 max-w-xs" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewPartAudioUrl("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={newPartAudioUrl} onChange={e => setNewPartAudioUrl(e.target.value)} placeholder="/uploads/audio/narration.mp3 or external URL" data-testid="input-new-part-audio" className="text-xs" />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => newPartVideoRef.current?.click()} disabled={uploadingNewPartVideo} data-testid="button-upload-new-part-video">
                  {uploadingNewPartVideo ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingNewPartVideo ? "Uploading…" : "Upload Video"}
                </Button>
                <span className="text-xs text-muted-foreground">MP4, WebM (max 500 MB)</span>
              </div>
              {newPartVideoUrl && (
                <div className="flex items-center gap-2 mt-1">
                  {newPartVideoUrl.includes("youtube") || newPartVideoUrl.includes("youtu.be") ? (
                    <span className="text-xs text-muted-foreground truncate flex-1">{newPartVideoUrl}</span>
                  ) : (
                    <video src={newPartVideoUrl} controls className="h-16 rounded flex-1 max-w-xs" />
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewPartVideoUrl("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={newPartVideoUrl} onChange={e => setNewPartVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... or /uploads/videos/..." data-testid="input-new-part-video" className="text-xs" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium">Part saved! Now add content page by page.</span>
            </div>

            <div className="space-y-3 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5 font-semibold">
                <FileText className="w-3.5 h-3.5" />
                Next Page Content (HTML) Upload
              </Label>

              {addModalSavedPages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Saved pages in this part:</p>
                  {addModalSavedPages.map((page, pi) => (
                    <div key={page.id}>
                      {addModalEditingPageId === page.id ? (
                        <div className="border rounded-md p-3 space-y-2 bg-background">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">Editing Page {pi + 1}</span>
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setAddModalEditingPageId(null); setAddModalEditContent(""); }}>
                              Cancel
                            </Button>
                          </div>
                          <Textarea
                            value={addModalEditContent}
                            onChange={e => setAddModalEditContent(e.target.value)}
                            rows={8}
                            className="font-mono text-xs"
                            data-testid={`input-addmodal-edit-${page.id}`}
                          />
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => addModalUpdatePageMutation.mutate(page.id)} disabled={addModalUpdatePageMutation.isPending || !addModalEditContent.trim()}>
                              {addModalUpdatePageMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                              Update Page {pi + 1}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-1.5">
                          <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="font-medium text-muted-foreground w-12 shrink-0">Page {pi + 1}</span>
                          <span className="truncate flex-1 text-muted-foreground">
                            {(page.content || "").replace(/<[^>]*>/g, "").slice(0, 55)}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setAddModalEditingPageId(page.id); setAddModalEditContent(page.content); }} title="Edit">
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm(`Delete Page ${pi + 1}?`)) addModalDeletePageMutation.mutate(page.id); }} disabled={addModalDeletePageMutation.isPending} title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                value={addModalPageContent}
                onChange={e => setAddModalPageContent(e.target.value)}
                rows={10}
                className="font-mono text-sm"
                placeholder={`<p>Page ${addModalSavedPages.length + 1} content here...</p>`}
                data-testid="input-add-modal-page-content"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addModalPageMutation.mutate()}
                  disabled={addModalPageMutation.isPending || !addModalPageContent.trim()}
                  data-testid="button-save-add-modal-page"
                >
                  {addModalPageMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Page {addModalSavedPages.length + 1}
                </Button>
              </div>
            </div>
          </div>
        )}
      </ResizableModal>

      <Dialog open={newCatDialogOpen} onOpenChange={(open) => { setNewCatDialogOpen(open); if (!open) { setNewCatName(""); setNewCatDescription(""); } }}>
        <DialogContent className="max-w-md" data-testid="dialog-create-category">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name <span className="text-destructive">*</span></Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Stories of the Prophets"
                data-testid="input-new-category-name"
                autoFocus
              />
              {newCatName.trim() && (
                <p className="text-xs text-muted-foreground">
                  Slug: <code className="bg-muted px-1 rounded">{newCatName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}</code>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={newCatDescription}
                onChange={(e) => setNewCatDescription(e.target.value)}
                placeholder="Brief description of this category..."
                rows={3}
                data-testid="input-new-category-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCatDialogOpen(false)} data-testid="button-cancel-create-category">Cancel</Button>
            <Button
              onClick={() => createCategoryMutation.mutate()}
              disabled={createCategoryMutation.isPending || !newCatName.trim()}
              data-testid="button-confirm-create-category"
            >
              {createCategoryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteStoryOpen} onOpenChange={setDeleteStoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this story along with all its Parts and Pages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-story">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteStoryMutation.mutate()}
              data-testid="button-confirm-delete-story"
            >
              Delete Story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
