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
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Trash2, Save, GripVertical, Edit2, Copy,
  FileText, ImageIcon, Music, Video, Upload, X, Loader2, ChevronDown,
} from "lucide-react";
import type { StoryWithCategory, StoryPartWithPages } from "@shared/schema";

type StoryPage = { id: string; content: string; orderIndex?: number };

function PageItem({
  page,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
}: {
  page: StoryPage;
  index: number;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(page.content);
  const [saving, setSaving] = useState(false);

  const preview = (page.content || "").replace(/<[^>]*>/g, "").slice(0, 80);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(page.id, editContent);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="border rounded-lg bg-white overflow-hidden" data-testid={`page-item-${page.id}`}>
      <button
        onClick={() => { if (!editing) setOpen(!open); }}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium text-muted-foreground w-16 shrink-0">Page {index + 1}</span>
        <span className="text-sm truncate flex-1 text-muted-foreground">{preview || <span className="italic opacity-50">Empty page</span>}</span>
        <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(true); setOpen(true); setEditContent(page.content); }} title="Edit" data-testid={`button-edit-page-${page.id}`}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDuplicate(page.id)} title="Duplicate" data-testid={`button-dup-page-${page.id}`}>
            <Copy className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm(`Delete Page ${index + 1}?`)) onDelete(page.id); }} title="Delete" data-testid={`button-del-page-${page.id}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t px-4 py-4 bg-white">
          {editing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={12}
                className="font-mono text-sm"
                data-testid={`input-edit-page-content-${page.id}`}
              />
              <div className="flex items-center gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditContent(page.content); }}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !editContent.trim()} data-testid={`button-save-page-${page.id}`}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save Page
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: page.content || "<p class='text-muted-foreground italic'>No content.</p>" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AddPageForm({
  partId,
  pageCount,
  onAdded,
}: {
  partId: string;
  pageCount: number;
  onAdded: () => void;
}) {
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/stories/parts/${partId}/pages`, {
      content, orderIndex: pageCount,
    }),
    onSuccess: () => {
      onAdded();
      setContent("");
      setOpen(false);
      toast({ title: `Page ${pageCount + 1} added` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="w-full mt-2" data-testid={`button-show-add-page-${partId}`}>
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Page {pageCount + 1}
      </Button>
    );
  }

  return (
    <div className="border rounded-lg bg-white p-4 space-y-3 mt-2">
      <Label className="text-sm font-semibold">Page {pageCount + 1} Content (HTML)</Label>
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={10}
        className="font-mono text-sm"
        placeholder={`<p>Page ${pageCount + 1} content here...</p>`}
        data-testid={`input-add-page-content-${partId}`}
        autoFocus
      />
      <div className="flex items-center gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={() => { setOpen(false); setContent(""); }}>Cancel</Button>
        <Button size="sm" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !content.trim()} data-testid={`button-save-add-page-${partId}`}>
          {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
          Save Page
        </Button>
      </div>
    </div>
  );
}

export default function AdminStoryManagePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [editingPart, setEditingPart] = useState<StoryPartWithPages | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editCoverImage, setEditCoverImage] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editAudioUrl, setEditAudioUrl] = useState("");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

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
    queryFn: () => fetch(`/api/stories/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: parts, isLoading: partsLoading } = useQuery<StoryPartWithPages[]>({
    queryKey: ["/api/admin/stories", id, "parts"],
    queryFn: () => fetch(`/api/admin/stories/${id}/parts`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const isLoading = storyLoading || partsLoading;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/stories", id, "parts"] });

  const openEditPart = (part: StoryPartWithPages) => {
    setEditingPart(part);
    setEditTitle(part.title);
    setEditSummary(part.summary || "");
    setEditCoverImage(part.coverImage || "");
    setEditVideoUrl(part.videoUrl || "");
    setEditAudioUrl(part.audioUrl || "");
  };

  const updatePartMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/stories/parts/${editingPart!.id}`, {
      title: editTitle, summary: editSummary || null,
      coverImage: editCoverImage || null, videoUrl: editVideoUrl || null, audioUrl: editAudioUrl || null,
    }),
    onSuccess: () => { invalidate(); toast({ title: "Part updated" }); setEditingPart(null); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePartMutation = useMutation({
    mutationFn: (partId: string) => apiRequest("DELETE", `/api/admin/stories/parts/${partId}`),
    onSuccess: () => { invalidate(); toast({ title: "Part deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicatePartMutation = useMutation({
    mutationFn: (partId: string) => apiRequest("POST", `/api/admin/stories/parts/${partId}/duplicate`),
    onSuccess: () => { invalidate(); toast({ title: "Part duplicated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ pageId, content }: { pageId: string; content: string }) =>
      apiRequest("PATCH", `/api/admin/stories/pages/${pageId}`, { content }),
    onSuccess: () => { invalidate(); toast({ title: "Page updated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePageMutation = useMutation({
    mutationFn: (pageId: string) => apiRequest("DELETE", `/api/admin/stories/pages/${pageId}`),
    onSuccess: () => { invalidate(); toast({ title: "Page deleted" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicatePageMutation = useMutation({
    mutationFn: (pageId: string) => apiRequest("POST", `/api/admin/stories/pages/${pageId}/duplicate`),
    onSuccess: () => { invalidate(); toast({ title: "Page duplicated" }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

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

  const makeUploadHandler = (
    field: "audio" | "video" | "cover",
    setter: (url: string) => void,
    setBusy: (v: boolean) => void,
    ref: React.RefObject<HTMLInputElement>
  ) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append(field, file);
      const res = await fetch(`/api/upload/${field}`, { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      setter((await res.json()).url);
      toast({ title: `${field.charAt(0).toUpperCase() + field.slice(1)} uploaded` });
    } catch (err: any) { toast({ title: "Upload failed", description: err.message, variant: "destructive" }); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };

  const resetAddPart = () => {
    setShowAddPart(false); setAddPartStage("details"); setCreatedPartId(null);
    setNewPartTitle(""); setNewPartSummary(""); setNewPartCoverImage(""); setNewPartVideoUrl(""); setNewPartAudioUrl("");
    setAddModalPageContent(""); setAddModalSavedPages([]);
  };

  const status = (story as any)?.status;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-start gap-4">
          <Link href="/image/stories">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            {isLoading ? <Skeleton className="h-7 w-56" /> : (
              <>
                <h1 className="text-2xl font-semibold" data-testid="text-story-title">{story?.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add and manage article parts and pages.
                  {status === "published" ? (
                    <Badge variant="secondary" className="ml-2 text-xs">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">Draft</Badge>
                  )}
                </p>
              </>
            )}
          </div>
          <Button onClick={() => setShowAddPart(true)} data-testid="button-add-part">
            <Plus className="w-4 h-4 mr-2" /> Add Part
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        )}

        {!isLoading && (!parts || parts.length === 0) && (
          <div className="text-center py-16 border rounded-lg text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium mb-1">No parts yet.</p>
            <p className="text-sm mb-4">Click "Add Part" to add your first article part.</p>
            <Button onClick={() => setShowAddPart(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Add First Part
            </Button>
          </div>
        )}

        {!isLoading && parts && parts.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {parts.map((part, idx) => (
              <AccordionItem key={part.id} value={part.id} className="border rounded-lg px-4 bg-white" data-testid={`accordion-part-${part.id}`}>
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left flex-1 min-w-0 mr-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{idx + 1}. {part.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">{part.pages?.length || 0} pages</Badge>
                        {part.audioUrl && <Badge variant="outline" className="text-xs">Audio</Badge>}
                        {part.videoUrl && <Badge variant="outline" className="text-xs">Video</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditPart(part)} title="Edit Part" data-testid={`button-edit-part-${part.id}`}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicatePartMutation.mutate(part.id)} disabled={duplicatePartMutation.isPending} title="Duplicate" data-testid={`button-dup-part-${part.id}`}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this part and all its pages?")) deletePartMutation.mutate(part.id); }} disabled={deletePartMutation.isPending} title="Delete" data-testid={`button-del-part-${part.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-2">
                    {part.summary && (
                      <p className="text-sm text-muted-foreground mb-3">{part.summary}</p>
                    )}
                    {part.pages && part.pages.length > 0 ? (
                      part.pages.map((page, pi) => (
                        <PageItem
                          key={page.id}
                          page={page}
                          index={pi}
                          onUpdate={(pageId, content) => updatePageMutation.mutateAsync({ pageId, content })}
                          onDelete={(pageId) => deletePageMutation.mutate(pageId)}
                          onDuplicate={(pageId) => duplicatePageMutation.mutate(pageId)}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic py-2">No pages yet. Use the button below to add content pages.</p>
                    )}
                    <AddPageForm
                      partId={part.id}
                      pageCount={part.pages?.length || 0}
                      onAdded={invalidate}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Hidden file inputs for upload in edit dialog */}
      <input ref={audioFileRef} type="file" accept="audio/*" onChange={makeUploadHandler("audio", setEditAudioUrl, setUploadingAudio, audioFileRef)} className="hidden" />
      <input ref={videoFileRef} type="file" accept="video/*" onChange={makeUploadHandler("video", setEditVideoUrl, setUploadingVideo, videoFileRef)} className="hidden" />
      <input ref={coverFileRef} type="file" accept="image/*" onChange={makeUploadHandler("cover", setEditCoverImage, setUploadingCover, coverFileRef)} className="hidden" />
      <input ref={newPartAudioRef} type="file" accept="audio/*" onChange={makeUploadHandler("audio", setNewPartAudioUrl, setUploadingNewPartAudio, newPartAudioRef)} className="hidden" />
      <input ref={newPartVideoRef} type="file" accept="video/*" onChange={makeUploadHandler("video", setNewPartVideoUrl, setUploadingNewPartVideo, newPartVideoRef)} className="hidden" />
      <input ref={newPartCoverRef} type="file" accept="image/*" onChange={makeUploadHandler("cover", setNewPartCoverImage, setUploadingNewPartCover, newPartCoverRef)} className="hidden" />

      {/* Edit Part Dialog */}
      <Dialog open={!!editingPart} onOpenChange={(open) => { if (!open) setEditingPart(null); }}>
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

            <div className="space-y-2 rounded-md border p-3">
              <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Image</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => coverFileRef.current?.click()} disabled={uploadingCover}>
                  {uploadingCover ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingCover ? "Uploading…" : "Upload Image"}
                </Button>
              </div>
              {editCoverImage && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={editCoverImage} alt="Cover" className="h-12 rounded object-cover border" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditCoverImage("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={editCoverImage} onChange={e => setEditCoverImage(e.target.value)} placeholder="/images/... or /uploads/covers/..." className="text-xs" data-testid="input-edit-part-cover" />
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => audioFileRef.current?.click()} disabled={uploadingAudio}>
                  {uploadingAudio ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingAudio ? "Uploading…" : "Upload Audio"}
                </Button>
              </div>
              {editAudioUrl && (
                <div className="flex items-center gap-2 mt-1">
                  <audio src={editAudioUrl} controls className="h-8 flex-1 max-w-xs" />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditAudioUrl("")}><X className="w-3 h-3" /></Button>
                </div>
              )}
              <Input value={editAudioUrl} onChange={e => setEditAudioUrl(e.target.value)} placeholder="/uploads/audio/..." className="text-xs" data-testid="input-edit-part-audio" />
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => videoFileRef.current?.click()} disabled={uploadingVideo}>
                  {uploadingVideo ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingVideo ? "Uploading…" : "Upload Video"}
                </Button>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPart(null)}>Cancel</Button>
            <Button onClick={() => updatePartMutation.mutate()} disabled={updatePartMutation.isPending || !editTitle || uploadingAudio || uploadingVideo || uploadingCover} data-testid="button-save-edit-part">
              {updatePartMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Part
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Part Dialog */}
      <Dialog open={showAddPart} onOpenChange={(open) => { if (!open) resetAddPart(); }}>
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
                <Textarea value={newPartSummary} onChange={e => setNewPartSummary(e.target.value)} rows={3} data-testid="input-new-part-summary" />
              </div>
              <div className="space-y-2 rounded-md border p-3">
                <Label className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Cover Image</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => newPartCoverRef.current?.click()} disabled={uploadingNewPartCover}>
                    {uploadingNewPartCover ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                    {uploadingNewPartCover ? "Uploading…" : "Upload"}
                  </Button>
                </div>
                {newPartCoverImage && (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={newPartCoverImage} className="h-12 rounded object-cover border" alt="Cover" />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewPartCoverImage("")}><X className="w-3 h-3" /></Button>
                  </div>
                )}
                <Input value={newPartCoverImage} onChange={e => setNewPartCoverImage(e.target.value)} placeholder="/uploads/covers/..." className="text-xs" data-testid="input-new-part-cover" />
              </div>
              <div className="space-y-2 rounded-md border p-3">
                <Label className="flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Audio</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => newPartAudioRef.current?.click()} disabled={uploadingNewPartAudio}>
                    {uploadingNewPartAudio ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                    {uploadingNewPartAudio ? "Uploading…" : "Upload"}
                  </Button>
                </div>
                {newPartAudioUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    <audio src={newPartAudioUrl} controls className="h-8 flex-1 max-w-xs" />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewPartAudioUrl("")}><X className="w-3 h-3" /></Button>
                  </div>
                )}
                <Input value={newPartAudioUrl} onChange={e => setNewPartAudioUrl(e.target.value)} placeholder="/uploads/audio/..." className="text-xs" data-testid="input-new-part-audio" />
              </div>
              <div className="space-y-2 rounded-md border p-3">
                <Label className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5" /> Video</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => newPartVideoRef.current?.click()} disabled={uploadingNewPartVideo}>
                    {uploadingNewPartVideo ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                    {uploadingNewPartVideo ? "Uploading…" : "Upload"}
                  </Button>
                </div>
                {newPartVideoUrl && (
                  <div className="flex items-center gap-2 mt-1">
                    {newPartVideoUrl.includes("youtube") ? (
                      <span className="text-xs truncate flex-1">{newPartVideoUrl}</span>
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
                <span className="text-sm font-medium">Part saved! Add content page by page.</span>
              </div>

              {addModalSavedPages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">{addModalSavedPages.length} page{addModalSavedPages.length !== 1 ? "s" : ""} saved:</p>
                  {addModalSavedPages.map((pg, pi) => (
                    <div key={pg.id} className="flex items-center gap-2 text-xs border rounded-md px-3 py-2 bg-white">
                      <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-muted-foreground w-14 shrink-0">Page {pi + 1}</span>
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
                <Button variant="outline" onClick={resetAddPart}>Cancel</Button>
                <Button onClick={() => addPartMutation.mutate()} disabled={addPartMutation.isPending || !newPartTitle || uploadingNewPartAudio || uploadingNewPartVideo || uploadingNewPartCover} data-testid="button-save-new-part">
                  {addPartMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Save Part & Add Pages
                </Button>
              </>
            ) : (
              <>
                <span className="text-xs text-muted-foreground mr-auto">{addModalSavedPages.length} page{addModalSavedPages.length !== 1 ? "s" : ""} saved</span>
                <Button variant="outline" onClick={resetAddPart} data-testid="button-done-add-part">Done</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
