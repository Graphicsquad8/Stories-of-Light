import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Zap, Upload, Link2, Image as ImageIcon, Film, Video, Code2,
  CheckCircle2, ChevronDown, ChevronUp, X,
} from "lucide-react";
import type { ManualAd } from "@shared/schema";

export type AdManagementContentType = "story" | "book" | "motivational" | "dua" | "category";

const SLOT_LABELS: Record<string, string> = {
  banner: "Top Banner",
  display: "Display",
  "in-article": "In-Article",
  "in-feed": "In-Feed",
  "sidebar-small": "Sidebar 300×250 (A)",
  "sidebar-small-2": "Sidebar 300×250 (B)",
  "sidebar-large": "Sidebar 300×600",
};

const CONTENT_SLOTS: Record<AdManagementContentType, string[]> = {
  story: ["sidebar-small", "sidebar-small-2", "sidebar-large"],
  book: ["sidebar-small", "sidebar-small-2", "sidebar-large"],
  motivational: ["sidebar-small", "sidebar-small-2", "sidebar-large"],
  dua: ["sidebar-small", "sidebar-small-2", "sidebar-large"],
  category: ["banner", "in-feed"],
};

const AD_SLOT_PATH: Record<AdManagementContentType, string> = {
  story: "stories",
  book: "books",
  motivational: "motivational-stories",
  dua: "duas",
  category: "categories",
};

const TYPE_ICONS: Record<string, JSX.Element> = {
  image: <ImageIcon className="w-3.5 h-3.5" />,
  gif: <Film className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  html: <Code2 className="w-3.5 h-3.5" />,
};

function parseAdSlots(raw: string | null | undefined): Record<string, any> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

interface SlotAdState {
  id?: string;
  type: string;
  fileUrl: string;
  htmlCode: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  expanded: boolean;
  saving: boolean;
  uploading: boolean;
}

function defaultSlotState(): SlotAdState {
  return { type: "image", fileUrl: "", htmlCode: "", linkUrl: "", altText: "", isActive: true, expanded: false, saving: false, uploading: false };
}

interface AdManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: AdManagementContentType;
  contentId: string;
  contentName: string;
  adSlotsRaw: string | null | undefined;
  invalidateKey: string[];
}

export function AdManagementDialog({
  open, onOpenChange, contentType, contentId, contentName, adSlotsRaw, invalidateKey,
}: AdManagementDialogProps) {
  const { toast } = useToast();
  const slots = CONTENT_SLOTS[contentType];
  const parsed = parseAdSlots(adSlotsRaw);
  const [mode, setMode] = useState<"auto" | "manual">(parsed["_mode"] === "manual" ? "manual" : "auto");
  const [savingMode, setSavingMode] = useState(false);
  const [slotStates, setSlotStates] = useState<Record<string, SlotAdState>>(() =>
    Object.fromEntries(slots.map(s => [s, defaultSlotState()]))
  );
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: existingAds, isLoading: adsLoading } = useQuery<ManualAd[]>({
    queryKey: ["/api/admin/manual-ads/content", contentType, contentId],
    queryFn: () => fetch(`/api/admin/manual-ads/content/${contentType}/${contentId}`, { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  useEffect(() => {
    if (!existingAds) return;
    setSlotStates(prev => {
      const next = { ...prev };
      for (const slot of slots) {
        const ad = existingAds.find(a => a.slot === slot);
        if (ad) {
          next[slot] = {
            id: ad.id,
            type: ad.type || "image",
            fileUrl: ad.fileUrl || "",
            htmlCode: ad.htmlCode || "",
            linkUrl: ad.linkUrl || "",
            altText: ad.altText || "",
            isActive: ad.isActive !== false,
            expanded: next[slot]?.expanded || false,
            saving: false,
            uploading: false,
          };
        }
      }
      return next;
    });
  }, [existingAds]);

  const modeApiPath = `/api/admin/${AD_SLOT_PATH[contentType]}/${contentId}/ad-slots`;

  async function saveMode(newMode: "auto" | "manual") {
    setSavingMode(true);
    try {
      const currentSlots = parseAdSlots(adSlotsRaw);
      const updated = { ...currentSlots, _mode: newMode };
      await apiRequest("PATCH", modeApiPath, { adSlots: updated });
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      setMode(newMode);
      toast({ title: `Switched to ${newMode === "auto" ? "Auto" : "Manual"} Ad mode` });
    } catch {
      toast({ title: "Failed to switch mode", variant: "destructive" });
    } finally {
      setSavingMode(false);
    }
  }

  function updateSlot(slot: string, patch: Partial<SlotAdState>) {
    setSlotStates(prev => ({ ...prev, [slot]: { ...prev[slot], ...patch } }));
  }

  async function uploadFile(slot: string, file: File) {
    updateSlot(slot, { uploading: true });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload/ad-file", { method: "POST", body: form, credentials: "include" });
      const data = await res.json();
      updateSlot(slot, { fileUrl: data.url });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      updateSlot(slot, { uploading: false });
    }
  }

  async function saveSlotAd(slot: string) {
    const s = slotStates[slot];
    updateSlot(slot, { saving: true });
    try {
      const payload: any = {
        name: `${contentName} – ${SLOT_LABELS[slot] || slot}`,
        slot,
        type: s.type,
        fileUrl: s.fileUrl || null,
        htmlCode: s.htmlCode || null,
        linkUrl: s.linkUrl || null,
        altText: s.altText || null,
        isActive: s.isActive,
        sortOrder: 0,
        contentId,
        contentType,
      };
      let ad: ManualAd;
      if (s.id) {
        const res = await apiRequest("PATCH", `/api/admin/manual-ads/${s.id}`, payload);
        ad = await res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/manual-ads", payload);
        ad = await res.json();
      }
      updateSlot(slot, { id: ad.id, saving: false, expanded: false });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-ads/content", contentType, contentId] });
      toast({ title: `Ad saved for ${SLOT_LABELS[slot] || slot}` });
    } catch {
      toast({ title: "Failed to save ad", variant: "destructive" });
      updateSlot(slot, { saving: false });
    }
  }

  async function removeSlotAd(slot: string) {
    const s = slotStates[slot];
    if (!s.id) return;
    try {
      await apiRequest("DELETE", `/api/admin/manual-ads/${s.id}`);
      updateSlot(slot, { ...defaultSlotState() });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/manual-ads/content", contentType, contentId] });
      toast({ title: "Ad removed" });
    } catch {
      toast({ title: "Failed to remove", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Ad Management
            <span className="text-xs font-normal text-muted-foreground truncate max-w-[180px]">{contentName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { if (mode !== "auto") saveMode("auto"); }}
              disabled={savingMode}
              data-testid="button-mode-auto"
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                mode === "auto"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {savingMode && mode !== "auto" && <Loader2 className="absolute top-2 right-2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              <Zap className={`w-8 h-8 ${mode === "auto" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className={`font-semibold text-sm ${mode === "auto" ? "text-primary" : ""}`}>Auto Ad</p>
                <p className="text-xs text-muted-foreground mt-0.5">Platform ads (AdSense, Adsterra, Custom)</p>
              </div>
              {mode === "auto" && (
                <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
              )}
            </button>

            <button
              onClick={() => { if (mode !== "manual") saveMode("manual"); }}
              disabled={savingMode}
              data-testid="button-mode-manual"
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                mode === "manual"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {savingMode && mode !== "manual" && <Loader2 className="absolute top-2 right-2 w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              <Upload className={`w-8 h-8 ${mode === "manual" ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-center">
                <p className={`font-semibold text-sm ${mode === "manual" ? "text-primary" : ""}`}>Manual Ad</p>
                <p className="text-xs text-muted-foreground mt-0.5">Upload your own custom ads per slot</p>
              </div>
              {mode === "manual" && (
                <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />
              )}
            </button>
          </div>

          {mode === "manual" && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Ad Slots</p>
                {adsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading current ads...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots.map(slot => {
                      const s = slotStates[slot];
                      const hasAd = !!s.id;
                      return (
                        <div key={slot} className="border rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
                            onClick={() => updateSlot(slot, { expanded: !s.expanded })}
                          >
                            <div className="flex items-center gap-2">
                              {hasAd ? (
                                <Badge variant="default" className="text-xs h-5 gap-1">
                                  {TYPE_ICONS[s.type]}
                                  {s.type.toUpperCase()}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs h-5">Empty</Badge>
                              )}
                              <span className="text-sm font-medium">{SLOT_LABELS[slot] || slot}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasAd && s.isActive && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                              )}
                              {s.expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </div>
                          </div>

                          {s.expanded && (
                            <div className="px-3 pb-3 space-y-3 border-t bg-muted/10">
                              <div className="pt-3 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Ad Type</Label>
                                    <Select value={s.type} onValueChange={(v) => updateSlot(slot, { type: v })}>
                                      <SelectTrigger className="h-8 text-xs" data-testid={`select-adtype-${slot}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="image">Image (JPG/PNG/WebP)</SelectItem>
                                        <SelectItem value="gif">GIF / Motion</SelectItem>
                                        <SelectItem value="video">Video (MP4/WebM)</SelectItem>
                                        <SelectItem value="html">HTML / Script</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex items-end gap-2">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={s.isActive}
                                        onCheckedChange={(checked) => updateSlot(slot, { isActive: checked })}
                                        data-testid={`switch-adactive-${slot}`}
                                      />
                                      <Label className="text-xs">{s.isActive ? "Active" : "Inactive"}</Label>
                                    </div>
                                  </div>
                                </div>

                                {s.type === "html" ? (
                                  <div className="space-y-1">
                                    <Label className="text-xs">HTML / Script Code</Label>
                                    <Textarea
                                      value={s.htmlCode}
                                      onChange={(e) => updateSlot(slot, { htmlCode: e.target.value })}
                                      placeholder="Paste your ad embed code here..."
                                      rows={4}
                                      className="text-xs font-mono"
                                      data-testid={`textarea-htmlcode-${slot}`}
                                    />
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Upload File</Label>
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-8"
                                          onClick={() => fileRefs.current[slot]?.click()}
                                          disabled={s.uploading}
                                          data-testid={`button-upload-${slot}`}
                                        >
                                          {s.uploading ? (
                                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                          ) : (
                                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                                          )}
                                          {s.uploading ? "Uploading..." : "Choose File"}
                                        </Button>
                                        <input
                                          ref={(el) => { fileRefs.current[slot] = el; }}
                                          type="file"
                                          accept={s.type === "video" ? "video/*" : "image/*"}
                                          className="hidden"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) uploadFile(slot, f);
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs flex items-center gap-1">
                                        <Link2 className="w-3 h-3" />
                                        Or enter URL
                                      </Label>
                                      <Input
                                        value={s.fileUrl}
                                        onChange={(e) => updateSlot(slot, { fileUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="h-8 text-xs"
                                        data-testid={`input-fileurl-${slot}`}
                                      />
                                    </div>
                                    {s.fileUrl && (
                                      <div className="mt-1 rounded overflow-hidden border max-h-24 flex items-center justify-center bg-muted/20">
                                        {s.type === "video" ? (
                                          <video src={s.fileUrl} className="max-h-24 max-w-full object-contain" muted />
                                        ) : (
                                          <img src={s.fileUrl} alt="Preview" className="max-h-24 max-w-full object-contain" />
                                        )}
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      <Label className="text-xs">Alt Text</Label>
                                      <Input
                                        value={s.altText}
                                        onChange={(e) => updateSlot(slot, { altText: e.target.value })}
                                        placeholder="Image description..."
                                        className="h-8 text-xs"
                                        data-testid={`input-alttext-${slot}`}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <Label className="text-xs">Click-through URL (optional)</Label>
                                  <Input
                                    value={s.linkUrl}
                                    onChange={(e) => updateSlot(slot, { linkUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="h-8 text-xs"
                                    data-testid={`input-linkurl-${slot}`}
                                  />
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs flex-1"
                                    onClick={() => saveSlotAd(slot)}
                                    disabled={s.saving || s.uploading}
                                    data-testid={`button-save-slot-${slot}`}
                                  >
                                    {s.saving ? (
                                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    {s.saving ? "Saving..." : "Save Ad"}
                                  </Button>
                                  {hasAd && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 text-xs text-destructive hover:text-destructive"
                                      onClick={() => removeSlotAd(slot)}
                                      data-testid={`button-remove-slot-${slot}`}
                                    >
                                      <X className="w-3.5 h-3.5 mr-1" />
                                      Remove
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {mode === "auto" && (
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground text-center">
                This content uses your globally configured ad platform.<br />
                <span className="text-xs">Switch to Manual to upload custom ads for each slot.</span>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
