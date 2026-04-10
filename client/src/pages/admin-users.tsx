import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, Pencil, Trash2, Loader2, Search, Eye, EyeOff, Copy,
  KeyRound, UserCheck, ShieldCheck, UserCog, CalendarDays, Clock,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";

interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  role: string;
  createdAt: string;
  plainPassword: string | null;
}

function EditUserDialog({ user, open, onOpenChange }: { user: AdminUser; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const body: any = { name, email, role };
      if (password) body.password = password;
      await apiRequest("PATCH", `/api/admin/users/${user.id}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      toast({ title: "User updated" });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-edit-user">
        <DialogHeader>
          <DialogTitle>Edit User — {user.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" data-testid="input-user-name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" data-testid="input-user-email" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              Set New Password
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </Label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="pr-10"
                data-testid="input-user-password"
              />
              <Button
                type="button" size="icon" variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowPwd(s => !s)}
              >
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} data-testid="button-save-user">
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UserCredentialsDialog({ user, open, onOpenChange }: { user: AdminUser; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const [showPwd, setShowPwd] = useState(false);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const hasPassword = !!user.plainPassword;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="dialog-user-credentials">
        <DialogHeader>
          <DialogTitle>Login Credentials</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</p>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <span className="flex-1 text-sm font-mono" data-testid="text-user-cred-email">
                {user.email || "No email on file"}
              </span>
              {user.email && (
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(user.email!, "Email")}>
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Password</p>
            {hasPassword ? (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <span className="flex-1 text-sm font-mono" data-testid="text-user-cred-password">
                  {showPwd ? user.plainPassword : "••••••••••"}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(user.plainPassword!, "Password")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="bg-muted rounded-lg px-3 py-2">
                <p className="text-sm text-muted-foreground" data-testid="text-user-cred-password">
                  Password not stored — this user registered via the website signup form.
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {hasPassword
              ? "These credentials were set when the account was created by an admin."
              : "For security, only passwords set by an admin are stored and visible here."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type UserSortFilter = "all" | "newest" | "oldest" | "az" | "recent";
type UserDateFilter = "all" | "7d" | "30d" | "90d" | "month" | "custom";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState<UserSortFilter>("all");
  const [dateFilter, setDateFilter] = useState<UserDateFilter>("all");
  const [customDays, setCustomDays] = useState("30");
  const [recentDays, setRecentDays] = useState("30");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [editingUser, setEditingUser] = useState<AdminUser | undefined>();
  const [viewingCredentials, setViewingCredentials] = useState<AdminUser | undefined>();

  const { startDate, endDate, apiSort } = useMemo(() => {
    const ms = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

    if (sortFilter === "recent") {
      const days = parseInt(recentDays) || 30;
      return { startDate: ms(days), endDate: undefined, apiSort: "newest" };
    }
    if (sortFilter === "oldest") return { startDate: undefined, endDate: undefined, apiSort: "oldest" };
    if (sortFilter === "az") return { startDate: undefined, endDate: undefined, apiSort: "az" };

    const base = { apiSort: "newest" };
    if (dateFilter === "7d") return { ...base, startDate: ms(7), endDate: undefined };
    if (dateFilter === "30d") return { ...base, startDate: ms(30), endDate: undefined };
    if (dateFilter === "90d") return { ...base, startDate: ms(90), endDate: undefined };
    if (dateFilter === "custom") { const d = parseInt(customDays) || 30; return { ...base, startDate: ms(d), endDate: undefined }; }
    if (dateFilter === "month") {
      const [y, m] = filterMonth.split("-").map(Number);
      return { ...base, startDate: new Date(y, m - 1, 1).toISOString(), endDate: new Date(y, m, 0, 23, 59, 59).toISOString() };
    }
    return { ...base, startDate: undefined, endDate: undefined };
  }, [sortFilter, dateFilter, customDays, recentDays, filterMonth]);

  const queryParams = new URLSearchParams({ limit: "200" });
  if (search) queryParams.set("search", search);
  if (roleFilter !== "all") queryParams.set("role", roleFilter);
  if (apiSort && apiSort !== "newest") queryParams.set("sort", apiSort);
  if (startDate) queryParams.set("startDate", startDate);
  if (endDate) queryParams.set("endDate", endDate);
  const queryString = queryParams.toString();

  const { data, isLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ["/api/admin/users", queryString],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users?${queryString}`, { credentials: "include" });
      return res.json();
    },
  });

  const { data: stats } = useQuery<{
    total: number; regularCount: number; adminCount: number; moderatorCount: number; recentCount: number;
  }>({
    queryKey: ["/api/admin/users/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users/stats", { credentials: "include" });
      return res.json();
    },
  });

  const usersList = data?.users || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/stats"] });
      toast({ title: "User deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const showDateFilter = sortFilter !== "recent" && sortFilter !== "oldest" && sortFilter !== "az";
  const showCustomDaysInput = dateFilter === "custom";
  const showMonthInput = dateFilter === "month";

  const roleBadgeVariant = (role: string) =>
    role === "admin" ? "default" : role === "moderator" ? "secondary" : "outline";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-users-title">User Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage all registered user accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <Card className="p-4" data-testid="stat-total-users">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Total Users</span>
          </div>
          {stats ? (
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                <span>Regular: {stats.regularCount}</span>
                <span>·</span>
                <span>Staff: {stats.adminCount + stats.moderatorCount}</span>
              </div>
            </div>
          ) : <Skeleton className="h-10 w-full mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-regular-users">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Regular Users</span>
          </div>
          {stats ? (
            <p className="text-2xl font-bold">{stats.regularCount}</p>
          ) : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-admins">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <UserCog className="w-4 h-4" />
            <span className="text-xs font-medium">Admins</span>
          </div>
          {stats ? (
            <p className="text-2xl font-bold">{stats.adminCount}</p>
          ) : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-moderators">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium">Moderators</span>
          </div>
          {stats ? (
            <p className="text-2xl font-bold">{stats.moderatorCount}</p>
          ) : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>

        <Card className="p-4" data-testid="stat-recent-users">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span className="text-xs font-medium">New (30d)</span>
          </div>
          {stats ? (
            <p className="text-2xl font-bold">{stats.recentCount}</p>
          ) : <Skeleton className="h-7 w-12 mt-1" />}
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-3 p-4 border-b flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36" data-testid="select-role-filter">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Regular</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortFilter} onValueChange={(v) => setSortFilter(v as UserSortFilter)}>
            <SelectTrigger className="w-44" data-testid="select-sort-filter">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="az">A – Z</SelectItem>
              <SelectItem value="recent">Recent Members</SelectItem>
            </SelectContent>
          </Select>

          {sortFilter === "recent" ? (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">Last</span>
              <Input
                type="number"
                min="1"
                max="365"
                value={recentDays}
                onChange={(e) => setRecentDays(e.target.value)}
                className="w-20 text-center"
                data-testid="input-recent-days"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
            </div>
          ) : showDateFilter && (
            <>
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as UserDateFilter)}>
                <SelectTrigger className="w-36" data-testid="select-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="month">By Month</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
              {showCustomDaysInput && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Last</span>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-20 text-center"
                    data-testid="input-custom-days"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">days</span>
                </div>
              )}
              {showMonthInput && (
                <Input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-40"
                  data-testid="input-filter-month"
                />
              )}
            </>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold mb-2">{search || roleFilter !== "all" ? "No users found" : "No users yet"}</h2>
            <p className="text-sm text-muted-foreground">
              {search || roleFilter !== "all" ? "Try adjusting your filters." : "Users who register on the website will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table data-testid="table-users">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersList.map((u) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                          {(u.name || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium leading-none" data-testid={`text-username-${u.id}`}>{u.name || u.username}</p>
                          {u.name && <p className="text-xs text-muted-foreground mt-0.5">@{u.username}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm" data-testid={`text-email-${u.id}`}>
                      {u.email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(u.role)} className="capitalize text-xs">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setViewingCredentials(u)}
                          title="View credentials"
                          data-testid={`button-view-creds-user-${u.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => setEditingUser(u)}
                          data-testid={`button-edit-user-${u.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {currentUser?.id !== u.id && (
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                            onClick={() => { if (confirm(`Delete user "${u.username}"?`)) deleteMutation.mutate(u.id); }}
                            data-testid={`button-delete-user-${u.id}`}
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
          </div>
        )}
      </Card>

      {editingUser && (
        <EditUserDialog
          key={editingUser.id}
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(v) => { if (!v) setEditingUser(undefined); }}
        />
      )}
      {viewingCredentials && (
        <UserCredentialsDialog
          key={viewingCredentials.id}
          user={viewingCredentials}
          open={!!viewingCredentials}
          onOpenChange={(v) => { if (!v) setViewingCredentials(undefined); }}
        />
      )}
    </AdminLayout>
  );
}
