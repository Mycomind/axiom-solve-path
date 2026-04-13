import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCoachConversations } from '@/hooks/useCoachConversations';
import { ConversationList } from '@/components/coach/ConversationList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Message = { role: 'user' | 'assistant'; content: string };
type ProblemSummary = { id: string; title: string; problem_statement: string; status: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

const STARTER_PROMPTS = [
  { text: "I have a problem I can't figure out", icon: "🧩" },
  { text: "Help me find the root cause of an issue", icon: "🔍" },
  { text: "I need to evaluate trade-offs between solutions", icon: "⚖️" },
  { text: "Create an execution plan for my solution", icon: "📋" },
];

async function streamChat({
  messages, session, problemContext, onDelta, onDone, onError,
}: {
  messages: Message[];
  session: any;
  problemContext?: { title: string; statement?: string; status?: string };
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ messages, problemContext }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
      onError(err.error || `Error ${resp.status}`);
      return;
    }
    if (!resp.body) { onError("No response stream"); return; }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }
    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : 'Connection failed');
  }
}

export default function AICoach() {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [problems, setProblems] = useState<ProblemSummary[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<ProblemSummary | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { session } = useAuth();

  const {
    conversations, active, activeId, setActiveId,
    loading, createConversation, saveMessages, deleteConversation,
  } = useCoachConversations(session?.user?.id);

  const messages = active?.messages ?? [];

  useEffect(() => {
    if (!session) return;
    supabase
      .from('problems')
      .select('id, title, problem_statement, status')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setProblems(data as ProblemSummary[]); });
  }, [session]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const ensureConversation = async () => {
    if (activeId) return activeId;
    const conv = await createConversation(selectedProblem?.id);
    return conv?.id ?? null;
  };

  const send = async (text: string) => {
    if (!text.trim() || isStreaming || !session) return;
    const convId = await ensureConversation();
    if (!convId) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];

    // Auto-title from first user message
    const isFirst = messages.length === 0;
    const title = isFirst ? text.trim().slice(0, 60) : undefined;
    saveMessages(convId, newMessages, title);

    setInput('');
    setIsStreaming(true);

    let assistantContent = "";
    const upsert = (chunk: string) => {
      assistantContent += chunk;
      const updated = [...newMessages, { role: 'assistant' as const, content: assistantContent }];
      saveMessages(convId, updated);
    };

    const problemContext = selectedProblem
      ? { title: selectedProblem.title, statement: selectedProblem.problem_statement, status: selectedProblem.status }
      : undefined;

    await streamChat({
      messages: newMessages,
      session,
      problemContext,
      onDelta: upsert,
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        upsert(`\n\n⚠️ ${err}`);
        setIsStreaming(false);
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const handleNewChat = async () => {
    await createConversation(selectedProblem?.id);
  };

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      intake: 'bg-blue-500/20 text-blue-400',
      solution: 'bg-yellow-500/20 text-yellow-400',
      execution: 'bg-orange-500/20 text-orange-400',
      monitoring: 'bg-purple-500/20 text-purple-400',
      completed: 'bg-green-500/20 text-green-400',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-2rem)] max-w-5xl mx-auto">
        {/* Conversation Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden flex-shrink-0"
            >
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={setActiveId}
                onNew={handleNewChat}
                onDelete={deleteConversation}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(v => !v)} className="h-8 w-8">
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground">AI Problem Coach</h1>
              <p className="text-[10px] text-muted-foreground">Ruthless clarity. Zero fluff.</p>
            </div>

            {problems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="max-w-[200px] gap-1.5 text-xs truncate">
                    {selectedProblem ? <span className="truncate">{selectedProblem.title}</span> : <span className="text-muted-foreground">Link a problem</span>}
                    <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  {selectedProblem && (
                    <DropdownMenuItem onClick={() => setSelectedProblem(null)} className="text-muted-foreground text-xs">Clear selection</DropdownMenuItem>
                  )}
                  {problems.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => setSelectedProblem(p)} className={cn("flex items-center gap-2", selectedProblem?.id === p.id && "bg-accent")}>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", statusColor(p.status))}>{p.status}</span>
                      <span className="truncate text-sm">{p.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Context Banner */}
          <AnimatePresence>
            {selectedProblem && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-border">
                <div className="px-4 py-2 bg-primary/5 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Context:</span>
                  <span className="font-medium text-foreground truncate">{selectedProblem.title}</span>
                  <span className={cn("px-1.5 py-0.5 rounded-full font-medium", statusColor(selectedProblem.status))}>{selectedProblem.status}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 neon-glow">
                    <Bot className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">What problem are we crushing today?</h2>
                  <p className="text-muted-foreground max-w-md">
                    {selectedProblem
                      ? `I'm ready to help with "${selectedProblem.title}". Ask me anything about it.`
                      : "I'll challenge your assumptions, dig for root causes, and help you build a bulletproof plan."}
                  </p>
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {STARTER_PROMPTS.map((p, i) => (
                    <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => send(p.text)}
                      className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all text-left group">
                      <span className="text-xl">{p.icon}</span>
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{p.text}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={cn("max-w-[80%] rounded-2xl px-4 py-3",
                      msg.role === 'user' ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary/70 text-foreground rounded-bl-md")}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_strong]:text-primary [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:rounded">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary/70 rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex gap-2 items-end">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={selectedProblem ? `Ask about "${selectedProblem.title}"...` : "Describe your problem..."}
                rows={1} className="flex-1 resize-none rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent max-h-32"
                style={{ minHeight: '44px' }} disabled={isStreaming} />
              <Button onClick={() => send(input)} disabled={!input.trim() || isStreaming} size="icon" className="rounded-xl h-11 w-11">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">AI Coach may make mistakes. Verify important decisions independently.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
