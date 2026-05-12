import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Plus, Trash2, Edit2, Eye, EyeOff, Save, Sparkles,
  Webhook, MessageSquare, ImageIcon, AlertCircle, CheckCircle2,
  Info, Zap, Settings2, BrainCircuit, Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AiModel = {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  type: string;
  isActive: boolean;
  isDefault: boolean;
};

type IntegrationSettings = {
  enabled: boolean;
  systemMessage: string;
  textWebhookUrl: string;
  imageWebhookUrl: string;
};

const PROVIDERS = [
  { value: "openai", label: "OpenAI", examples: "gpt-4o, gpt-4-turbo, gpt-3.5-turbo" },
  { value: "anthropic", label: "Anthropic (Claude)", examples: "claude-3-5-sonnet-20241022, claude-3-haiku-20240307" },
  { value: "google", label: "Google Gemini", examples: "gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash" },
  { value: "stability", label: "Stability AI (Images)", examples: "stable-diffusion-xl-1024-v1-0" },
  { value: "custom", label: "Custom (OpenAI-compatible)", examples: "your-model-id" },
];

const DEFAULT_SYSTEM_MESSAGE = `You are an expert Islamic content writer for "Stories of Light", an Islamic educational platform. Write in a clear, authentic style. When writing articles, use proper headings (## for H2, ### for H3), paragraphs, and structure content professionally. Always maintain Islamic values, accuracy, and authenticity. Use phrases like "peace be upon him" (or ﷺ) when referring to the Prophet.`;

function looksLikeApiKey(value: string): boolean {
  if (!value || value.length < 20) return false;
  return /^(sk-|AIza|gsk_|sk-ant-|Bearer\s)/i.test(value) ||
    (/^[A-Za-z0-9_\-]{40,}$/.test(value) && !/^[a-z0-9][-a-z0-9.]+[a-z0-9]$/.test(value));
}

function looksLikeConsoleUrl(value: string): boolean {
  if (!value) return false;
  return /console\.|dashboard\.|studio\./i.test(value);
}

function ModelForm({
  editingModel,
  onSave,
  onCancel,
  isSaving,
}: {
  editingModel: AiModel | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    name: editingModel?.name || "",
    provider: editingModel?.provider || "openai",
    modelId: editingModel?.modelId || "",
    type: editingModel?.type || "text",
    apiKey: editingModel ? "••••••••" : "",
    baseUrl: "",
    isActive: editingModel?.isActive ?? true,
    isDefault: editingModel?.isDefault ?? false,
  });
  const [showKey, setShowKey] = useState(false);
  const providerInfo = PROVIDERS.find(p => p.value === form.provider);

  return (
    <div className="border rounded-xl p-5 bg-muted/20 space-y-4">
      <h3 className="text-sm font-semibold">{editingModel ? "Edit Model" : "Add New AI Model"}</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1 col-span-2">
          <Label className="text-xs">Display Name</Label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Gemini Flash (Text)"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Provider</Label>
          <select
            value={form.provider}
            onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
            className="w-full h-8 rounded-md border bg-background text-sm px-2"
          >
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Model Type</Label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full h-8 rounded-md border bg-background text-sm px-2"
          >
            <option value="text">Text Generation</option>
            <option value="image">Image Generation</option>
          </select>
        </div>

        <div className="space-y-1 col-span-2">
          <Label className="text-xs">
            Model ID <span className="font-normal text-muted-foreground">(the model name, NOT your API key)</span>
          </Label>
          <Input
            value={form.modelId}
            onChange={e => setForm(f => ({ ...f, modelId: e.target.value.trim() }))}
            placeholder={providerInfo?.examples?.split(",")[0]?.trim() || "e.g. gpt-4o"}
            className={cn("h-8 text-sm", looksLikeApiKey(form.modelId) && "border-destructive")}
          />
          {providerInfo && <p className="text-[11px] text-muted-foreground">Examples: {providerInfo.examples}</p>}
          {looksLikeApiKey(form.modelId) && (
            <p className="text-[11px] text-destructive font-medium">
              ⚠ This looks like an API key! Enter the model name (e.g. <strong>{providerInfo?.examples?.split(",")[0]?.trim()}</strong>) and paste the key in the API Key field below.
            </p>
          )}
          {form.provider === "google" && !looksLikeApiKey(form.modelId) && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠ Use the bare model name, e.g. <strong>gemini-1.5-flash</strong> — not <em>models/gemini-1.5-flash</em>
            </p>
          )}
        </div>

        <div className="space-y-1 col-span-2">
          <Label className="text-xs">API Key / Token</Label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={form.apiKey}
              onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
              placeholder={form.provider === "google" ? "AIza..." : form.provider === "anthropic" ? "sk-ant-..." : "sk-..."}
              className="h-8 text-sm pr-9"
            />
            <button
              type="button"
              onClick={() => setShowKey(s => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="space-y-1 col-span-2">
          <Label className="text-xs">
            Base URL <span className="font-normal text-muted-foreground">(leave blank to use default)</span>
          </Label>
          <Input
            value={form.baseUrl}
            onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value.trim() }))}
            placeholder={
              form.provider === "openai" ? "https://api.openai.com/v1" :
              form.provider === "anthropic" ? "https://api.anthropic.com/v1" :
              form.provider === "google" ? "https://generativelanguage.googleapis.com/v1beta/openai" :
              "https://api.your-provider.com/openai/v1"
            }
            className={cn("h-8 text-sm", looksLikeConsoleUrl(form.baseUrl) && "border-amber-500")}
          />
          {looksLikeConsoleUrl(form.baseUrl) && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              ⚠ This looks like a web console URL. For Groq use <strong>https://api.groq.com/openai/v1</strong>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 col-span-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isActive}
              onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              id="model-active"
            />
            <Label htmlFor="model-active" className="text-xs">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isDefault}
              onCheckedChange={v => setForm(f => ({ ...f, isDefault: v }))}
              id="model-default"
            />
            <Label htmlFor="model-default" className="text-xs">Default for {form.type}</Label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={() => onSave(form)} disabled={isSaving || !form.name || !form.modelId}>
          {isSaving ? "Saving…" : editingModel ? "Save Changes" : "Add Model"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function AdminAiIntegrationPage() {
  const { toast } = useToast();

  const { data: settings, isLoading: settingsLoading } = useQuery<IntegrationSettings>({
    queryKey: ["/api/admin/ai-integration-settings"],
    staleTime: 0,
  });

  const { data: models = [], refetch: refetchModels } = useQuery<AiModel[]>({
    queryKey: ["/api/admin/ai-models"],
    staleTime: 0,
  });

  const [enabled, setEnabled] = useState(true);
  const [systemMessage, setSystemMessage] = useState("");
  const [textWebhookUrl, setTextWebhookUrl] = useState("");
  const [imageWebhookUrl, setImageWebhookUrl] = useState("");
  const [showModelForm, setShowModelForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setSystemMessage(settings.systemMessage || DEFAULT_SYSTEM_MESSAGE);
      setTextWebhookUrl(settings.textWebhookUrl || "");
      setImageWebhookUrl(settings.imageWebhookUrl || "");
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/ai-integration-settings", {
      enabled, systemMessage, textWebhookUrl, imageWebhookUrl,
    }),
    onSuccess: () => {
      toast({ title: "Settings saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-integration-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-integration-status"] });
      setIsDirty(false);
    },
    onError: () => toast({ title: "Failed to save settings", variant: "destructive" }),
  });

  const saveModel = useMutation({
    mutationFn: async (data: any) => {
      if (editingModel) {
        return apiRequest("PATCH", `/api/admin/ai-models/${editingModel.id}`, data);
      }
      return apiRequest("POST", "/api/admin/ai-models", data);
    },
    onSuccess: () => {
      toast({ title: editingModel ? "Model updated" : "Model added" });
      queryClient.removeQueries({ queryKey: ["/api/admin/ai-models"] });
      refetchModels();
      setShowModelForm(false);
      setEditingModel(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteModel = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/ai-models/${id}`),
    onSuccess: () => {
      toast({ title: "Model removed" });
      queryClient.removeQueries({ queryKey: ["/api/admin/ai-models"] });
      refetchModels();
    },
  });

  const toggleModel = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest("PATCH", `/api/admin/ai-models/${id}`, { isActive }),
    onSuccess: () => refetchModels(),
  });

  const textModels = models.filter(m => m.type === "text");
  const imageModels = models.filter(m => m.type === "image");

  const markDirty = () => setIsDirty(true);

  const PROVIDER_LABELS: Record<string, string> = {
    openai: "OpenAI", anthropic: "Anthropic", google: "Google",
    stability: "Stability AI", custom: "Custom",
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-primary" />
              AI Model Integration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connect AI models to power the AI Content Studio, control the system prompt, and set up webhook automation.
            </p>
          </div>
          <Button
            onClick={() => saveSettings.mutate()}
            disabled={saveSettings.isPending || !isDirty}
            size="sm"
            className="shrink-0"
            data-testid="button-save-ai-settings"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saveSettings.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        {/* ── Section 1: Enable / Disable ── */}
        <div className="border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                enabled ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
              )}>
                <Power className={cn("w-5 h-5", enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground")} />
              </div>
              <div>
                <h2 className="text-sm font-semibold">AI System</h2>
                <p className="text-xs text-muted-foreground">
                  {enabled
                    ? "AI Studio is active — connected models will respond to requests"
                    : "AI Studio is disabled — webhooks will be used instead (if configured)"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-xs font-medium", enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                {enabled ? "ON" : "OFF"}
              </span>
              <Switch
                checked={enabled}
                onCheckedChange={v => { setEnabled(v); markDirty(); }}
                data-testid="switch-ai-enabled"
              />
            </div>
          </div>

          {enabled ? (
            <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2.5 text-xs text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>AI Studio is active. Messages will be processed by the configured AI models below.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>AI Studio is inactive. Configure the Webhook URLs below to use an external automation system (e.g. N8N).</span>
            </div>
          )}
        </div>

        {/* ── Section 2: AI Models (shown when enabled) ── */}
        {enabled && (
          <div className="border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Connected AI Models</h2>
                <Badge variant="outline" className="text-[10px]">{models.length}</Badge>
              </div>
              {!showModelForm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditingModel(null); setShowModelForm(true); }}
                  data-testid="button-add-ai-model"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Model
                </Button>
              )}
            </div>

            {showModelForm && (
              <ModelForm
                editingModel={editingModel}
                onSave={(data) => saveModel.mutate(data)}
                onCancel={() => { setShowModelForm(false); setEditingModel(null); }}
                isSaving={saveModel.isPending}
              />
            )}

            {/* Text Models */}
            {textModels.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Text Models
                </p>
                {textModels.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      m.isActive ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Bot className={cn("w-4 h-4", m.isActive ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium truncate">{m.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{PROVIDER_LABELS[m.provider] || m.provider}</Badge>
                        {m.isDefault && <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">Default</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">{m.modelId}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={m.isActive}
                        onCheckedChange={v => toggleModel.mutate({ id: m.id, isActive: v })}
                        data-testid={`switch-model-active-${m.id}`}
                      />
                      <button
                        onClick={() => { setEditingModel(m); setShowModelForm(true); }}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        data-testid={`button-edit-model-${m.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteModel.mutate(m.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                        data-testid={`button-delete-model-${m.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Image Models */}
            {imageModels.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Image Models
                </p>
                {imageModels.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      m.isActive ? "bg-purple-100 dark:bg-purple-900/30" : "bg-muted"
                    )}>
                      <ImageIcon className={cn("w-4 h-4", m.isActive ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium truncate">{m.name}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{PROVIDER_LABELS[m.provider] || m.provider}</Badge>
                        {m.isDefault && <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400">Default</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">{m.modelId}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={m.isActive}
                        onCheckedChange={v => toggleModel.mutate({ id: m.id, isActive: v })}
                        data-testid={`switch-model-active-${m.id}`}
                      />
                      <button
                        onClick={() => { setEditingModel(m); setShowModelForm(true); }}
                        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteModel.mutate(m.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {models.length === 0 && !showModelForm && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No AI models connected yet.</p>
                <p className="text-xs">Click "Add Model" to connect your first AI provider.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Section 3: System Message (shown when enabled) ── */}
        {enabled && (
          <div className="border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">System Message</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              This instruction is sent to the AI with every request. It defines the writing style, tone, and structure the AI must follow.
            </p>
            <Textarea
              value={systemMessage}
              onChange={e => { setSystemMessage(e.target.value); markDirty(); }}
              rows={6}
              className="text-sm font-mono resize-none"
              placeholder={DEFAULT_SYSTEM_MESSAGE}
              data-testid="textarea-system-message"
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSystemMessage(DEFAULT_SYSTEM_MESSAGE); markDirty(); }}
                className="text-xs"
              >
                Reset to Default
              </Button>
              <span className="text-[11px] text-muted-foreground">{systemMessage.length} characters</span>
            </div>
          </div>
        )}

        {/* ── Section 4: Webhook Mode (shown when disabled) ── */}
        {!enabled && (
          <div className="border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Webhook className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Webhook Mode</h2>
              <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400">
                Active when AI is OFF
              </Badge>
            </div>

            <div className="rounded-lg bg-muted/50 border px-4 py-3 text-xs space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-primary" /> How it works
              </p>
              <p className="text-muted-foreground leading-relaxed">
                AI Studio sends user requests to these webhook URLs (e.g. your N8N workflow). Your automation system processes the request with its own AI agent and sends the response back. This lets you build custom AI pipelines without configuring API keys here.
              </p>
              <p className="text-muted-foreground font-medium pt-0.5">
                Flow: AI Studio → Webhook → N8N / AI Agent → Response
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Text / Content Webhook URL
                </Label>
                <Input
                  value={textWebhookUrl}
                  onChange={e => { setTextWebhookUrl(e.target.value); markDirty(); }}
                  placeholder="https://your-n8n.app/webhook/ai-text"
                  className="h-9 text-sm font-mono"
                  data-testid="input-text-webhook"
                />
                <p className="text-[11px] text-muted-foreground">
                  Receives POST: <code className="bg-muted px-1 rounded">{"{ prompt, messages, systemMessage }"}</code>. Must return <code className="bg-muted px-1 rounded">{"{ content: string }"}</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3" /> Image Generation Webhook URL
                </Label>
                <Input
                  value={imageWebhookUrl}
                  onChange={e => { setImageWebhookUrl(e.target.value); markDirty(); }}
                  placeholder="https://your-n8n.app/webhook/ai-image"
                  className="h-9 text-sm font-mono"
                  data-testid="input-image-webhook"
                />
                <p className="text-[11px] text-muted-foreground">
                  Receives POST: <code className="bg-muted px-1 rounded">{"{ prompt }"}</code>. Must return <code className="bg-muted px-1 rounded">{"{ urls: string[] }"}</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Webhook URLs must be publicly accessible. Use HTTPS. Your webhook must respond within 30 seconds.</span>
            </div>
          </div>
        )}

        {/* Save button (bottom) */}
        <div className="flex items-center gap-3 pt-2 pb-8">
          <Button
            onClick={() => saveSettings.mutate()}
            disabled={saveSettings.isPending || !isDirty}
            data-testid="button-save-ai-settings-bottom"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saveSettings.isPending ? "Saving…" : "Save Changes"}
          </Button>
          {!isDirty && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> All changes saved
            </span>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
