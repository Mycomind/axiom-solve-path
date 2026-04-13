import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Message = { role: 'user' | 'assistant'; content: string };

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  problem_id: string | null;
  updated_at: string;
};

export function useCoachConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const active = conversations.find(c => c.id === activeId) ?? null;

  // Load conversation list on mount
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from('coach_conversations')
      .select('id, title, messages, problem_id, updated_at')
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const typed = data.map(d => ({
            ...d,
            messages: (d.messages as unknown as Message[]) ?? [],
          }));
          setConversations(typed);
          if (typed.length > 0 && !activeId) setActiveId(typed[0].id);
        }
        setLoading(false);
      });
  }, [userId]);

  const createConversation = useCallback(async (problemId?: string | null) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('coach_conversations')
      .insert({ user_id: userId, title: 'New Conversation', messages: [], problem_id: problemId ?? null })
      .select('id, title, messages, problem_id, updated_at')
      .single();
    if (error || !data) return null;
    const conv: Conversation = { ...data, messages: [] };
    setConversations(prev => [conv, ...prev]);
    setActiveId(conv.id);
    return conv;
  }, [userId]);

  const saveMessages = useCallback((convId: string, messages: Message[], title?: string) => {
    // Update local state immediately
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, messages, ...(title ? { title } : {}), updated_at: new Date().toISOString() } : c)
    );
    // Debounce DB write
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const update: Record<string, unknown> = { messages: JSON.stringify(messages) };
      if (title) update.title = title;
      supabase.from('coach_conversations').update(update).eq('id', convId).then(() => {});
    }, 800);
  }, []);

  const deleteConversation = useCallback(async (convId: string) => {
    await supabase.from('coach_conversations').delete().eq('id', convId);
    setConversations(prev => {
      const next = prev.filter(c => c.id !== convId);
      if (activeId === convId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  }, [activeId]);

  return {
    conversations,
    active,
    activeId,
    setActiveId,
    loading,
    createConversation,
    saveMessages,
    deleteConversation,
  };
}
