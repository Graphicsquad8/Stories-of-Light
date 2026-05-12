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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Pencil } from "lucide-react";
import type { DuaWithParts, DuaPart } from "@shared/schema";

export default function AdminDuaEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: dua, isLoading } = useQuery<DuaWithParts>({
    queryKey: ["/api/admin/duas", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/duas/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  const [partDialog, setPartDialog] = useState(false);
  const [editingPart, setEditingPart] = useState<DuaPart | null>(null);
  const [partTitle, setPartTitle] = useState("");
  const [partArabic, setPartArabic] = useState("");
  const [partTranslit, setPartTranslit] = useState("");
  const [partTranslation, setPartTranslation] = useState("");
  const [partExplanation, setPartExplanation] = useState("");

  const openCreatePart = () => {
    setEditingPart(null);
    setPartTitle(""); setPartArabic(""); setPartTranslit(""); setPartTranslation(""); setPartExplanation("");
    setPartDialog(true);
  };

  const openEditPart = (part: DuaPart) => {
    setEditingPart(part);
    setPartTitle(part.title);
    setPartArabic(part.arabicText ?? "");
    setPartTranslit(part.transliteration ?? "");
    setPartTranslation(part.translation ?? "");
    setPartExplanation(part.explanation ?? "");
    setPartDialog(true);
  };

  const createPart = useMutation({
    mutationFn: (data: { title: string; arabicText: string; transliteration: string; translation: string; explanation: string }) =>
      apiRequest("POST", `/api/admin/duas/${id}/parts`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duas", id] });
      toast({ title: "Added", description: "Dua added to collection." });
    },
  });

  const updatePart = useMutation({
    mutationFn: ({ partId, data }: { partId: string; data: Partial<DuaPart> }) =>
      apiRequest("PATCH", `/api/admin/dua-parts/${partId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duas", id] });
      toast({ title: "Saved", description: "Dua updated." });
    },
  });

  const deletePart = useMutation({
    mutationFn: (partId: string) => apiRequest("DELETE", `/api/admin/dua-parts/${partId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/duas", id] });
      toast({ title: "Deleted" });
    },
  });

  const handleSavePart = async () => {
    if (!partTitle) {
      toast({ title: "Required", description: "Dua title is required.", variant: "destructive" });
      return;
    }
    const payload = { title: partTitle, arabicText: partArabic, transliteration: partTranslit, translation: partTranslation, explanation: partExplanation };
    if (editingPart) {
      await updatePart.mutateAsync({ partId: editingPart.id, data: payload });
    } else {
      await createPart.mutateAsync(payload);
    }
    setPartDialog(false);
  };

  const handleDeletePart = async (partId: string, partTitle: string) => {
    if (!confirm(`Delete "${partTitle}" permanently?`)) return;
    await deletePart.mutateAsync(partId);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href="/image/duas">
            <Button variant="ghost" size="icon" data-testid="button-back-duas">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            {isLoading ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              <>
                <h1 className="text-2xl font-semibold">{dua?.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add and manage individual duas within this collection.
                  {dua?.published ? (
                    <Badge variant="secondary" className="ml-2 text-xs">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">Draft</Badge>
                  )}
                </p>
              </>
            )}
          </div>
          <Button onClick={openCreatePart} data-testid="button-add-dua-part">
            <Plus className="w-4 h-4 mr-2" />Add Dua
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {!isLoading && (!dua?.parts || dua.parts.length === 0) && (
          <div className="text-center py-16 border rounded-lg text-muted-foreground">
            <p className="font-medium mb-1">No duas in this collection yet.</p>
            <p className="text-sm mb-4">Click "Add Dua" to add your first supplication.</p>
            <Button onClick={openCreatePart} variant="outline">
              <Plus className="w-4 h-4 mr-2" />Add First Dua
            </Button>
          </div>
        )}

        {!isLoading && dua?.parts && dua.parts.length > 0 && (
          <Accordion type="multiple" className="space-y-2">
            {dua.parts.map((part, idx) => (
              <AccordionItem key={part.id} value={part.id} className="border rounded-lg px-4" data-testid={`accordion-part-${part.id}`}>
                <AccordionTrigger className="py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">{idx + 1}. {part.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        {part.arabicText && <Badge variant="secondary" className="text-xs">Arabic</Badge>}
                        {part.transliteration && <Badge variant="secondary" className="text-xs">Transliteration</Badge>}
                        {part.translation && <Badge variant="secondary" className="text-xs">Translation</Badge>}
                        {part.explanation && <Badge variant="secondary" className="text-xs">Explanation</Badge>}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4">
                    {part.arabicText && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Arabic Text</p>
                        <p className="text-xl leading-loose text-right border rounded-md p-3 bg-muted/30" dir="rtl" lang="ar"
                          style={{ fontFamily: "'Amiri', serif" }}>
                          {part.arabicText}
                        </p>
                      </div>
                    )}
                    {part.transliteration && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Transliteration</p>
                        <p className="text-sm italic border rounded-md p-3 bg-muted/30 font-medium tracking-wide">{part.transliteration}</p>
                      </div>
                    )}
                    {part.translation && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">English Translation</p>
                        <p className="text-sm text-muted-foreground italic border rounded-md p-3 bg-muted/30">{part.translation}</p>
                      </div>
                    )}
                    {part.explanation && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Explanation & Virtues</p>
                        <p className="text-sm border rounded-md p-3 bg-muted/30 whitespace-pre-wrap">{part.explanation}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" onClick={() => openEditPart(part)} data-testid={`button-edit-part-${part.id}`}>
                        <Pencil className="w-3.5 h-3.5 mr-1" />Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeletePart(part.id, part.title)} data-testid={`button-delete-part-${part.id}`}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Add/Edit Dua Dialog */}
      <Dialog open={partDialog} onOpenChange={setPartDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPart ? "Edit Dua" : "Add Dua"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label>Dua Name / Title</Label>
              <Input
                value={partTitle}
                onChange={e => setPartTitle(e.target.value)}
                placeholder="e.g. Bismika Allahumma – Before Sleeping"
                className="mt-1"
                data-testid="input-part-title"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Arabic Text
                <span className="text-xs text-muted-foreground font-normal">(Page 1 — Box 1)</span>
              </Label>
              <Textarea
                value={partArabic}
                onChange={e => setPartArabic(e.target.value)}
                rows={4}
                placeholder="بِسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا"
                className="mt-1 text-right text-xl leading-loose"
                dir="rtl"
                lang="ar"
                style={{ fontFamily: "'Amiri', serif" }}
                data-testid="input-part-arabic"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Transliteration
                <span className="text-xs text-muted-foreground font-normal">(Page 1 — Box 2)</span>
              </Label>
              <Textarea
                value={partTranslit}
                onChange={e => setPartTranslit(e.target.value)}
                rows={3}
                placeholder="Bismika Allahumma amutu wa ahya..."
                className="mt-1"
                data-testid="input-part-transliteration"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                English Translation
                <span className="text-xs text-muted-foreground font-normal">(Page 1 — Box 3)</span>
              </Label>
              <Textarea
                value={partTranslation}
                onChange={e => setPartTranslation(e.target.value)}
                rows={3}
                placeholder="In Your name, O Allah, I die and I live..."
                className="mt-1"
                data-testid="input-part-translation"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                Explanation & Virtues
                <span className="text-xs text-muted-foreground font-normal">(Page 2)</span>
              </Label>
              <Textarea
                value={partExplanation}
                onChange={e => setPartExplanation(e.target.value)}
                rows={6}
                placeholder="This dua was narrated by... Its virtues include..."
                className="mt-1"
                data-testid="input-part-explanation"
              />
              <p className="text-xs text-muted-foreground mt-1">Each line break creates a new paragraph on the public page.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPartDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePart} disabled={createPart.isPending || updatePart.isPending} data-testid="button-save-part">
              <Save className="w-4 h-4 mr-2" />{editingPart ? "Save Changes" : "Add Dua"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
