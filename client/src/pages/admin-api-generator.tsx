import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Key, Plus, Trash2, Copy, Check, Loader2, RefreshCw,
  Book, FileText, FolderOpen, Moon, Lightbulb,
  Shield, Zap, Send, ChevronDown, ChevronRight,
  Eye, EyeOff, AlertCircle, Code2, Terminal,
  Smartphone, Wifi, ArrowLeftRight, Upload,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  rateLimit: number;
  isActive: boolean;
  requestCount: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const ALL_PERMISSIONS = [
  { id: "read", label: "Read", description: "GET endpoints — list and retrieve content", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { id: "write", label: "Write", description: "POST/PATCH endpoints — create and update content", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "publish", label: "Publish", description: "Publish drafts to live — use for AI automation", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { id: "delete", label: "Delete", description: "DELETE endpoints — remove content (soft delete)", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
];

const API_DOCS = [
  {
    category: "Stories",
    icon: FileText,
    color: "text-emerald-600",
    endpoints: [
      { method: "GET", path: "/api/v1/stories", desc: "List published stories", permission: "read", params: [{ name: "limit", type: "number", default: "20", desc: "Max results (1–100)" }, { name: "offset", type: "number", default: "0", desc: "Pagination offset" }, { name: "featured", type: "boolean", default: "false", desc: "Filter featured only" }] },
      { method: "GET", path: "/api/v1/stories/:slug", desc: "Get a single story by slug", permission: "read", params: [] },
      { method: "POST", path: "/api/v1/stories", desc: "Create a new story (saved as draft)", permission: "write", params: [{ name: "title", type: "string", default: "", desc: "Story title (required)" }, { name: "content", type: "string", default: "", desc: "HTML content" }, { name: "categoryId", type: "string", default: "", desc: "Category ID" }, { name: "status", type: "string", default: "draft", desc: "draft | published" }, { name: "featured", type: "boolean", default: "false", desc: "Feature on home page" }] },
      { method: "PATCH", path: "/api/v1/stories/:id", desc: "Update an existing story", permission: "write", params: [{ name: "title", type: "string", default: "", desc: "Updated title" }, { name: "content", type: "string", default: "", desc: "Updated HTML content" }, { name: "status", type: "string", default: "", desc: "draft | published" }] },
      { method: "PATCH", path: "/api/v1/stories/:id/publish", desc: "Publish a draft story", permission: "publish", params: [] },
      { method: "DELETE", path: "/api/v1/stories/:id", desc: "Soft-delete a story (moves to trash)", permission: "delete", params: [] },
    ]
  },
  {
    category: "Categories",
    icon: FolderOpen,
    color: "text-orange-600",
    endpoints: [
      { method: "GET", path: "/api/v1/categories", desc: "List all categories (story, book, motivational, dua)", permission: "read", params: [] },
    ]
  },
  {
    category: "Books",
    icon: Book,
    color: "text-blue-600",
    endpoints: [
      { method: "GET", path: "/api/v1/books", desc: "List all published books", permission: "read", params: [{ name: "limit", type: "number", default: "20", desc: "Max results" }, { name: "offset", type: "number", default: "0", desc: "Pagination offset" }, { name: "search", type: "string", default: "", desc: "Search query" }] },
      { method: "GET", path: "/api/v1/books/:slug", desc: "Get a single book by slug", permission: "read", params: [] },
      { method: "POST", path: "/api/v1/books", desc: "Create a new book", permission: "write", params: [{ name: "title", type: "string", default: "", desc: "Book title (required)" }, { name: "description", type: "string", default: "", desc: "Book description" }, { name: "type", type: "string", default: "free", desc: "free | paid" }, { name: "published", type: "boolean", default: "false", desc: "Publish immediately" }] },
      { method: "PATCH", path: "/api/v1/books/:id", desc: "Update an existing book", permission: "write", params: [] },
      { method: "PATCH", path: "/api/v1/books/:id/publish", desc: "Publish a draft book", permission: "publish", params: [] },
      { method: "DELETE", path: "/api/v1/books/:id", desc: "Soft-delete a book", permission: "delete", params: [] },
    ]
  },
  {
    category: "Duas",
    icon: Moon,
    color: "text-violet-600",
    endpoints: [
      { method: "GET", path: "/api/v1/duas", desc: "List all duas", permission: "read", params: [{ name: "limit", type: "number", default: "20", desc: "Max results" }, { name: "offset", type: "number", default: "0", desc: "Pagination offset" }] },
      { method: "GET", path: "/api/v1/duas/:slug", desc: "Get a single dua by slug", permission: "read", params: [] },
      { method: "POST", path: "/api/v1/duas", desc: "Create a new dua", permission: "write", params: [{ name: "title", type: "string", default: "", desc: "Dua title (required)" }, { name: "arabicText", type: "string", default: "", desc: "Arabic text" }, { name: "translation", type: "string", default: "", desc: "Translation" }, { name: "published", type: "boolean", default: "false", desc: "Publish immediately" }] },
      { method: "PATCH", path: "/api/v1/duas/:id", desc: "Update an existing dua", permission: "write", params: [] },
      { method: "PATCH", path: "/api/v1/duas/:id/publish", desc: "Publish a draft dua", permission: "publish", params: [] },
      { method: "DELETE", path: "/api/v1/duas/:id", desc: "Soft-delete a dua", permission: "delete", params: [] },
    ]
  },
  {
    category: "Motivational Stories",
    icon: Lightbulb,
    color: "text-amber-600",
    endpoints: [
      { method: "GET", path: "/api/v1/motivational-stories", desc: "List motivational stories", permission: "read", params: [{ name: "limit", type: "number", default: "20", desc: "Max results" }, { name: "offset", type: "number", default: "0", desc: "Pagination offset" }] },
      { method: "GET", path: "/api/v1/motivational-stories/:slug", desc: "Get a single motivational story by slug", permission: "read", params: [] },
      { method: "POST", path: "/api/v1/motivational-stories", desc: "Create a motivational story", permission: "write", params: [{ name: "title", type: "string", default: "", desc: "Title (required)" }, { name: "content", type: "string", default: "", desc: "HTML content" }, { name: "published", type: "boolean", default: "false", desc: "Publish immediately" }] },
      { method: "PATCH", path: "/api/v1/motivational-stories/:id", desc: "Update a motivational story", permission: "write", params: [] },
      { method: "PATCH", path: "/api/v1/motivational-stories/:id/publish", desc: "Publish a draft motivational story", permission: "publish", params: [] },
      { method: "DELETE", path: "/api/v1/motivational-stories/:id", desc: "Soft-delete a motivational story", permission: "delete", params: [] },
    ]
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  PATCH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1 hover:bg-muted rounded transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function CreateKeyModal({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["read"]);
  const [rateLimit, setRateLimit] = useState(1000);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/admin/api-keys", { name, permissions, rateLimit }),
    onSuccess: async (res: any) => {
      const data = await res.json();
      setGeneratedKey(data.rawKey);
      onCreated();
      toast({ title: "API key created — copy it now, it won't be shown again!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const togglePerm = (p: string) => {
    setPermissions(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  if (generatedKey) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">Copy your API key now</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">This is the only time you'll see the full key. It cannot be recovered.</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Full API Key</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-sm bg-muted rounded-md px-3 py-2 break-all">
              {showKey ? generatedKey : "•".repeat(generatedKey.length)}
            </div>
            <button onClick={() => setShowKey(s => !s)} className="p-2 hover:bg-muted rounded" title="Toggle visibility">
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <CopyButton text={generatedKey} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Usage example</Label>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">{`curl -H "X-Api-Key: ${generatedKey}" \\
  ${window.location.origin}/api/v1/stories`}</pre>
        </div>
        <Button onClick={() => { setGeneratedKey(null); setName(""); setPermissions(["read"]); }} variant="outline" className="w-full">
          Create Another Key
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Key Name <span className="text-destructive">*</span></Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. AI Content Agent, WordPress Plugin"
          data-testid="input-key-name"
        />
        <p className="text-xs text-muted-foreground">A human-readable label so you know what this key is for.</p>
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="space-y-2">
          {ALL_PERMISSIONS.map(perm => (
            <div
              key={perm.id}
              onClick={() => togglePerm(perm.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${permissions.includes(perm.id) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
              data-testid={`perm-toggle-${perm.id}`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${permissions.includes(perm.id) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                {permissions.includes(perm.id) && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{perm.label}</span>
                  <Badge className={`text-xs ${perm.color}`}>{perm.id}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{perm.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Rate Limit (requests / hour)</Label>
        <Input
          type="number"
          min={10}
          max={100000}
          value={rateLimit}
          onChange={e => setRateLimit(Number(e.target.value))}
          data-testid="input-rate-limit"
        />
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={!name || mutation.isPending}
        className="w-full"
        data-testid="button-create-key"
      >
        {mutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Key className="w-4 h-4 mr-2" /> Generate API Key</>}
      </Button>
    </div>
  );
}

function KeysTab() {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  const { data: keys = [], isLoading, refetch } = useQuery<ApiKeyRecord[]>({
    queryKey: ["/api/admin/api-keys"],
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/api-keys/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] }),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "API key revoked" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {keys.length} {keys.length === 1 ? "key" : "keys"} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-keys">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => setCreating(c => !c)} data-testid="button-new-key">
            <Plus className="w-4 h-4 mr-1" /> New API Key
          </Button>
        </div>
      </div>

      {creating && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> Generate New API Key
          </h3>
          <CreateKeyModal onCreated={() => { queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] }); }} />
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : keys.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Key className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No API keys yet</p>
          <p className="text-sm mt-1">Create your first key to start using the API</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map(key => {
            const perms: string[] = JSON.parse(key.permissions || '["read"]');
            return (
              <Card key={key.id} className={`p-4 ${!key.isActive ? "opacity-60" : ""}`} data-testid={`api-key-row-${key.id}`}>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Key className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{key.name}</span>
                      {!key.isActive && <Badge variant="outline" className="text-xs">Disabled</Badge>}
                      {perms.map(p => {
                        const pd = ALL_PERMISSIONS.find(x => x.id === p);
                        return pd ? (
                          <Badge key={p} className={`text-xs ${pd.color}`}>{p}</Badge>
                        ) : null;
                      })}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mb-2">
                      <span>{key.keyPrefix}••••••••••••••••••••</span>
                      <CopyButton text={key.keyPrefix} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{key.requestCount.toLocaleString()} requests</span>
                      <span>Limit: {key.rateLimit.toLocaleString()}/hr</span>
                      {key.lastUsedAt && <span>Last used: {format(new Date(key.lastUsedAt), "MMM d, yyyy")}</span>}
                      {key.expiresAt && <span>Expires: {format(new Date(key.expiresAt), "MMM d, yyyy")}</span>}
                      <span>Created: {format(new Date(key.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={key.isActive}
                      onCheckedChange={(v) => toggleMutation.mutate({ id: key.id, isActive: v })}
                      data-testid={`toggle-key-${key.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { if (confirm("Revoke this API key? This cannot be undone.")) deleteMutation.mutate(key.id); }}
                      data-testid={`button-revoke-${key.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DocsTab() {
  const [open, setOpen] = useState<string | null>(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-muted/50 border text-sm">
        <p className="font-semibold mb-2 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" /> Authentication</p>
        <p className="text-muted-foreground mb-3">All API v1 endpoints require an API key. Pass it using either header:</p>
        <pre className="text-xs bg-background rounded p-3 overflow-x-auto">{`X-Api-Key: sol_your_api_key_here
# or
Authorization: Bearer sol_your_api_key_here`}</pre>
      </div>

      <div className="p-4 rounded-lg bg-muted/50 border text-sm">
        <p className="font-semibold mb-2 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Response Format</p>
        <pre className="text-xs bg-background rounded p-3 overflow-x-auto">{`// List endpoints
{ "data": [...], "total": 42, "limit": 20, "offset": 0 }

// Single item endpoints
{ "data": { ... } }

// Error responses
{ "error": "Description of error" }`}</pre>
      </div>

      {API_DOCS.map(group => {
        const Icon = group.icon;
        return (
          <Card key={group.category} className="overflow-hidden">
            <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
              <Icon className={`w-4 h-4 ${group.color}`} />
              <span className="font-semibold text-sm">{group.category}</span>
              <Badge variant="outline" className="text-xs ml-auto">{group.endpoints.length} endpoints</Badge>
            </div>
            <div className="divide-y">
              {group.endpoints.map(ep => {
                const key = `${ep.method}${ep.path}`;
                const isOpen = open === key;
                const permDef = ALL_PERMISSIONS.find(p => p.id === ep.permission);
                return (
                  <div key={key}>
                    <button
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setOpen(isOpen ? null : key)}
                      data-testid={`doc-toggle-${key}`}
                    >
                      <Badge className={`text-xs font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</Badge>
                      <code className="text-sm font-mono flex-1 text-left">{ep.path}</code>
                      {permDef && (
                        <Badge className={`text-xs ${permDef.color} shrink-0`}>{ep.permission}</Badge>
                      )}
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-sm text-muted-foreground">{ep.desc}</p>
                        {ep.params.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Parameters</p>
                            <div className="space-y-1.5">
                              {ep.params.map(p => (
                                <div key={p.name} className="flex items-start gap-3 text-sm">
                                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-primary shrink-0">{p.name}</code>
                                  <span className="text-xs text-muted-foreground shrink-0">{p.type}</span>
                                  <span className="text-xs text-muted-foreground">{p.desc}</span>
                                  {p.default && <span className="text-xs text-muted-foreground ml-auto shrink-0">default: <code>{p.default}</code></span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wide">Example Request</p>
                          <div className="relative">
                            <pre className="text-xs bg-muted rounded p-3 overflow-x-auto">{`curl -H "X-Api-Key: YOUR_KEY" \\
  ${baseUrl}${ep.path.replace(/:(\w+)/g, "{$1}")}`}</pre>
                            <div className="absolute top-2 right-2">
                              <CopyButton text={`curl -H "X-Api-Key: YOUR_KEY" \\\n  ${baseUrl}${ep.path.replace(/:(\w+)/g, "{$1}")}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function TesterTab({ apiKeys }: { apiKeys: ApiKeyRecord[] }) {
  const { toast } = useToast();
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/api/v1/stories");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<{ status: number; data: any; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const activeKeys = apiKeys.filter(k => k.isActive);

  const send = async () => {
    if (!selectedKey) { toast({ title: "Select an API key first", variant: "destructive" }); return; }
    const key = apiKeys.find(k => k.id === selectedKey);
    if (!key) return;

    setLoading(true);
    const start = Date.now();
    try {
      const opts: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": `${key.keyPrefix}[HIDDEN]`,
        },
      };
      if (method !== "GET" && body) opts.body = body;
      toast({ title: "Note: API tester uses your session auth for security. Use curl/Postman with real keys for external testing." });
      const realOpts: RequestInit = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      };
      if (method !== "GET" && body) realOpts.body = body;
      const res = await fetch(path.startsWith("/api/v1/") ? path.replace("/api/v1/", "/api/") : path, realOpts);
      const data = await res.json().catch(() => ({}));
      setResponse({ status: res.status, data, time: Date.now() - start });
    } catch (e: any) {
      setResponse({ status: 0, data: { error: e.message }, time: Date.now() - start });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span className="text-amber-800 dark:text-amber-200">
          The built-in tester runs requests through your admin session. For full external API testing with real key authentication, use <strong>curl</strong> or <strong>Postman</strong>.
        </span>
      </div>

      <Card className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">API Key (for reference)</Label>
          <Select value={selectedKey} onValueChange={setSelectedKey}>
            <SelectTrigger data-testid="select-api-key">
              <SelectValue placeholder="Select an API key..." />
            </SelectTrigger>
            <SelectContent>
              {activeKeys.map(k => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name} — <code className="text-xs">{k.keyPrefix}•••</code>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-28" data-testid="select-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PATCH", "DELETE"].map(m => (
                <SelectItem key={m} value={m}><Badge className={`${METHOD_COLORS[m]} text-xs`}>{m}</Badge></SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="/api/v1/stories"
            className="flex-1 font-mono text-sm"
            data-testid="input-test-path"
          />
          <Button onClick={send} disabled={loading} data-testid="button-send-request">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Send</>}
          </Button>
        </div>

        {(method === "POST" || method === "PATCH") && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Request Body (JSON)</Label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              placeholder='{"title": "My Story", "content": "..."}'
              className="font-mono text-sm"
              data-testid="input-test-body"
            />
          </div>
        )}
      </Card>

      {response && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Badge className={response.status >= 200 && response.status < 300 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {response.status || "Error"}
            </Badge>
            <span className="text-xs text-muted-foreground">{response.time}ms</span>
            <div className="ml-auto">
              <CopyButton text={JSON.stringify(response.data, null, 2)} />
            </div>
          </div>
          <pre className="text-xs bg-muted rounded p-3 overflow-x-auto max-h-96">{JSON.stringify(response.data, null, 2)}</pre>
        </Card>
      )}

      <Card className="p-5">
        <p className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" /> Sample curl Commands
        </p>
        <div className="space-y-3">
          {[
            { label: "List Stories", cmd: `curl -H "X-Api-Key: YOUR_KEY" ${window.location.origin}/api/v1/stories?limit=5` },
            { label: "Get Single Story", cmd: `curl -H "X-Api-Key: YOUR_KEY" ${window.location.origin}/api/v1/stories/story-slug` },
            { label: "Create Story (AI Agent)", cmd: `curl -X POST -H "X-Api-Key: YOUR_KEY" -H "Content-Type: application/json" \\\n  -d '{"title":"AI Story","content":"<p>Content</p>","status":"draft"}' \\\n  ${window.location.origin}/api/v1/stories` },
            { label: "Publish Draft", cmd: `curl -X PATCH -H "X-Api-Key: YOUR_KEY" ${window.location.origin}/api/v1/stories/STORY_ID/publish` },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                <CopyButton text={item.cmd} />
              </div>
              <pre className="text-xs bg-muted rounded p-2.5 overflow-x-auto">{item.cmd}</pre>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AppConnectTab({ apiKeys }: { apiKeys: ApiKeyRecord[] }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const wsUrl = baseUrl.replace(/^https?/, "wss") + "/ws";
  const hasReadKey = apiKeys.find(k => k.isActive && JSON.parse(k.permissions || '["read"]').includes("read"));

  const reactNativeExample = `// React Native / Expo — Stories of Light API Client
import { useState, useEffect } from 'react';

const API_BASE = '${baseUrl}/api/v1';
const API_KEY = 'YOUR_API_KEY'; // Generate in API Keys tab

// Fetch stories
async function getStories(limit = 10, offset = 0) {
  const res = await fetch(\`\${API_BASE}/stories?limit=\${limit}&offset=\${offset}\`, {
    headers: { 'X-Api-Key': API_KEY }
  });
  return res.json(); // { data: [...], total, limit, offset }
}

// Create a story (requires write permission)
async function createStory(title, content, categoryId) {
  const res = await fetch(\`\${API_BASE}/stories\`, {
    method: 'POST',
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, content, categoryId, status: 'draft' })
  });
  return res.json(); // { data: { id, title, ... } }
}

// Publish a story (requires publish permission)
async function publishStory(storyId) {
  return fetch(\`\${API_BASE}/stories/\${storyId}/publish\`, {
    method: 'PATCH',
    headers: { 'X-Api-Key': API_KEY }
  });
}`;

  const flutterExample = `// Flutter — Stories of Light API Client
import 'dart:convert';
import 'package:http/http.dart' as http;

const String apiBase = '${baseUrl}/api/v1';
const String apiKey = 'YOUR_API_KEY'; // Generate in API Keys tab

final headers = {
  'X-Api-Key': apiKey,
  'Content-Type': 'application/json',
};

// Fetch stories
Future<Map> getStories({int limit = 10, int offset = 0}) async {
  final res = await http.get(
    Uri.parse('\$apiBase/stories?limit=\$limit&offset=\$offset'),
    headers: headers,
  );
  return jsonDecode(res.body); // { data: [...], total, limit, offset }
}

// Create a story (requires write permission)
Future<Map> createStory(String title, String content, String categoryId) async {
  final res = await http.post(
    Uri.parse('\$apiBase/stories'),
    headers: headers,
    body: jsonEncode({'title': title, 'content': content, 'categoryId': categoryId, 'status': 'draft'}),
  );
  return jsonDecode(res.body); // { data: { id, title, ... } }
}`;

  const wsExample = `// Real-time sync via WebSocket
const ws = new WebSocket('${wsUrl}');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'invalidate') {
    // msg.keys = ['/api/stories', '/api/books', ...]
    // Re-fetch the data for these keys in your app
    msg.keys.forEach(key => refetchData(key));
  }
};

ws.onclose = () => {
  // Auto-reconnect after 3 seconds
  setTimeout(() => connectWebSocket(), 3000);
};`;

  const [codeTab, setCodeTab] = useState<"react-native" | "flutter" | "websocket">("react-native");

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: <Smartphone className="w-5 h-5 text-primary" />, title: "Mobile App Ready", desc: "Full REST API with JSON responses formatted for mobile consumption" },
          { icon: <Wifi className="w-5 h-5 text-emerald-600" />, title: "Real-Time WebSocket", desc: `Connect to ${wsUrl} to receive instant content-change notifications` },
          { icon: <ArrowLeftRight className="w-5 h-5 text-blue-600" />, title: "Two-Way Sync", desc: "Upload from app → appears on website. Website changes → push to app in real time" },
        ].map(f => (
          <div key={f.title} className="border rounded-xl p-4 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">{f.icon}</div>
            <p className="font-semibold text-sm">{f.title}</p>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        <p className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" /> Quick Setup Guide
        </p>
        <ol className="space-y-3 text-sm">
          {[
            { n: 1, title: "Generate an API key", desc: `Go to the "API Keys" tab → click "New API Key" → choose permissions (Read for fetching, Write for creating content, Publish for making content live, Delete for removing content).` },
            { n: 2, title: "Set your base URL", desc: `All API endpoints start with: ` },
            { n: 3, title: "Add the auth header", desc: `Every request must include: X-Api-Key: YOUR_KEY_HERE (or: Authorization: Bearer YOUR_KEY_HERE)` },
            { n: 4, title: "Handle responses", desc: `List endpoints return { data: [...], total, limit, offset }. Single-item endpoints return { data: { ... } }. Errors return { error: "description" }` },
            { n: 5, title: "Enable real-time sync (optional)", desc: `Connect to the WebSocket URL below to receive instant updates when content changes on the website.` },
          ].map(step => (
            <li key={step.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
              <div>
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{step.desc}</p>
                {step.n === 2 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{baseUrl}/api/v1</code>
                    <CopyButton text={`${baseUrl}/api/v1`} />
                  </div>
                )}
                {step.n === 5 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{wsUrl}</code>
                    <CopyButton text={wsUrl} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {!hasReadKey && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-amber-800 dark:text-amber-200">
            You don't have an active API key yet. Go to the <strong>API Keys</strong> tab to generate one.
          </span>
        </div>
      )}

      <Card className="p-5 space-y-3">
        <p className="font-semibold flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" /> Code Examples
        </p>
        <div className="flex gap-2 border-b pb-2">
          {([
            { id: "react-native", label: "React Native / Expo" },
            { id: "flutter", label: "Flutter" },
            { id: "websocket", label: "WebSocket Sync" },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setCodeTab(t.id)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${codeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto max-h-96 whitespace-pre-wrap">
            {codeTab === "react-native" ? reactNativeExample : codeTab === "flutter" ? flutterExample : wsExample}
          </pre>
          <div className="absolute top-2 right-2">
            <CopyButton text={codeTab === "react-native" ? reactNativeExample : codeTab === "flutter" ? flutterExample : wsExample} />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <p className="font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" /> Supported Content Types
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon: <FileText className="w-4 h-4 text-emerald-600" />, title: "Articles & Stories", ops: ["Read (all)", "Create", "Update", "Publish", "Delete"] },
            { icon: <Book className="w-4 h-4 text-blue-600" />, title: "Books", ops: ["Read (all)", "Create", "Update", "Publish", "Delete"] },
            { icon: <Moon className="w-4 h-4 text-violet-600" />, title: "Duas", ops: ["Read (all)", "Create", "Update", "Publish", "Delete"] },
            { icon: <Lightbulb className="w-4 h-4 text-amber-600" />, title: "Motivational Stories", ops: ["Read (all)", "Create", "Update", "Publish", "Delete"] },
            { icon: <FolderOpen className="w-4 h-4 text-orange-600" />, title: "Categories", ops: ["Read (all)"] },
          ].map(ct => (
            <div key={ct.title} className="border rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                {ct.icon}
                <span className="font-medium text-sm">{ct.title}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {ct.ops.map(op => (
                  <Badge key={op} variant="outline" className="text-xs">{op}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AdminApiGeneratorPage() {
  const { data: keys = [], isLoading } = useQuery<ApiKeyRecord[]>({
    queryKey: ["/api/admin/api-keys"],
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">API Generator</h1>
            <p className="text-sm text-muted-foreground">Manage API keys and integrate with external systems or AI agents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Keys", value: keys.length, icon: Key, color: "text-primary" },
            { label: "Active Keys", value: keys.filter(k => k.isActive).length, icon: Shield, color: "text-green-600" },
            { label: "Total Requests", value: keys.reduce((a, k) => a + k.requestCount, 0).toLocaleString(), icon: Zap, color: "text-amber-500" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isLoading ? "—" : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="connect">
          <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1">
            <TabsTrigger value="connect" data-testid="tab-connect">
              <Smartphone className="w-4 h-4 mr-2" /> App Connect
            </TabsTrigger>
            <TabsTrigger value="keys" data-testid="tab-keys">
              <Key className="w-4 h-4 mr-2" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="docs" data-testid="tab-docs">
              <FileText className="w-4 h-4 mr-2" /> Documentation
            </TabsTrigger>
            <TabsTrigger value="tester" data-testid="tab-tester">
              <Terminal className="w-4 h-4 mr-2" /> API Tester
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="mt-4">
            <AppConnectTab apiKeys={keys} />
          </TabsContent>

          <TabsContent value="keys" className="mt-4">
            <KeysTab />
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <DocsTab />
          </TabsContent>

          <TabsContent value="tester" className="mt-4">
            <TesterTab apiKeys={keys} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
