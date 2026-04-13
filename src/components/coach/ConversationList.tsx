import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type ConversationSummary = {
  id: string;
  title: string;
  updated_at: string;
};

interface Props {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className="flex flex-col h-full border-r border-border bg-secondary/30">
      <div className="p-3 border-b border-border">
        <Button onClick={onNew} variant="outline" size="sm" className="w-full gap-2 text-xs">
          <Plus className="w-3.5 h-3.5" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors group flex items-start gap-2",
              activeId === c.id
                ? "bg-primary/10 text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-xs">{c.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 transition-opacity"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No conversations yet</p>
        )}
      </div>
    </div>
  );
}
