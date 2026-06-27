import { useEffect, useRef, useState, useCallback } from 'react';
import { getChatMessages, sendChatMessage, ChatMessage } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const ChatSection = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await getChatMessages();
      setMessages(data.messages);
      setMeId(data.me_id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка чата');
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendChatMessage(text.trim());
      setText('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(e as unknown as React.FormEvent);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  };

  const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((acc, msg) => {
    const date = formatDate(msg.created_at);
    const last = acc[acc.length - 1];
    if (last && last.date === date) {
      last.msgs.push(msg);
    } else {
      acc.push({ date, msgs: [msg] });
    }
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <h2 className="text-2xl font-display font-bold mb-4 shrink-0">Командный чат</h2>

      <div className="flex-1 overflow-y-auto glass rounded-2xl p-4 space-y-1 mb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <Icon name="MessageSquare" size={48} />
            <p>Начните общение с командой!</p>
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border/40" />
              <span className="text-xs text-muted-foreground">{group.date}</span>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {group.msgs.map((msg, i) => {
              const isMe = msg.user_id === meId;
              const prevMsg = group.msgs[i - 1];
              const showAvatar = !prevMsg || prevMsg.user_id !== msg.user_id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
                >
                  {!isMe && (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}>
                      {msg.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {showAvatar && !isMe && (
                      <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.username}</span>
                    )}
                    <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      isMe
                        ? 'bg-gradient-to-br from-primary to-accent text-white rounded-br-sm'
                        : 'bg-secondary/70 rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 mx-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 shrink-0">
        <div className="flex-1 glass rounded-2xl flex items-center px-4 py-2 gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Написать сообщение... (Enter — отправить)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground max-h-32"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity hover:opacity-90"
        >
          {sending
            ? <Icon name="Loader2" size={20} className="animate-spin text-white" />
            : <Icon name="Send" size={20} className="text-white" />
          }
        </button>
      </form>
    </div>
  );
};

export default ChatSection;
