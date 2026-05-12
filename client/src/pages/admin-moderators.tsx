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
import {
  ShieldCheck, Plus, Pencil, Trash2, Loader2, Eye, EyeOff, Copy,
  AlertCircle, Search, Crown, Users, UserCog, BookOpen,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";

interface Contributor {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  permissions: string[];
  plainPassword: string | null;
  createdAt: string;
}

type RoleFilter = "all" | "super_owner" | "owner" | "admin" | "moderator" | "editor";
type SortOption = "newest" | "oldest" | "az";

const ALL_PERMISSIONS = [
  { key: "categories", label: "Categories" },
  { key: "articles", label: "All Articles" },
  { key: "books", label: "Books" },
  { key: "motivational-stories", label: "Motivational Stories" },
  { key: "duas", label: "Duas" },
  { key: "users", label: "Users" },
  { key: "trash", label: "Trash" },
  { key: "settings", label: "Settings" },
];

const ROLE_COLORS: Record<string, string> = {
  super_owner: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  moderator: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  editor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const ROLE_LABELS: Record<string, string> = {
  super_owner: "Super Owner",
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  editor: "Editor",
  user: "User",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-muted text-muted-foreground";
  const label = ROLE_LABELS[role] ?? (role.charAt(0).toUpperCase() + role.slice(1));
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

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

const FULL_ACCESS_ROLES = ["super_owner", "owner", "admin"];

function ContributorFormDialog({
  contributor,
  open,
  onOpenChange,
}: {
  contributor?: Contributor;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isEdit = !!contributor;
  const [name, setName] = useState(contributor?.name || "");
  const [email, setEmail] = useState(contributor?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(contributor?.role || "moderator");
  const [permissions, setPermissions] = useState<string[]>(contributor?.permissions || []);

  const isSuperOwner = currentUser?.role === "super_owner";
  const targetIsOwner = contributor?.role === "owner" || contributor?.role === "super_owner";
  const showPermissions = !FULL_ACCESS_ROLES.includes(role) && role !== "user";

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/moderators", { name, email, password, permissions, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributors/stats"] });
      toast({ title: "Contributor created successfully" });
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/moderators/${contributor!.id}`, {
      name, email, role, permissions, ...(password ? { password } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributors/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      if (role === "user") {
        toast({ title: "Converted to regular user", description: "This account no longer has contributor access." });
      } else {
        toast({ title: "Contributor updated" });
      }
      onOpenChange(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-contributor-form">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit Contributor — ${contributor!.username}` : "Add New Contributor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" data-testid="input-contrib-name" />
            </div>
            <div className="space-y-2">
              <Label>Email {!isEdit && <span className="text-destructive">*</span>}</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="user@example.com" data-testid="input-contrib-email" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {isEdit ? "New Password" : "Password"} {!isEdit && <span className="text-destructive">*</span>}
              {isEdit && <span className="text-muted-foreground font-normal text-xs ml-1">(leave blank to keep current)</span>}
            </Label>
            <div className="relative">
              <Input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder={isEdit ? "Enter new password to change..." : "Create a secure password"}
                className="pr-10"
                data-testid="input-contrib-password"
              />
              <Button
                type="button" size="icon" variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            {isEdit && targetIsOwner && !isSuperOwner ? (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Only the Super Owner can change an Owner or Super Owner's role.
              </div>
            ) : (
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger data-testid="select-contrib-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuperOwner && <SelectItem value="owner">Owner — Full access</SelectItem>}
                  <SelectItem value="admin">Admin — Full access</SelectItem>
                  <SelectItem value="moderator">Moderator — Permission-based</SelectItem>
                  <SelectItem value="editor">Editor — Permission-based</SelectItem>
                  {isEdit && <SelectItem value="user">Regular User — Remove access</SelectItem>}
                </SelectContent>
              </Select>
            )}
            {role === "user" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                This will remove all admin panel access from this account.
              </p>
            )}
          </div>

          {showPermissions && (
            <div className="space-y-3">
              <Label>Section Permissions</Label>
              <div className="border rounded-lg p-4 bg-muted/30">
                <PermissionCheckboxes value={permissions} onChange={setPermissions} />
              </div>
              <p className="text-xs text-muted-foreground">
                Choose which admin sections this contributor can access.
              </p>
            </div>
          )}

          {FULL_ACCESS_ROLES.includes(role) && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <Crown className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>{ROLE_LABELS[role] ?? role}</strong> accounts have full access to all sections of the admin panel and do not require individual permissions.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => isEdit ? updateMutation.mutate() : createMutation.mutate()}
              disabled={isPending || !email || (!isEdit && !password)}
              data-testid="button-save-contributor"
              variant={role === "user" ? "destructive" : "default"}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit
                ? (role === "user" ? "Convert to Regular User" : "Save Changes")
                : "Add Contributor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CredentialsDialog({ contributor, open, onOpenChange }: {
  contributor: Contributor; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const { toast } = useToast();
  const [showPwd, setShowPwd] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const hasPassword = !!contributor.plainPassword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="dialog-contrib-credentials">
        <DialogHeader>
          <DialogTitle>Login Credentials</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <span className="flex-1 text-sm font-mono" data-testid="text-cred-email">
                {contributor.email || "—"}
              </span>
              {contributor.email && (
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(contributor.email!, "Email")}>
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
                  {showPwd ? contributor.plainPassword : "••••••••••"}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(contributor.plainPassword!, "Password")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-sm text-muted-foreground" data-testid="text-cred-password">
                  Password not stored — edit this contributor to set a new password.
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Share these credentials with the contributor so they can log in to the admin panel.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminModeratorsPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isSuperOwner = currentUser?.role === "super_owner";

  const [showCreate, setShowCreate] = useState(false);
  const [editingContrib, setEditingContrib] = useState<Contributor | undefined>();
  const [viewingCreds, setViewingCreds] = useState<Contributor | undefined>();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");

  const { data: contributors, isLoading } = useQuery<Contributor[]>({
    queryKey: ["/api/admin/moderators"],
  });

  const { data: stats } = useQuery<{
    superOwnerCount: number; ownerCount: number; adminCount: number; moderatorCount: number; editorCount: number; total: number;
  }>({
    queryKey: ["/api/admin/contributors/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/contributors/stats", { credentials: "include" });
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/moderators/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributors/stats"] });
      toast({ title: "Contributor removed" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    let list = contributors || [];
    if (roleFilter !== "all") list = list.filter(c => c.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.username.toLowerCase().includes(q) ||
        (c.email?.toLowerCase() || "").includes(q) ||
        (c.name?.toLowerCase() || "").includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sortOption === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === "az") return (a.name || a.username).localeCompare(b.name || b.username);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [contributors, roleFilter, search, sortOption]);

  const canDeleteContributor = (target: Contributor) => {
    if (currentUser?.id === target.id) return false;
    if (target.role === "super_owner") return false;
    if (target.role === "owner" && !isSuperOwner) return false;
    return true;
  };

  const canEditContributor = (target: Contributor) => {
    if (target.role === "super_owner" && !isSuperOwner) return false;
    if (target.role === "owner" && !isSuperOwner) return false;
    return true;
  };

  const allStatCards: { key: RoleFilter; label: string; value: number | undefined; icon: any; color: string; minRole: string }[] = [
    { key: "super_owner", label: "Super Owner", value: stats?.superOwnerCount, icon: Crown, color: "text-purple-600", minRole: "super_owner" },
    { key: "owner",       label: "Owner",       value: stats?.ownerCount,      icon: Crown, color: "text-amber-600",  minRole: "super_owner" },
    { key: "admin",       label: "Admin",       value: stats?.adminCount,      icon: ShieldCheck, color: "text-red-600",    minRole: "owner" },
    { key: "moderator",   label: "Moderator",   value: stats?.moderatorCount,  icon: UserCog, color: "text-blue-600",  minRole: "admin" },
    { key: "editor",      label: "Editor",      value: stats?.editorCount,     icon: BookOpen, color: "text-green-600", minRole: "admin" },
    { key: "all",         label: "All Contributors", value: stats?.total,      icon: Users, color: "text-primary",    minRole: "admin" },
  ];

  const ROLE_RANK: Record<string, number> = { super_owner: 4, owner: 3, admin: 2, moderator: 1, editor: 1 };
  const currentRank = ROLE_RANK[currentUser?.role ?? ""] ?? 0;
  const statCards = allStatCards.filter(c => currentRank >= (ROLE_RANK[c.minRole] ?? 99));

  const dropdownRoleOptions: { value: string; label: string; minRole: string }[] = [
    { value: "role:super_owner", label: "Super Owner", minRole: "super_owner" },
    { value: "role:owner", label: "Owner", minRole: "super_owner" },
    { value: "role:admin", label: "Admin", minRole: "owner" },
    { value: "role:moderator", label: "Moderator", minRole: "admin" },
    { value: "role:editor", label: "Editor", minRole: "admin" },
  ].filter(o => currentRank >= (ROLE_RANK[o.minRole] ?? 99));

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-contributors-title">Contributors</h1>
          <p className="text-sm text-muted-foreground">Manage admin panel access for contributors</p>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-contributor">
          <Plus className="w-4 h-4 mr-2" />
          Add Contributors
        </Button>
      </div>

      <div className={`grid grid-cols-2 sm:grid-cols-3 ${statCards.length <= 4 ? "lg:grid-cols-4" : statCards.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-6"} gap-3 mb-6`}>
        {statCards.map(({ key, label, value, icon: Icon, color }) => {
          const isActive = roleFilter === key;
          return (
            <Card
              key={key}
              className={`p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${isActive ? "border-primary ring-1 ring-primary/30 bg-primary/5" : ""}`}
              onClick={() => setRoleFilter(f => f === key ? "all" : key)}
              data-testid={`stat-card-${key}`}
            >
              <div className={`flex items-center gap-2 mb-1 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <Icon className={`w-4 h-4 ${isActive ? "" : color}`} />
                <span className="text-xs font-medium">{label}</span>
              </div>
              {value !== undefined ? (
                <p className={`text-2xl font-bold ${isActive ? "text-primary" : ""}`}>{value}</p>
              ) : (
                <Skeleton className="h-8 w-12 mt-1" />
              )}
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-contributors"
            />
          </div>

          <Select
            value={
              roleFilter !== "all" ? `role:${roleFilter}`
              : sortOption === "oldest" ? "oldest"
              : "all"
            }
            onValueChange={v => {
              if (v === "all") {
                setRoleFilter("all");
                setSortOption("newest");
              } else if (v.startsWith("role:")) {
                setRoleFilter(v.replace("role:", "") as RoleFilter);
                setSortOption("newest");
              } else if (v === "oldest") {
                setSortOption("oldest");
                setRoleFilter("all");
              }
            }}
          >
            <SelectTrigger className="w-44" data-testid="select-team-member-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Team Member</SelectItem>
              {dropdownRoleOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold mb-2">
              {search || roleFilter !== "all" ? "No contributors match your filter" : "No contributors yet"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {!search && roleFilter === "all" && "Create contributor accounts to grant admin panel access."}
            </p>
            {!search && roleFilter === "all" && (
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Contributor
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-testid="table-contributors">
              <TableHeader>
                <TableRow>
                  <TableHead>Contributor</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Permissions</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} data-testid={`row-contributor-${c.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                          {(c.name || c.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium leading-none" data-testid={`text-contrib-name-${c.id}`}>
                            {c.name || c.username}
                          </p>
                          {c.name && <p className="text-xs text-muted-foreground mt-0.5">@{c.username}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm" data-testid={`text-contrib-email-${c.id}`}>
                      {c.email || "—"}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={c.role} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {FULL_ACCESS_ROLES.includes(c.role) ? (
                        <span className="text-xs text-muted-foreground italic">Full access</span>
                      ) : c.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">None assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {c.permissions.slice(0, 3).map(p => (
                            <Badge key={p} variant="secondary" className="text-xs capitalize">
                              {ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}
                            </Badge>
                          ))}
                          {c.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{c.permissions.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setViewingCreds(c)}
                          title="View credentials"
                          data-testid={`button-view-creds-${c.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {canEditContributor(c) && (
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => setEditingContrib(c)}
                            data-testid={`button-edit-contributor-${c.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {canDeleteContributor(c) && (
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                            onClick={() => {
                              if (confirm(`Remove contributor "${c.name || c.username}"?`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                            data-testid={`button-delete-contributor-${c.id}`}
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

            <div className="px-4 py-3 border-t text-sm text-muted-foreground">
              Showing {filtered.length} of {contributors?.length ?? 0} contributors
            </div>
          </div>
        )}
      </Card>

      {showCreate && (
        <ContributorFormDialog open={showCreate} onOpenChange={setShowCreate} />
      )}
      {editingContrib && (
        <ContributorFormDialog
          key={editingContrib.id}
          contributor={editingContrib}
          open={!!editingContrib}
          onOpenChange={v => { if (!v) setEditingContrib(undefined); }}
        />
      )}
      {viewingCreds && (
        <CredentialsDialog
          contributor={viewingCreds}
          open={!!viewingCreds}
          onOpenChange={v => { if (!v) setViewingCreds(undefined); }}
        />
      )}
    </AdminLayout>
  );
}
