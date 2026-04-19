import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Trash2, Save, GripVertical, ChevronDown, ChevronUp,
  Edit2, Copy, FileText, ImageIcon, Music, Video, Upload, X, Loader2,
} from "lucide-react";
import type { StoryWithCategory, StoryPartWithPages } from "@shared/schema";

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
  const [dialogNewPageContent, setDialogNewPageContent] = useState("");
  const [editingDialogPageId, setEditingDialogPageId] = useState<string | null>(null);
  const [dialogEditContent, setDialogEditContent] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", storyId, "parts"] });

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAudio(true);
    try {
      const fd = new FormData(); fd.append("audio", file);
      const res = await fetch("/api/upload/audio", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      setEditAudioUrl((await res.json()).url);
      toast({ title: "Audio uploaded" });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploadingAudio(false); if (audioFileRef.current) audioFileRef.current.value = ""; }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingVideo(true);
    try {
      const fd = new FormData(); fd.append("video", file);
      const res = await fetch("/api/upload/video", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      setEditVideoUrl((await res.json()).url);
      toast({ title: "Video uploaded" });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploadingVideo(false); if (videoFileRef.current) videoFileRef.current.value = ""; }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCover(true);
    try {
      const fd = new FormData(); fd.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      setEditCoverImage((await res.json()).url);
      toast({ title: "Cover uploaded" });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploadingCover(false); if (coverFileRef.current) coverFileRef.current.value = ""; }
  };

  const updatePartMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/stories/parts/${part.id}`, {
      title: editTitle, summary: editSummary || null,
      coverImage: editCoverImage || null, videoUrl: editVideoUrl || null, audioUrl: editAudioUrl || null,
    }),
    onSuccess: () => { invalidate(); toast({ title: "Part updated" }); setEditing(false); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePartMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/stories/parts/${part.id}`),
    onSuccess: () => { invalidate(); toast({ title: "Part deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicatePartMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/stories/parts/${part.id}/duplicate`),
    onSuccess: () => { invalidate(); toast({ title: "Part duplicated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addDialogPageMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/stories/parts/${part.id}/pages`, {
      content: dialogNewPageContent, orderIndex: part.pages?.length || 0,
    }),
    onSuccess: () => { invalidate(); setDialogNewPageContent(""); toast({ title: `Page ${(part.pages?.length || 0) + 1} saved` }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateDialogPageMutation = useMutation({
    mutationFn: (pageId: string) => apiRequest("PATCH", `/api/admin/stories/pages/${pageId}`, { content: dialogEditContent }),
    onSuccess: () => { invalidate(); setEditingDialogPageId(null); setDialogEditContent(""); toast({ title: "Page updated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteDialogPageMutation = useMutation({
    mutationFn: (pageId: string) => apiRequest("DELETE", `/api/admin/stories/pages/${pageId}`),
    onSuccess: () => { invalidate(); toast({ title: "Page deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicateDialogPageMutation = useMutation({
    mutationFn: (pageId: string) => apiRequest("POST", `/api/admin/stories/pages/${pageId}/duplicate`),
    onSuccess: () => { invalidate(); toast({ title: "Page duplicated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <>
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
          <span className="text-xs text-muted-foreground shrink-0">{part.pages?.length || 0} pages</span>
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
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicatePartMutation.mutate()} disabled={duplicatePartMutation.isPending} title="Duplicate Part" data-testid={`button-duplicate-part-${part.id}`}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this part and all its pages?")) deletePartMutation.mutate(); }} disabled={deletePartMutation.isPending} data-testid={`button-delete-part-${part.id}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="p-4 space-y-3">
            {part.summary && <p className="text-sm text-muted-foreground">{part.summary}</p>}
            <h4 className="text-sm font-semibold">Pages</h4>
            {part.pages && part.pages.length > 0 ? (
              <div className="space-y-1.5">
                {part.pages.map((page, pi) => (
                  <div key={page.id} className="text-xs bg-muted/50 rounded px-2 py-1.5">
                    <div className="flex items-center gap-1 group">
                      <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-muted-foreground w-12 shrink-0">Page {pi + 1}</span>
                      <span className="truncate flex-1 text-muted-foreground">
                        {(page.content || "").replace(/<[^>]*>/g, "").slice(0, 60)}
                      </span>
                      <div className="flex gap-0.5 shrink-0 ml-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingDialogPageId(page.id); setDialogEditContent(page.content || ""); setEditing(true); }} title="Edit page" data-testid={`button-edit-page-${page.id}`}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => duplicateDialogPageMutation.mutate(page.id)} disabled={duplicateDialogPageMutation.isPending} title="Duplicate" data-testid={`button-dup-page-${page.id}`}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm(`Delete Page ${pi + 1}?`)) deleteDialogPageMutation.mutate(page.id); }} disabled={deleteDialogPageMutation.isPending} title="Delete" data-testid={`button-del-page-${page.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No pages yet. Click Edit to add content pages.</p>
            )}
          </div>
        )}
      </Card>

      <input ref={audioFileRef} type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
      <input ref={videoFileRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
      <input ref={coverFileRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />

      <Dialog open={editing} onOpenChange={(open) => { if (!open) { setEditing(false); setEditingDialogPageId(null); setDialogEditContent(""); } }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Part — {part.title}</DialogTitle>
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
                <Button type="button" variant="outline" size="sm" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}>
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
              <Input value={editCoverImage} onChange={e => setEditCoverImage(e.target.value)} placeholder="/images/... or /uploads/covers/..." className="text-xs" data-testid="input-edit-part-cover" />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => audioFileRef.current?.click()} disabled={uploadingAudio}>
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
              <Input value={editAudioUrl} onChange={e => setEditAudioUrl(e.target.value)} placeholder="/uploads/audio/... or external URL" className="text-xs" data-testid="input-edit-part-audio" />
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => videoFileRef.current?.click()} disabled={uploadingVideo}>
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
              <Input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} placeholder="https://youtube.com/... or /uploads/videos/..." className="text-xs" data-testid="input-edit-part-video" />
            </div>

            <div className="space-y-3 rounded-md border p-3 bg-muted/30">
              <Label className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {(part.pages?.length || 0) === 0 ? "Content (HTML)" : `Next Page Content (HTML)`}
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
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setEditingDialogPageId(null); setDialogEditContent(""); }}>Cancel</Button>
                          </div>
                          <Textarea value={dialogEditContent} onChange={e => setDialogEditContent(e.target.value)} rows={8} className="font-mono text-xs" data-testid={`input-dialog-edit-${page.id}`} />
                          <div className="flex justify-end">
                            <Button size="sm" onClick={() => updateDialogPageMutation.mutate(page.id)} disabled={updateDialogPageMutation.isPending || !dialogEditContent.trim()} data-testid={`button-update-dialog-page-${page.id}`}>
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
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingDialogPageId(page.id); setDialogEditContent(page.content || ""); }} title="Edit page" data-testid={`button-dialog-edit-page-${page.id}`}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => duplicateDialogPageMutation.mutate(page.id)} disabled={duplicateDialogPageMutation.isPending} title="Duplicate" data-testid={`button-dialog-dup-page-${page.id}`}>
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => { if (confirm(`Delete Page ${pi + 1}?`)) deleteDialogPageMutation.mutate(page.id); }} disabled={deleteDialogPageMutation.isPending} title="Delete" data-testid={`button-dialog-del-page-${page.id}`}>
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
                <Button type="button" size="sm" onClick={() => addDialogPageMutation.mutate()} disabled={addDialogPageMutation.isPending || !dialogNewPageContent.trim()} data-testid="button-save-dialog-page">
                  {addDialogPageMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Page {(part.pages?.length || 0) + 1}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditing(false); setEditingDialogPageId(null); setDialogEditContent(""); }}>Cancel</Button>
            <Button onClick={() => updatePartMutation.mutate()} disabled={updatePartMutation.isPending || !editTitle || uploadingAudio || uploadingVideo || uploadingCover} data-testid="button-save-edit-part">
              {updatePartMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminStoryManagePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [showAddPart, setShowAddPart] = useState(false);
  const [addPartStage, setAddPartStage] = useState<"details" | "pages">("details");
  const [createdPartId, setCreatedPartId] = useState<string | null>(null);
  const [newPartTitle, setNewPartTitle] = useState("");
  const [newPartSummary, setNewPartSummary] = useState("");
  const [newPartCoverImage, setNewPartCoverImage] = useState("");
  const [newPartVideoUrl, setNewPartVideoUrl] = useState("");
  const [newPartAudioUrl, setNewPartAudioUrl] = useState("");
  const [addModalPageContent, setAddModalPageContent] = useState("");
  const [addModalSavedPages, setAddModalSavedPages] = useState<Array<{ id: string; content: string }>>([]);
  const [uploadingNewPartAudio, setUploadingNewPartAudio] = useState(false);
  const [uploadingNewPartVideo, setUploadingNewPartVideo] = useState(false);
  const [uploadingNewPartCover, setUploadingNewPartCover] = useState(false);
  const newPartAudioRef = useRef<HTMLInputElement>(null);
  const newPartVideoRef = useRef<HTMLInputElement>(null);
  const newPartCoverRef = useRef<HTMLInputElement>(null);

  const { data: story, isLoading: storyLoading } = useQuery<StoryWithCategory>({
    queryKey: ["/api/stories", id],
    queryFn: async () => {
      const res = await fetch(`/api/stories/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: parts, isLoading: partsLoading } = useQuery<StoryPartWithPages[]>({
    queryKey: ["/api/admin/stories", id, "parts"],
    queryFn: () => fetch(`/api/admin/stories/${id}/parts`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const isLoading = storyLoading || partsLoading;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", id, "parts"] });

  const resetAddPartModal = () => {
    setShowAddPart(false); setAddPartStage("details"); setCreatedPartId(null);
    setNewPartTitle(""); setNewPartSummary(""); setNewPartCoverImage(""); setNewPartVideoUrl(""); setNewPartAudioUrl("");
    setAddModalPageContent(""); setAddModalSavedPages([]);
  };

  const handleNewPartAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingNewPartAudio(true);
    try {
      const fd = new FormData(); fd.append("audio", file);
      const res = await fetch("/api/upload/audio", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      setNewPartAudioUrl((await res.json()).url);
      toast({ title: "Audio uploaded" });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploadingNewPartAudio(false); if (newPartAudioRef.current) newPartAudioRef.current.value = ""; }
  };

  const handleNewPartVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingNewPartVideo(true);
    try {
      const fd = new FormData(); fd.append("video", file);
      const res = await fetch("/api/upload/video", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      setNewPartVideoUrl((await res.json()).url);
      toast({ title: "Video uploaded" });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploadingNewPartVideo(false); if (newPartVideoRef.current) newPartVideoRef.current.value = ""; }
  };

  const handleNewPartCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingNewPartCover(true);
    try {
      const fd = new FormData(); fd.append("cover", file);
      const res = await fetch("/api/upload/cover", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      setNewPartCoverImage((await res.json()).url);
      toast({ title: "Cover uploaded" });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setUploadingNewPartCover(false); if (newPartCoverRef.current) newPartCoverRef.current.value = ""; }
  };

  const addPartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/stories/${id}/parts`, {
        title: newPartTitle, summary: newPartSummary || null,
        coverImage: newPartCoverImage || null, videoUrl: newPartVideoUrl || null, audioUrl: newPartAudioUrl || null,
        orderIndex: parts?.length || 0,
      });
      return res.json();
    },
    onSuccess: (created: any) => {
      invalidate();
      toast({ title: "Part saved! Now add content pages below." });
      setCreatedPartId(created.id);
      setAddPartStage("pages");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addModalPageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/stories/parts/${createdPartId}/pages`, {
        content: addModalPageContent, orderIndex: addModalSavedPages.length,
      });
      return res.json();
    },
    onSuccess: (newPage: any) => {
      invalidate();
      setAddModalSavedPages(prev => [...prev, { id: newPage.id, content: addModalPageContent }]);
      setAddModalPageContent("");
      toast({ title: `Page ${addModalSavedPages.length + 1} saved` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reorderPartMutation = useMutation({
    mutationFn: ({ partId, newIndex }: { partId: string; newIndex: number }) =>
      apiRequest("PATCH", `/api/admin/stories/parts/${partId}`, { orderIndex: newIndex }),
    onSuccess: () => invalidate(),
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

  const status = (story as any)?.status;
  const isPublished = status === "published";

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start gap-3 mb-6">
          <Link href="/image/stories">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            {isLoading ? <Skeleton className="h-7 w-56" /> : (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold truncate" data-testid="text-story-title">{story?.title}</h1>
                <Badge variant={isPublished ? "default" : "secondary"}>
                  {isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">Add and manage article parts and pages.</p>
          </div>
          <Button onClick={() => setShowAddPart(true)} data-testid="button-add-part">
            <Plus className="w-4 h-4 mr-2" /> Add Part
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : !parts || parts.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No parts yet</p>
            <p className="text-sm mt-1 mb-4">Add parts to enable a multi-page reading experience.</p>
            <Button onClick={() => setShowAddPart(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add First Part
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {parts.map((part, i) => (
              <PartEditor
                key={part.id}
                storyId={id!}
                part={part}
                index={i}
                totalParts={parts.length}
                onMoveUp={() => handleMovePart(i, "up")}
                onMoveDown={() => handleMovePart(i, "down")}
              />
            ))}
          </div>
        )}
      </div>

      <input ref={newPartAudioRef} type="file" accept="audio/*" onChange={handleNewPartAudioUpload} className="hidden" />
      <input ref={newPartVideoRef} type="file" accept="video/*" onChange={handleNewPartVideoUpload} className="hidden" />
      <input ref={newPartCoverRef} type="file" accept="image/*" onChange={handleNewPartCoverUpload} className="hidden" />

      <Dialog open={showAddPart} onOpenChange={(open) => { if (!open) resetAddPartModal(); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{addPartStage === "details" ? "Add New Part" : `Add Pages — ${newPartTitle}`}</DialogTitle>
          </DialogHeader>

          {addPartStage === "details" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={newPartTitle} onChange={e => setNewPartTitle(e.target.value)} placeholder="Part title..." data-testid="input-new-part-title" />
              </div>
              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea value={newPartSummary} onChange={e => setNewPartSummary(e.target.value)} placeholder="Brief summary of this part..." rows={3} data-testid="input-new-part-summary" />
              </div>

              <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Image</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => newPartCoverRef.current?.click()} disabled={uploadingNewPartCover}>
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
                <Input value={newPartCoverImage} onChange={e => setNewPartCoverImage(e.target.value)} placeholder="/images/... or /uploads/covers/..." className="text-xs" data-testid="input-new-part-cover" />
              </div>

              <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                <Label className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => newPartAudioRef.current?.click()} disabled={uploadingNewPartAudio}>
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
                <Input value={newPartAudioUrl} onChange={e => setNewPartAudioUrl(e.target.value)} placeholder="/uploads/audio/... or external URL" className="text-xs" data-testid="input-new-part-audio" />
              </div>

              <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={() => newPartVideoRef.current?.click()} disabled={uploadingNewPartVideo}>
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
                <Input value={newPartVideoUrl} onChange={e => setNewPartVideoUrl(e.target.value)} placeholder="https://youtube.com/... or /uploads/videos/..." className="text-xs" data-testid="input-new-part-video" />
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

              {addModalSavedPages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">{addModalSavedPages.length} page{addModalSavedPages.length !== 1 ? "s" : ""} saved:</p>
                  {addModalSavedPages.map((pg, pi) => (
                    <div key={pg.id} className="flex items-center gap-1 text-xs bg-muted/50 rounded px-2 py-1.5">
                      <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-muted-foreground w-12 shrink-0">Page {pi + 1}</span>
                      <span className="truncate flex-1 text-muted-foreground">{pg.content.replace(/<[^>]*>/g, "").slice(0, 55)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Page {addModalSavedPages.length + 1} Content (HTML)</Label>
                <Textarea
                  value={addModalPageContent}
                  onChange={e => setAddModalPageContent(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder={`<p>Page ${addModalSavedPages.length + 1} content here...</p>`}
                  data-testid="input-add-modal-page-content"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => addModalPageMutation.mutate()} disabled={addModalPageMutation.isPending || !addModalPageContent.trim()} data-testid="button-save-modal-page">
                    {addModalPageMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                    Save Page {addModalSavedPages.length + 1}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {addPartStage === "details" ? (
              <>
                <Button variant="outline" onClick={resetAddPartModal}>Cancel</Button>
                <Button onClick={() => addPartMutation.mutate()} disabled={addPartMutation.isPending || !newPartTitle || uploadingNewPartAudio || uploadingNewPartVideo || uploadingNewPartCover} data-testid="button-save-new-part">
                  {addPartMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Save Part & Add Pages
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground mr-auto">{addModalSavedPages.length} page{addModalSavedPages.length !== 1 ? "s" : ""} saved</span>
                <Button variant="outline" onClick={resetAddPartModal} data-testid="button-done-add-part">Done</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
