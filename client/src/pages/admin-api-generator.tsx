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
  Globe, Link2, Wand2, Settings2,
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

function DocsTab({ baseUrl }: { baseUrl: string }) {
  const [open, setOpen] = useState<string | null>(null);

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

// Maps API paths to their equivalent frontend page URLs
function getPageUrl(method: string, apiPath: string, pathParams: Record<string, string>): string | null {
  if (method !== "GET") return null;
  const resolved = Object.entries(pathParams).reduce(
    (acc, [k, v]) => acc.replace(`:${k}`, v || `{${k}}`),
    apiPath
  );
  const pageMap: Record<string, string> = {
    "/api/v1/stories": "/stories",
    "/api/v1/books": "/books",
    "/api/v1/duas": "/duas",
    "/api/v1/motivational-stories": "/motivational-stories",
    "/api/v1/categories": "/",
  };
  if (pageMap[apiPath]) return pageMap[apiPath];
  const m = resolved.match(/^\/api\/v1\/([^/]+)\/([^/]+)$/);
  if (m && !m[2].includes("{")) {
    const sectionMap: Record<string, string> = {
      stories: "/stories",
      books: "/books",
      duas: "/duas",
      "motivational-stories": "/motivational-stories",
    };
    const base = sectionMap[m[1]];
    if (base) return `${base}/${m[2]}`;
  }
  return null;
}

function CurlBuilderTab({ apiKeys, baseUrl }: { apiKeys: ApiKeyRecord[]; baseUrl: string }) {
  // Flatten all endpoints into a single list for the dropdown
  const allEndpoints = API_DOCS.flatMap(group =>
    group.endpoints.map(ep => ({ ...ep, category: group.category, color: group.color, icon: group.icon }))
  );

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [bodyJson, setBodyJson] = useState("");

  const ep = allEndpoints[selectedIdx];

  // Extract path params like :slug, :id
  const pathParamNames = (ep.path.match(/:(\w+)/g) || []).map(s => s.slice(1));

  // Build the full URL
  const resolvedPath = pathParamNames.reduce(
    (acc, name) => acc.replace(`:${name}`, pathParams[name] || `{${name}}`),
    ep.path
  );
  const queryString = Object.entries(queryParams)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  const fullUrl = `${baseUrl}${resolvedPath}${queryString ? `?${queryString}` : ""}`;

  // Generate cURL command
  const curlLines: string[] = [`curl -X ${ep.method}`];
  curlLines.push(`  -H "X-Api-Key: ${apiKey || "YOUR_API_KEY"}"`);
  if (ep.method !== "GET") curlLines.push(`  -H "Content-Type: application/json"`);
  if ((ep.method === "POST" || ep.method === "PATCH") && bodyJson) {
    const oneLineBody = bodyJson.replace(/\s+/g, " ").trim();
    curlLines.push(`  -d '${oneLineBody}'`);
  }
  curlLines.push(`  "${fullUrl}"`);
  const curlCommand = curlLines.join(" \\\n");

  const pageUrl = getPageUrl(ep.method, ep.path, pathParams);

  // When endpoint changes, reset params and pre-fill body defaults
  const handleEndpointChange = (idxStr: string) => {
    const idx = parseInt(idxStr, 10);
    setSelectedIdx(idx);
    setPathParams({});
    setQueryParams({});
    const newEp = allEndpoints[idx];
    if (newEp.method === "POST") {
      const bodyDefaults = Object.fromEntries(
        (newEp.params || []).filter(p => p.type !== "number" && p.type !== "boolean").map(p => [p.name, p.default || ""])
      );
      setBodyJson(JSON.stringify(bodyDefaults, null, 2));
    } else {
      setBodyJson("");
    }
  };

  const activeKeys = apiKeys.filter(k => k.isActive);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Builder panel */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" /> Request Builder
            </p>

            {/* Endpoint selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Endpoint</Label>
              <Select value={String(selectedIdx)} onValueChange={handleEndpointChange}>
                <SelectTrigger data-testid="select-curl-endpoint">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {API_DOCS.map(group =>
                    group.endpoints.map((e) => {
                      const flatIdx = allEndpoints.findIndex(x => x.method === e.method && x.path === e.path && x.category === group.category);
                      return (
                        <SelectItem key={`${e.method}${e.path}`} value={String(flatIdx)}>
                          <span className="flex items-center gap-2 text-xs">
                            <Badge className={`${METHOD_COLORS[e.method]} text-xs font-mono shrink-0`}>{e.method}</Badge>
                            <span className="font-mono">{e.path}</span>
                          </span>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{ep.desc}</p>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="sol_your_api_key_here"
                  className="flex-1 font-mono text-xs"
                  data-testid="input-curl-api-key"
                />
                {activeKeys.length > 0 && (
                  <Select value="" onValueChange={v => {
                    const k = apiKeys.find(k => k.id === v);
                    if (k) setApiKey(`${k.keyPrefix}••• (use full key)`);
                  }}>
                    <SelectTrigger className="w-32 text-xs" data-testid="select-curl-key-fill">
                      <SelectValue placeholder="Pick key" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeKeys.map(k => (
                        <SelectItem key={k.id} value={k.id} className="text-xs">
                          {k.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Path params */}
            {pathParamNames.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Path Parameters</Label>
                {pathParamNames.map(name => (
                  <div key={name} className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0 text-primary">:{name}</code>
                    <Input
                      value={pathParams[name] || ""}
                      onChange={e => setPathParams(prev => ({ ...prev, [name]: e.target.value }))}
                      placeholder={name === "slug" ? "content-slug" : name === "id" ? "content-id" : name}
                      className="flex-1 text-sm font-mono"
                      data-testid={`input-curl-param-${name}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Query params */}
            {ep.method === "GET" && ep.params.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Query Parameters <span className="font-normal">(optional)</span></Label>
                {ep.params.map(p => (
                  <div key={p.name} className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0 min-w-[70px]">{p.name}</code>
                    <Input
                      value={queryParams[p.name] || ""}
                      onChange={e => setQueryParams(prev => ({ ...prev, [p.name]: e.target.value }))}
                      placeholder={p.default || p.type}
                      className="flex-1 text-sm"
                      data-testid={`input-curl-query-${p.name}`}
                    />
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{p.desc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Request body */}
            {(ep.method === "POST" || ep.method === "PATCH") && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Request Body (JSON)</Label>
                <Textarea
                  value={bodyJson}
                  onChange={e => setBodyJson(e.target.value)}
                  rows={6}
                  placeholder='{"title": "My Content", "content": "..."}'
                  className="font-mono text-xs resize-none"
                  data-testid="input-curl-body"
                />
              </div>
            )}
          </Card>
        </div>

        {/* Output panel */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" /> Generated cURL
              </p>
              <CopyButton text={curlCommand} />
            </div>
            <pre className="text-xs bg-muted rounded-md p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">{curlCommand}</pre>

            {pageUrl && (
              <div className="pt-2 border-t space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" /> Equivalent Page URL
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-3 py-1.5 rounded-md flex-1 break-all font-mono">
                    {baseUrl}{pageUrl}
                  </code>
                  <CopyButton text={`${baseUrl}${pageUrl}`} />
                </div>
                <p className="text-xs text-muted-foreground">The frontend page that serves this content to visitors.</p>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" /> Quick Examples
            </p>
            <div className="space-y-3">
              {[
                {
                  label: "List Stories",
                  cmd: `curl -H "X-Api-Key: YOUR_KEY" \\\n  "${baseUrl}/api/v1/stories?limit=5"`,
                },
                {
                  label: "Get Single Story",
                  cmd: `curl -H "X-Api-Key: YOUR_KEY" \\\n  "${baseUrl}/api/v1/stories/sahaba-abu-hurairah"`,
                },
                {
                  label: "Create Story (AI Agent)",
                  cmd: `curl -X POST \\\n  -H "X-Api-Key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title":"New Story","content":"<p>Content</p>","status":"draft"}' \\\n  "${baseUrl}/api/v1/stories"`,
                },
                {
                  label: "Publish a Draft",
                  cmd: `curl -X PATCH \\\n  -H "X-Api-Key: YOUR_KEY" \\\n  "${baseUrl}/api/v1/stories/STORY_ID/publish"`,
                },
                {
                  label: "List Books",
                  cmd: `curl -H "X-Api-Key: YOUR_KEY" \\\n  "${baseUrl}/api/v1/books?limit=10"`,
                },
                {
                  label: "List Duas",
                  cmd: `curl -H "X-Api-Key: YOUR_KEY" \\\n  "${baseUrl}/api/v1/duas?limit=20"`,
                },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                    <CopyButton text={item.cmd} />
                  </div>
                  <pre className="text-xs bg-muted rounded p-2.5 overflow-x-auto whitespace-pre-wrap">{item.cmd}</pre>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AppConnectTab({ apiKeys, baseUrl }: { apiKeys: ApiKeyRecord[]; baseUrl: string }) {
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

  const { data: adminSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const configuredDomain = adminSettings?.siteUrl?.trim();
  const baseUrl = configuredDomain || (typeof window !== "undefined" ? window.location.origin : "");
  const isUsingFallback = !configuredDomain;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Code2 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">API Generator</h1>
            <p className="text-sm text-muted-foreground">Manage API keys and integrate with external systems or AI agents</p>
          </div>
        </div>

        {/* Domain banner */}
        <div className={`flex items-center gap-3 p-4 rounded-lg border text-sm ${
          isUsingFallback
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        }`}>
          <Globe className={`w-4 h-4 shrink-0 ${isUsingFallback ? "text-amber-600" : "text-green-600"}`} />
          <div className="flex-1 min-w-0">
            <span className={`font-semibold ${isUsingFallback ? "text-amber-800 dark:text-amber-200" : "text-green-800 dark:text-green-200"}`}>
              {isUsingFallback ? "Development URL (fallback)" : "Production URL"}
            </span>
            <code className={`ml-2 text-xs px-2 py-0.5 rounded font-mono ${isUsingFallback ? "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300" : "bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-300"}`}>
              {baseUrl}
            </code>
            {isUsingFallback && (
              <span className="text-amber-700 dark:text-amber-400 text-xs ml-2">
                — Set your production domain in Settings → General → Production Site URL
              </span>
            )}
          </div>
          <CopyButton text={baseUrl} />
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
            <TabsTrigger value="curl" data-testid="tab-curl">
              <Terminal className="w-4 h-4 mr-2" /> cURL Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="mt-4">
            <AppConnectTab apiKeys={keys} baseUrl={baseUrl} />
          </TabsContent>

          <TabsContent value="keys" className="mt-4">
            <KeysTab />
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <DocsTab baseUrl={baseUrl} />
          </TabsContent>

          <TabsContent value="curl" className="mt-4">
            <CurlBuilderTab apiKeys={keys} baseUrl={baseUrl} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
