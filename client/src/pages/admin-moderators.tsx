import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Copy, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface Moderator {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  permissions: string[];
  plainPassword: string | null;
  createdAt: string;
}

const ALL_PERMISSIONS = [
  { key: "categories", label: "Categories" },
  { key: "articles", label: "All Articles" },
  { key: "books", label: "Books" },
  { key: "motivational-stories", label: "Motivational Stories" },
  { key: "trash", label: "Trash" },
  { key: "settings", label: "Settings" },
];

function PermissionCheckboxes({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (key: string) => {
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {ALL_PERMISSIONS.map(p => (
        <div key={p.key} className="flex items-center gap-2">
          <Checkbox
            id={`perm-${p.key}`}
            checked={value.includes(p.key)}
            onCheckedChange={() => toggle(p.key)}
            data-testid={`checkbox-perm-${p.key}`}
          />
          <Label htmlFor={`perm-${p.key}`} className="cursor-pointer text-sm font-normal">{p.label}</Label>
        </div>
      ))}
    </div>
  );
}

function ModeratorFormDialog({
  moderator,
  open,
  onOpenChange,
}: {
  moderator?: Moderator;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const isEdit = !!moderator;
  const [name, setName] = useState(moderator?.name || "");
  const [email, setEmail] = useState(moderator?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(moderator?.role || "moderator");
  const [permissions, setPermissions] = useState<string[]>(moderator?.permissions || []);

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/moderators", { name, email, password, permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      toast({ title: "Moderator created successfully" });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/moderators/${moderator!.id}`, {
      name, email, role, permissions, ...(password ? { password } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      if (role === "user") {
        toast({ title: "Converted to regular user", description: "This account no longer has moderator access." });
      } else {
        toast({ title: "Moderator updated" });
      }
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-moderator-form">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Moderator — ${moderator!.username}` : "Create New Moderator"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" data-testid="input-mod-name" />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="mod@example.com" data-testid="input-mod-email" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{isEdit ? "New Password (leave blank to keep current)" : "Password"} {!isEdit && <span className="text-destructive">*</span>}</Label>
            <div className="relative">
              <Input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder={isEdit ? "Enter new password to change..." : "Create a secure password"}
                className="pr-10"
                data-testid="input-mod-password"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label>Account Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger data-testid="select-mod-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moderator">Moderator (Admin Panel Access)</SelectItem>
                  <SelectItem value="user">Regular User (No Admin Access)</SelectItem>
                </SelectContent>
              </Select>
              {role === "user" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  This will remove all admin panel access from this account.
                </p>
              )}
            </div>
          )}

          {role !== "user" && (
            <div className="space-y-3">
              <Label>Section Permissions</Label>
              <div className="border rounded-lg p-4 bg-muted/30">
                <PermissionCheckboxes value={permissions} onChange={setPermissions} />
              </div>
              <p className="text-xs text-muted-foreground">Choose which admin sections this moderator can access.</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => isEdit ? updateMutation.mutate() : createMutation.mutate()}
              disabled={isPending || !email || (!isEdit && !password)}
              data-testid="button-save-moderator"
              variant={role === "user" ? "destructive" : "default"}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? (role === "user" ? "Convert to Regular User" : "Save Changes") : "Create Moderator"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({ moderator, open, onOpenChange }: { moderator: Moderator; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [showPwd, setShowPwd] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const hasPassword = !!moderator.plainPassword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="dialog-credentials">
        <DialogHeader>
          <DialogTitle>Login Credentials</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <span className="flex-1 text-sm font-mono" data-testid="text-cred-email">{moderator.email || "—"}</span>
              {moderator.email && (
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(moderator.email!, "Email")}>
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Password</p>
            {hasPassword ? (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="flex-1 text-sm font-mono" data-testid="text-cred-password">
                  {showPwd ? moderator.plainPassword : "••••••••••"}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(moderator.plainPassword!, "Password")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-sm text-muted-foreground" data-testid="text-cred-password">
                  Password not stored — edit this moderator to set a new password.
                </p>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Share these credentials with the moderator so they can log in to the admin panel.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminModeratorsPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editingMod, setEditingMod] = useState<Moderator | undefined>();
  const [viewingCreds, setViewingCreds] = useState<Moderator | undefined>();

  const { data: moderators, isLoading } = useQuery<Moderator[]>({
    queryKey: ["/api/admin/moderators"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/moderators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      toast({ title: "Moderator removed" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-moderators-title">Moderators</h1>
            <p className="text-sm text-muted-foreground">Manage admin panel access for moderators</p>
          </div>
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-moderator">
            <Plus className="w-4 h-4 mr-2" />
            Add Moderator
          </Button>
        </div>

        {isLoading ? (
          <Card className="p-4">
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          </Card>
        ) : !moderators || moderators.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold mb-2">No moderators yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Create moderator accounts to grant limited admin panel access.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Moderator
            </Button>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moderators.map((mod) => (
                  <TableRow key={mod.id} data-testid={`row-moderator-${mod.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium" data-testid={`text-mod-name-${mod.id}`}>
                          {mod.name || mod.username}
                        </p>
                        <p className="text-xs text-muted-foreground">@{mod.username}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm" data-testid={`text-mod-email-${mod.id}`}>
                      {mod.email || "—"}
                    </TableCell>
                    <TableCell>
                      {mod.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">No permissions</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {mod.permissions.slice(0, 3).map(p => (
                            <Badge key={p} variant="secondary" className="text-xs capitalize">
                              {ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}
                            </Badge>
                          ))}
                          {mod.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{mod.permissions.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(mod.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setViewingCreds(mod)}
                          title="View credentials"
                          data-testid={`button-view-creds-${mod.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setEditingMod(mod)}
                          data-testid={`button-edit-moderator-${mod.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {currentUser?.id !== mod.id && (
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                            onClick={() => { if (confirm(`Remove moderator "${mod.name || mod.username}"?`)) deleteMutation.mutate(mod.id); }}
                            data-testid={`button-delete-moderator-${mod.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {showCreate && (
        <ModeratorFormDialog open={showCreate} onOpenChange={setShowCreate} />
      )}
      {editingMod && (
        <ModeratorFormDialog
          key={editingMod.id}
          moderator={editingMod}
          open={!!editingMod}
          onOpenChange={v => { if (!v) setEditingMod(undefined); }}
        />
      )}
      {viewingCreds && (
        <CredentialsDialog
          moderator={viewingCreds}
          open={!!viewingCreds}
          onOpenChange={v => { if (!v) setViewingCreds(undefined); }}
        />
      )}
    </AdminLayout>
  );
}
