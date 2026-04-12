import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export type AdContentType = "stories" | "books" | "duas" | "motivational-stories";

const SLOT_LABELS: Record<string, string> = {
  banner: "Top Banner",
  display: "Display",
  "in-article": "In-Article",
  "in-feed": "In-Feed",
  "sidebar-small": "Sidebar 300×250 (A)",
  "sidebar-small-2": "Sidebar 300×250 (B)",
  "sidebar-large": "Sidebar 300×600",
};

const CONTENT_SLOTS: Record<AdContentType, string[]> = {
  stories: ["banner", "in-article", "sidebar-small", "sidebar-small-2", "sidebar-large"],
  books: ["banner", "in-feed"],
  duas: ["banner"],
  "motivational-stories": ["banner", "in-feed"],
};

function parseAdSlots(raw: string | null | undefined): Record<string, boolean> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function getApiPath(contentType: AdContentType, contentId: string): string {
  if (contentType === "motivational-stories") {
    return `/api/admin/motivational-stories/${contentId}/ad-slots`;
  }
  return `/api/admin/${contentType}/${contentId}/ad-slots`;
}

interface AdControlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: AdContentType;
  contentId: string;
  adSlotsRaw: string | null | undefined;
  invalidateKey: string[];
}

export function AdControlDialog({
  open, onOpenChange, contentType, contentId, adSlotsRaw, invalidateKey,
}: AdControlDialogProps) {
  const { toast } = useToast();
  const slots = CONTENT_SLOTS[contentType];
  const [localSlots, setLocalSlots] = useState<Record<string, boolean>>(() => parseAdSlots(adSlotsRaw));

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", getApiPath(contentType, contentId), { adSlots: localSlots });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      toast({ title: "Ad slots updated" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update ad slots", variant: "destructive" });
    },
  });

  function toggle(slot: string, enabled: boolean) {
    setLocalSlots(prev => ({ ...prev, [slot]: enabled }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ad Slot Control</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">Enable or disable individual ad slots for this item.</p>
          {slots.map(slot => {
            const enabled = localSlots[slot] !== false;
            return (
              <div key={slot} className="flex items-center justify-between">
                <span className="text-sm">{SLOT_LABELS[slot] || slot}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${enabled ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {enabled ? "On" : "Off"}
                  </span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) => toggle(slot, checked)}
                    data-testid={`switch-adslot-${slot}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} data-testid="button-save-adslots">
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
