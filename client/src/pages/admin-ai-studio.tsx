import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Send, Plus, Trash2, Bookmark, BookmarkCheck, Loader2,
  Image as ImageIcon, FileText, Sparkles, Settings2, ChevronRight,
  Copy, Check, RefreshCw, Zap, Bot, User as UserIcon,
  BookOpen, Moon, Lightbulb, Library, X, Download,
  PenLine, RotateCcw, MessageSquare, PanelLeftClose, PanelLeftOpen,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AiModel = {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  type: string;
  isActive: boolean;
  isDefault: boolean;
};

type AiConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type AiMessage = {
  id: string;
  role: string;
  content: string;
  imageUrl?: string | null;
  bookmarked: boolean;
  createdAt: string;
};

type ConversationWithMessages = AiConversation & { messages: AiMessage[] };

type ContentType = "story" | "motivational-story" | "dua" | "book";

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ElementType }[] = [
  { value: "story", label: "Story / Article", icon: Library },
  { value: "motivational-story", label: "Motivational Story", icon: Lightbulb },
  { value: "dua", label: "Dua", icon: Moon },
  { value: "book", label: "Book", icon: BookOpen },
];

const TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "storytelling", label: "Storytelling" },
  { value: "islamic", label: "Islamic Tone" },
];

function MessageBubble({
  msg,
  onBookmark,
  onCopy,
}: {
  msg: AiMessage;
  onBookmark: (id: string) => void;
  onCopy: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === "user";
  const isError = msg.role === "error";

  const handleCopy = () => {
    onCopy(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isError) {
    return (
      <div className="flex gap-3 px-4 py-2">
        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1 bg-destructive/5 border border-destructive/20 rounded-xl rounded-tl-sm px-4 py-3 text-sm text-destructive leading-relaxed">
          <p className="font-medium mb-0.5">Error</p>
          <p className="text-destructive/80">{msg.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group flex gap-3 px-4 py-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted border")}>
        {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
      </div>
      <div className={cn("flex flex-col max-w-[80%]", isUser ? "items-end" : "items-start")}>
        {msg.imageUrl && (
          <img
            src={msg.imageUrl}
            alt="Generated"
            className="rounded-xl max-w-xs mb-2 border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.imageUrl!, "_blank")}
          />
        )}
        {msg.content && (
          <div className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted/60 border rounded-tl-sm text-foreground")}>
            {msg.content}
          </div>
        )}
        <div className={cn("flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "flex-row-reverse" : "flex-row")}>
          <button
            onClick={handleCopy}
            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Copy"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {!isUser && (
            <button
              onClick={() => onBookmark(msg.id)}
              className={cn("p-1 rounded transition-colors", msg.bookmarked ? "text-amber-500" : "text-muted-foreground hover:text-amber-500")}
              title={msg.bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {msg.bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageCard({
  url,
  onSelect,
  selected,
  onDownload,
}: {
  url: string;
  onSelect: () => void;
  selected: boolean;
  onDownload: () => void;
}) {
  return (
    <div className={cn("relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all",
      selected ? "border-primary ring-2 ring-primary/20" : "border-muted hover:border-primary/50")}>
      <img src={url} alt="Generated" className="w-full aspect-square object-cover" onClick={onSelect} />
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={onDownload}
          className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          title="Download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        {selected && (
          <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAiStudioPage() {
  const { toast } = useToast();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedTextModel, setSelectedTextModel] = useState<string>("auto");
  const [selectedImageModel, setSelectedImageModel] = useState<string>("auto");
  const [tone, setTone] = useState("islamic");
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [publishTitle, setPublishTitle] = useState("");
  const [publishExcerpt, setPublishExcerpt] = useState("");
  const [publishType, setPublishType] = useState<ContentType>("story");
  const [publishCategoryId, setPublishCategoryId] = useState<string>("none");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [rightPanel, setRightPanel] = useState<"publish" | "images" | null>("publish");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("ai-sidebar-collapsed") === "true"; } catch { return false; }
  });

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("ai-sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: models = [] } = useQuery<AiModel[]>({
    queryKey: ["/api/admin/ai-models"],
  });

  const { data: integrationStatus } = useQuery<{
    enabled: boolean;
    systemMessage: string;
    textWebhookUrl: string;
    imageWebhookUrl: string;
  }>({
    queryKey: ["/api/admin/ai-integration-status"],
    staleTime: 30_000,
  });

  const { data: conversations = [], refetch: refetchConvs } = useQuery<AiConversation[]>({
    queryKey: ["/api/admin/ai-conversations"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories?type=all"],
  });

  const textModels = models.filter(m => m.type === "text" && m.isActive);
  const imageModels = models.filter(m => m.type === "image" && m.isActive);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/ai-conversations/${id}`, { credentials: "include" });
    if (!res.ok) return;
    const data: ConversationWithMessages = await res.json();
    setActiveConvId(id);
    setMessages(data.messages);
  }, []);

  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/ai-conversations", { title: "New Conversation" });
      return res as AiConversation;
    },
    onSuccess: () => { refetchConvs(); },
  });

  const clearChat = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
    setGeneratedImages([]);
    setSelectedImage(null);
    setPublishTitle("");
    setPublishExcerpt("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const deleteConversation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/ai-conversations/${id}`),
    onSuccess: () => {
      refetchConvs();
      if (activeConvId) {
        setActiveConvId(null);
        setMessages([]);
      }
    },
  });

  const bookmarkMessage = useMutation({
    mutationFn: async (id: string) => apiRequest("POST", `/api/admin/ai-messages/${id}/bookmark`),
    onSuccess: (updated: any) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, bookmarked: updated.bookmarked } : m));
    },
  });

  const getSystemPrompt = () => {
    if (integrationStatus?.systemMessage) return integrationStatus.systemMessage;
    const toneDescriptions: Record<string, string> = {
      formal: "formal and academic",
      storytelling: "engaging storytelling narrative",
      islamic: "respectful Islamic tone with appropriate Islamic phrases and references",
    };
    return `You are an expert Islamic content writer for "Stories of Light", an Islamic educational platform. Write in a ${toneDescriptions[tone] || "Islamic"} style. When writing articles, use clear headings (use ## for H2, ### for H3), proper paragraphs, and structure content professionally. Always maintain Islamic values, accuracy, and authenticity. Use phrases like "peace be upon him" (or ﷺ) when referring to the Prophet.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    let convId = activeConvId;
    if (!convId) {
      try {
        const conv = await createConversation.mutateAsync();
        convId = conv.id;
        setActiveConvId(conv.id);
      } catch {
        toast({ title: "Failed to start conversation", variant: "destructive" });
        return;
      }
    }

    const userMsg: AiMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      bookmarked: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input.trim();
    setInput("");
    setIsStreaming(true);

    try {
      const historyMessages = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content }));
      const systemPrompt = getSystemPrompt();

      let data: { content: string };

      const aiEnabled = integrationStatus?.enabled !== false;
      const textWebhook = integrationStatus?.textWebhookUrl;

      if (!aiEnabled && textWebhook) {
        const res = await fetch(textWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: currentInput,
            messages: [
              { role: "system", content: systemPrompt },
              ...historyMessages,
              { role: "user", content: currentInput },
            ],
            systemMessage: systemPrompt,
          }),
        });
        if (!res.ok) throw new Error("Webhook responded with an error");
        data = await res.json();
        if (!data.content) throw new Error("Webhook did not return content");
      } else {
        const payload = {
          modelId: selectedTextModel === "auto" ? undefined : selectedTextModel,
          conversationId: convId,
          messages: [
            { role: "system", content: systemPrompt },
            ...historyMessages,
            { role: "user", content: currentInput },
          ],
        };
        const res = await fetch("/api/admin/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "AI request failed");
        }
        data = await res.json();
      }
      const assistantMsg: AiMessage = {
        id: `temp-ai-${Date.now()}`,
        role: "assistant",
        content: data.content,
        bookmarked: false,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      refetchConvs();

      if (!publishTitle) {
        const firstLine = data.content.split("\n")[0].replace(/^#+\s*/, "").trim();
        if (firstLine && firstLine.length < 100) setPublishTitle(firstLine);
      }
    } catch (e: any) {
      const errorMsg: AiMessage = {
        id: `temp-err-${Date.now()}`,
        role: "error",
        content: e.message || "Something went wrong. Please try again.",
        bookmarked: false,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const generateImages = async () => {
    if (!input.trim() && !publishTitle) {
      toast({ title: "Enter a prompt or title first", variant: "destructive" });
      return;
    }
    setIsGeneratingImage(true);
    setGeneratedImages([]);
    setRightPanel("images");
    try {
      const prompt = input.trim() || `Islamic cover image for: ${publishTitle}. Beautiful, spiritual, high quality, no text.`;
      const aiEnabled = integrationStatus?.enabled !== false;
      const imageWebhook = integrationStatus?.imageWebhookUrl;

      let urls: string[] = [];

      if (!aiEnabled && imageWebhook) {
        const res = await fetch(imageWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error("Image webhook responded with an error");
        const data = await res.json();
        urls = data.urls || [];
      } else {
        const res = await fetch("/api/admin/ai-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            modelId: selectedImageModel === "auto" ? undefined : selectedImageModel,
            prompt,
            n: 4,
            size: "1024x1024",
          }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
        const data = await res.json();
        urls = data.urls || [];
      }

      setGeneratedImages(urls);
      if (input) setInput("");
    } catch (e: any) {
      toast({ title: "Image generation failed", description: e.message, variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const publishContent = useMutation({
    mutationFn: async () => {
      const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
      const content = lastAssistantMsg?.content || "";
      if (!publishTitle || !content) throw new Error("Need a title and generated content to publish");
      return apiRequest("POST", "/api/admin/ai-publish", {
        title: publishTitle,
        content,
        excerpt: publishExcerpt,
        contentType: publishType,
        categoryId: publishCategoryId === "none" ? undefined : publishCategoryId,
        thumbnail: selectedImage || undefined,
      }) as Promise<{ type: string; id: string; slug: string }>;
    },
    onSuccess: (data) => {
      toast({ title: "Published as draft!", description: `${publishType} saved. Go to the content list to review and publish.` });
      setPublishTitle("");
      setPublishExcerpt("");
    },
    onError: (e: any) => {
      toast({ title: "Publish failed", description: e.message, variant: "destructive" });
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (mode === "chat") sendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadImage = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-image-${Date.now()}.png`;
    a.click();
  };

  const bookmarkedMessages = messages.filter(m => m.bookmarked);

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-5rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden">

        {/* ── Left Sidebar: Conversation History ── */}
        <div className={cn(
          "shrink-0 border-r bg-muted/20 flex-col hidden lg:flex transition-all duration-300 ease-in-out overflow-hidden",
          sidebarCollapsed ? "w-12" : "w-60"
        )}>
          <div className="p-2 border-b flex items-center justify-between min-h-[44px]">
            {!sidebarCollapsed && <span className="text-sm font-semibold px-1">Conversations</span>}
            <div className={cn("flex items-center gap-1", sidebarCollapsed && "w-full justify-center")}>
              {!sidebarCollapsed && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={clearChat}
                  title="New conversation"
                  data-testid="button-new-conversation"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                data-testid="button-toggle-sidebar"
              >
                {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1 p-2">
              <button
                onClick={clearChat}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="New conversation"
                data-testid="button-new-conversation-collapsed"
              >
                <Plus className="w-4 h-4" />
              </button>
              {conversations.slice(0, 8).map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-xs font-medium",
                    activeConvId === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                  )}
                  title={conv.title}
                  data-testid={`link-conversation-collapsed-${conv.id}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {conversations.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6 px-2">No conversations yet. Start chatting!</p>
                )}
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer text-sm transition-colors",
                      activeConvId === conv.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => loadConversation(conv.id)}
                    data-testid={`link-conversation-${conv.id}`}
                  >
                    <span className="truncate flex-1 text-xs">{conv.title}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation.mutate(conv.id); }}
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:text-destructive transition-all"
                      data-testid={`button-delete-conversation-${conv.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* ── Center: Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-background shrink-0 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-sm truncate">
                {activeConvId ? conversations.find(c => c.id === activeConvId)?.title || "AI Studio" : "AI Content Studio"}
              </span>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setMode("chat")}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  mode === "chat" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                data-testid="button-mode-chat"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat
              </button>
              <button
                onClick={() => setMode("image")}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  mode === "image" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                data-testid="button-mode-image"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Image
              </button>
            </div>

            {/* Model Selector */}
            <Select
              value={mode === "chat" ? selectedTextModel : selectedImageModel}
              onValueChange={v => mode === "chat" ? setSelectedTextModel(v) : setSelectedImageModel(v)}
            >
              <SelectTrigger className="h-7 text-xs w-44" data-testid="select-ai-model">
                <Zap className="w-3 h-3 mr-1 text-primary shrink-0" />
                <SelectValue placeholder="Auto (default)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  Auto (default)
                </SelectItem>
                {(mode === "chat" ? textModels : imageModels).length === 0 ? (
                  <div className="px-2 py-2 text-xs text-muted-foreground">
                    No {mode === "chat" ? "text" : "image"} models configured.<br />
                    Go to Settings → AI Models.
                  </div>
                ) : (
                  (mode === "chat" ? textModels : imageModels).map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <span>{m.name}</span>
                      <span className="ml-1 text-muted-foreground capitalize">({m.provider})</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Tone (chat only) */}
            {mode === "chat" && (
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-7 text-xs w-36" data-testid="select-tone">
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Right panel toggles */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRightPanel(rightPanel === "publish" ? null : "publish")}
                className={cn("p-1.5 rounded-md text-xs font-medium transition-colors border",
                  rightPanel === "publish" ? "bg-primary/10 border-primary/30 text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}
                title="Publish Panel"
                data-testid="button-toggle-publish-panel"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setRightPanel(rightPanel === "images" ? null : "images")}
                className={cn("p-1.5 rounded-md text-xs font-medium transition-colors border",
                  rightPanel === "images" ? "bg-primary/10 border-primary/30 text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")}
                title="Generated Images"
                data-testid="button-toggle-images-panel"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 px-8 text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">AI Content Studio</h2>
                  <p className="text-muted-foreground text-sm max-w-md">
                    Generate Islamic articles, duas, and stories using AI. Ask me to write about any Islamic topic and I'll create structured, SEO-optimized content.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg mt-2">
                  {[
                    "Write about the life of Abu Bakr (RA)",
                    "Create a motivational story about patience in Islam",
                    "Write Dua for seeking forgiveness with explanation",
                    "Write about the Battle of Badr and its lessons",
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => { setInput(suggestion); textareaRef.current?.focus(); }}
                      className="text-left text-xs px-3 py-2.5 rounded-xl border hover:border-primary/50 hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-2">
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    onBookmark={(id) => bookmarkMessage.mutate(id)}
                    onCopy={copyToClipboard}
                  />
                ))}
                {isStreaming && (
                  <div className="flex gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted/60 border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Writing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-background shrink-0">
            {bookmarkedMessages.length > 0 && (
              <div className="mb-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>{bookmarkedMessages.length} message{bookmarkedMessages.length !== 1 ? "s" : ""} bookmarked for publishing</span>
              </div>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === "chat" ? "Write about the life of Umar ibn al-Khattab (RA)… (Enter to send, Shift+Enter for new line)" : "Describe the image you want to generate…"}
                className="resize-none text-sm min-h-[44px] max-h-32"
                rows={2}
                data-testid="input-ai-message"
              />
              <div className="flex flex-col gap-1.5 shrink-0">
                {mode === "chat" ? (
                  <Button
                    onClick={sendMessage}
                    disabled={isStreaming || !input.trim()}
                    size="icon"
                    className="h-9 w-9"
                    data-testid="button-send-message"
                  >
                    {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    onClick={generateImages}
                    disabled={isGeneratingImage || !input.trim()}
                    size="icon"
                    className="h-9 w-9"
                    data-testid="button-generate-image"
                  >
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={clearChat}
                  title="New conversation"
                  data-testid="button-new-chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        {rightPanel && (
          <div className="w-72 shrink-0 border-l bg-background flex flex-col">
            {rightPanel === "publish" && (
              <>
                <div className="flex items-center justify-between p-3 border-b">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary" /> Publish
                  </span>
                  <button onClick={() => setRightPanel(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Content Title</Label>
                      <Input
                        value={publishTitle}
                        onChange={e => setPublishTitle(e.target.value)}
                        placeholder="Enter title…"
                        className="text-sm h-8"
                        data-testid="input-publish-title"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Excerpt / Description</Label>
                      <Textarea
                        value={publishExcerpt}
                        onChange={e => setPublishExcerpt(e.target.value)}
                        placeholder="Short description…"
                        className="text-sm resize-none"
                        rows={3}
                        data-testid="input-publish-excerpt"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Content Type</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CONTENT_TYPES.map(ct => {
                          const Icon = ct.icon;
                          return (
                            <button
                              key={ct.value}
                              onClick={() => setPublishType(ct.value)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-medium transition-colors",
                                publishType === ct.value ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted border-border text-muted-foreground"
                              )}
                              data-testid={`button-content-type-${ct.value}`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{ct.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {(publishType === "story" || publishType === "motivational-story") && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select value={publishCategoryId} onValueChange={setPublishCategoryId}>
                          <SelectTrigger className="h-8 text-xs" data-testid="select-publish-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
                            {categories.filter(c => publishType === "story" ? c.type === "story" : c.type === "motivational-story").map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedImage && (
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Cover Image
                        </Label>
                        <div className="relative">
                          <img src={selectedImage} alt="Cover" className="w-full aspect-video object-cover rounded-lg border" />
                          <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        The last AI response will be saved as a draft. You can edit and publish it from the content management section.
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => publishContent.mutate()}
                        disabled={publishContent.isPending || !publishTitle || messages.filter(m => m.role === "assistant").length === 0}
                        data-testid="button-publish-content"
                      >
                        {publishContent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                        Save as Draft
                      </Button>
                    </div>

                    {bookmarkedMessages.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-xs flex items-center gap-1.5 mb-2">
                            <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
                            Bookmarked ({bookmarkedMessages.length})
                          </Label>
                          <div className="space-y-2">
                            {bookmarkedMessages.map(msg => (
                              <div key={msg.id} className="text-xs bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-muted-foreground line-clamp-3">
                                {msg.content}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}

            {rightPanel === "images" && (
              <>
                <div className="flex items-center justify-between p-3 border-b">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-primary" /> Generated Images
                  </span>
                  <button onClick={() => setRightPanel(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-3">
                    {isGeneratingImage && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Generating images…</p>
                      </div>
                    )}
                    {!isGeneratingImage && generatedImages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Switch to Image mode and generate images</p>
                      </div>
                    )}
                    {generatedImages.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">{generatedImages.length} images generated. Click to select as cover.</p>
                        <div className="grid grid-cols-2 gap-2">
                          {generatedImages.map((url, i) => (
                            <ImageCard
                              key={i}
                              url={url}
                              selected={selectedImage === url}
                              onSelect={() => { setSelectedImage(url); setRightPanel("publish"); }}
                              onDownload={() => downloadImage(url)}
                            />
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={generateImages}
                          disabled={isGeneratingImage}
                          data-testid="button-regenerate-images"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Generate More
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
