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
import { Users, Pencil, Trash2, Loader2, Search, Eye, EyeOff, Copy, KeyRound } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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
                type="button"
                size="icon"
                variant="ghost"
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

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | undefined>();
  const [viewingCredentials, setViewingCredentials] = useState<AdminUser | undefined>();

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const filtered = Array.isArray(users) ? users.filter(u =>
    !search || u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  ) : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-users-title">User Accounts</h1>
            <p className="text-sm text-muted-foreground">Manage all registered user accounts</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>
        </div>

        {users && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold" data-testid="stat-total-users">{users.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold" data-testid="stat-users-month">
                {users.filter(u => {
                  const d = new Date(u.createdAt);
                  const now = new Date();
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </Card>
          </div>
        )}

        {isLoading ? (
          <Card className="p-4"><div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></Card>
        ) : !filtered || filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-semibold mb-2">{search ? "No users found" : "No users yet"}</h2>
            <p className="text-sm text-muted-foreground">
              {search ? "Try a different search term." : "Users who register on the website will appear here."}
            </p>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                    <TableCell>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {(u.name || u.username).charAt(0).toUpperCase()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-username-${u.id}`}>{u.username}</TableCell>
                    <TableCell className="text-muted-foreground" data-testid={`text-email-${u.id}`}>{u.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : u.role === "moderator" ? "secondary" : "outline"} className="capitalize text-xs">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
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
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingUser(u)} data-testid={`button-edit-user-${u.id}`}>
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
          </Card>
        )}
      </div>

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
