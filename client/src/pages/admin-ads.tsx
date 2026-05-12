import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Plus, Trash2, Pencil, Image, Video, Code2,
  Upload, ExternalLink, Zap, AlertCircle,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ManualAd } from "@shared/schema";

const AD_SLOTS = [
  { id: "banner", label: "Banner", description: "Horizontal banner shown at top of pages and between sections" },
  { id: "display", label: "Display", description: "General display ad unit shown in listing sections" },
  { id: "in-article", label: "In-Article", description: "Shown inside story/article content" },
  { id: "in-feed", label: "In-Feed", description: "Shown between story listings and category page sections" },
  { id: "sidebar-small", label: "Sidebar A (300×250)", description: "First sidebar ad on article pages" },
  { id: "sidebar-small-2", label: "Sidebar B (300×250)", description: "Second sidebar ad on article pages" },
  { id: "sidebar-large", label: "Sidebar (300×600)", description: "Bottom sidebar ad on article pages" },
];

const AD_TYPE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  gif: Image,
  video: Video,
  html: Code2,
};

const AD_TYPE_LABELS: Record<string, string> = {
  image: "Image",
  gif: "GIF / Motion",
  video: "Video",
  html: "HTML / Script",
};

interface AdFormData {
  name: string;
  type: string;
  fileUrl: string;
  htmlCode: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  sortOrder: number;
}

const DEFAULT_FORM: AdFormData = {
  name: "",
  type: "image",
  fileUrl: "",
  htmlCode: "",
  linkUrl: "",
  altText: "",
  isActive: true,
  sortOrder: 0,
};

function AdCard({ ad, onEdit, onDelete, onToggle }: {
  ad: ManualAd;
  onEdit: (ad: ManualAd) => void;
  onDelete: (id: string) => void;
  onToggle: (ad: ManualAd) => void;
}) {
  const TypeIcon = AD_TYPE_ICONS[ad.type] || Image;

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 transition-opacity ${ad.isActive ? "" : "opacity-50"}`}
      data-testid={`card-manual-ad-${ad.id}`}
    >
      {(ad.type === "image" || ad.type === "gif") && ad.fileUrl && (
        <div className="rounded overflow-hidden bg-muted h-24 flex items-center justify-center">
          <img src={ad.fileUrl} alt={ad.altText || ad.name} className="max-h-full max-w-full object-contain" />
        </div>
      )}
      {ad.type === "video" && ad.fileUrl && (
        <div className="rounded overflow-hidden bg-muted h-24 flex items-center justify-center">
          <video src={ad.fileUrl} className="max-h-full max-w-full object-contain" muted />
        </div>
      )}
      {ad.type === "html" && (
        <div className="rounded bg-muted/50 h-12 flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed">
          <Code2 className="w-3.5 h-3.5" />
          HTML / Script
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate" data-testid={`text-ad-name-${ad.id}`}>{ad.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TypeIcon className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">{AD_TYPE_LABELS[ad.type] || ad.type}</span>
            {ad.linkUrl && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Switch
            checked={ad.isActive}
            onCheckedChange={() => onToggle(ad)}
            data-testid={`switch-ad-active-${ad.id}`}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(ad)} data-testid={`button-edit-ad-${ad.id}`}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(ad.id)} data-testid={`button-delete-ad-${ad.id}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdFormDialog({ open, onClose, editAd, slot }: {
  open: boolean;
  onClose: () => void;
  editAd?: ManualAd | null;
  slot: string;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<AdFormData>(editAd ? {
    name: editAd.name,
    type: editAd.type,
    fileUrl: editAd.fileUrl || "",
    htmlCode: editAd.htmlCode || "",
    linkUrl: editAd.linkUrl || "",
    altText: editAd.altText || "",
    isActive: editAd.isActive,
    sortOrder: editAd.sortOrder,
  } : DEFAULT_FORM);
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: AdFormData) => apiRequest("POST", "/api/admin/manual-ads", { ...data, slot }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-ads/slot"] });
      toast({ title: "Ad created" });
      onClose();
    },
    onError: () => toast({ title: "Failed to create ad", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: AdFormData) => apiRequest("PATCH", `/api/admin/manual-ads/${editAd!.id}`, { ...data, slot }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-ads/slot"] });
      toast({ title: "Ad updated" });
      onClose();
    },
    onError: () => toast({ title: "Failed to update ad", variant: "destructive" }),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/ad-file", { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setForm(f => ({ ...f, fileUrl: url }));
      const isVideo = file.type.startsWith("video/");
      const isGif = file.type === "image/gif";
      if (isVideo) setForm(f => ({ ...f, type: "video", fileUrl: url }));
      else if (isGif) setForm(f => ({ ...f, type: "gif", fileUrl: url }));
      else setForm(f => ({ ...f, type: "image", fileUrl: url }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast({ title: "Ad name is required", variant: "destructive" });
    if ((form.type === "image" || form.type === "gif" || form.type === "video") && !form.fileUrl.trim()) {
      return toast({ title: "Please upload a file or enter a URL", variant: "destructive" });
    }
    if (form.type === "html" && !form.htmlCode.trim()) {
      return toast({ title: "HTML/Script code is required", variant: "destructive" });
    }
    if (editAd) updateMutation.mutate(form);
    else createMutation.mutate(form);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const needsFile = form.type !== "html";

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editAd ? "Edit Ad" : "Add New Ad"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ad-name">Ad Name <span className="text-destructive">*</span></Label>
            <Input
              id="ad-name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Summer Banner"
              data-testid="input-ad-name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ad Type</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
              <SelectTrigger data-testid="select-ad-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image (JPG, PNG, WebP)</SelectItem>
                <SelectItem value="gif">GIF / Motion Ad</SelectItem>
                <SelectItem value="video">Video Ad (MP4, WebM)</SelectItem>
                <SelectItem value="html">HTML / Script Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsFile && (
            <div className="space-y-1.5">
              <Label>
                {form.type === "video" ? "Video File" : "Image File"}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={form.fileUrl}
                  onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                  placeholder="https://... or upload below"
                  className="flex-1 text-xs"
                  data-testid="input-ad-file-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  title="Upload file"
                  data-testid="button-upload-ad-file"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept={form.type === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
                onChange={handleFileUpload}
              />
              {form.fileUrl && (form.type === "image" || form.type === "gif") && (
                <img src={form.fileUrl} alt="preview" className="mt-1 rounded max-h-28 object-contain border" />
              )}
              {form.fileUrl && form.type === "video" && (
                <video src={form.fileUrl} className="mt-1 rounded max-h-28 w-full object-contain border" muted controls />
              )}
            </div>
          )}

          {form.type === "html" && (
            <div className="space-y-1.5">
              <Label>HTML / Script Code <span className="text-destructive">*</span></Label>
              <Textarea
                value={form.htmlCode}
                onChange={e => setForm(f => ({ ...f, htmlCode: e.target.value }))}
                placeholder="Paste ad script or HTML code here..."
                rows={6}
                className="font-mono text-xs resize-none"
                data-testid="textarea-ad-html-code"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Click-Through URL</Label>
            <Input
              value={form.linkUrl}
              onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
              placeholder="https://example.com (optional)"
              data-testid="input-ad-link-url"
            />
          </div>

          {needsFile && (
            <div className="space-y-1.5">
              <Label>Alt Text</Label>
              <Input
                value={form.altText}
                onChange={e => setForm(f => ({ ...f, altText: e.target.value }))}
                placeholder="Describe the ad for accessibility"
                data-testid="input-ad-alt-text"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">Show this ad on the website</p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              data-testid="switch-ad-form-active"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
              placeholder="0"
              className="w-24"
              data-testid="input-ad-sort-order"
            />
            <p className="text-xs text-muted-foreground">Lower numbers show first. The first active ad in this slot is displayed.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-manual-ad">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editAd ? "Save Changes" : "Add Ad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlotSection({ slotId, slotLabel, slotDescription, settings, onSaveSetting }: {
  slotId: string;
  slotLabel: string;
  slotDescription: string;
  settings: Record<string, string>;
  onSaveSetting: (key: string, value: string) => void;
}) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAd, setEditAd] = useState<ManualAd | null>(null);

  const modeKey = `adSlotMode_${slotId}`;
  const mode = settings[modeKey] || "auto";

  const { data: ads = [], isLoading } = useQuery<ManualAd[]>({
    queryKey: ["/api/admin/manual-ads", slotId],
    queryFn: () => fetch(`/api/admin/manual-ads?slot=${slotId}`, { credentials: "include" }).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/manual-ads/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-ads", slotId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-ads/slot"] });
      toast({ title: "Ad deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (ad: ManualAd) => apiRequest("PATCH", `/api/admin/manual-ads/${ad.id}`, { isActive: !ad.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-ads", slotId] });
      queryClient.invalidateQueries({ queryKey: ["/api/manual-ads/slot"] });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const handleOpenCreate = () => { setEditAd(null); setDialogOpen(true); };
  const handleOpenEdit = (ad: ManualAd) => { setEditAd(ad); setDialogOpen(true); };

  const activeAd = ads.find(a => a.isActive);

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-sm">{slotLabel}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{slotDescription}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={mode === "manual" ? "default" : "secondary"} className="text-xs">
            {mode === "manual" ? "Manual" : "Auto Ads"}
          </Badge>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              size="sm"
              variant={mode === "auto" ? "default" : "ghost"}
              className="h-7 px-2.5 rounded-none text-xs"
              onClick={() => onSaveSetting(modeKey, "auto")}
              data-testid={`button-slot-mode-auto-${slotId}`}
            >
              <Zap className="w-3 h-3 mr-1" />
              Auto
            </Button>
            <Button
              size="sm"
              variant={mode === "manual" ? "default" : "ghost"}
              className="h-7 px-2.5 rounded-none text-xs"
              onClick={() => onSaveSetting(modeKey, "manual")}
              data-testid={`button-slot-mode-manual-${slotId}`}
            >
              <Upload className="w-3 h-3 mr-1" />
              Manual
            </Button>
          </div>
        </div>
      </div>

      {mode === "manual" && (
        <>
          {activeAd && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-xs text-green-800 dark:text-green-300">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              Displaying: <span className="font-medium">{activeAd.name}</span>
            </div>
          )}
          {!activeAd && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              No active ad — slot will be empty. Add and enable an ad below.
            </div>
          )}

          {isLoading ? (
            <div className="text-xs text-muted-foreground py-2">Loading ads...</div>
          ) : ads.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ads.map(ad => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onEdit={handleOpenEdit}
                  onDelete={id => deleteMutation.mutate(id)}
                  onToggle={ad => toggleMutation.mutate(ad)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border rounded-lg border-dashed text-sm text-muted-foreground">
              No ads uploaded for this slot yet.
            </div>
          )}

          <Button size="sm" variant="outline" onClick={handleOpenCreate} data-testid={`button-add-ad-${slotId}`}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Ad
          </Button>
        </>
      )}

      {mode === "auto" && (
        <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2.5">
          This slot uses your configured ad platform (AdSense, Adsterra, or Custom). Switch to Manual to upload your own ads.
        </div>
      )}

      <AdFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editAd={editAd}
        slot={slotId}
      />
    </div>
  );
}

export default function AdminAdsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: settings = {}, isLoading: settingsLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const saveSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      await apiRequest("POST", "/api/admin/settings", { key, value });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/public"] });
    } catch {
      toast({ title: "Failed to save setting", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const manualSlots = AD_SLOTS.filter(s => (settings[`adSlotMode_${s.id}`] || "auto") === "manual").length;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ad Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your hybrid ad system. Each slot can independently use automatic ads (from your configured platform) or manual ads you upload directly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border bg-muted/30">
          <div className="text-center">
            <p className="text-2xl font-bold">{AD_SLOTS.length}</p>
            <p className="text-xs text-muted-foreground">Total Slots</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{manualSlots}</p>
            <p className="text-xs text-muted-foreground">Manual Mode</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{AD_SLOTS.length - manualSlots}</p>
            <p className="text-xs text-muted-foreground">Auto Mode</p>
          </div>
        </div>

        {settingsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="space-y-4">
            {AD_SLOTS.map(slot => (
              <SlotSection
                key={slot.id}
                slotId={slot.id}
                slotLabel={slot.label}
                slotDescription={slot.description}
                settings={settings}
                onSaveSetting={saveSetting}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
