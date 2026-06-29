import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getPrivateMessages, getDialogs, sendPrivateMessage,
  getUsers, PrivateMessage, Dialog, User,
} from '@/lib/api';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Props {
  me: User;
}

const PrivateChatSection = ({ me }: Props) => {
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [meId, setMeId] = useState<number>(me.id);
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadDialogs = useCallback(async () => {
    if (!me.is_owner) return;
    try {
      const data = await getDialogs();
      setDialogs(data.dialogs);
    } catch (e) { void e; }
  }, [me.is_owner]);

  const loadMessages = useCallback(async (pid: number) => {
    try {
      const data = await getPrivateMessages(pid);
      setMessages(data.messages);
      setMeId(data.me_id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка чата');
    }
  }, []);

  useEffect(() => {
    if (me.is_owner) {
      loadDialogs();
      getUsers().then(us => {
        setUsers(us.filter(u => !u.is_owner));
      }).catch(() => {});
    } else {
      getUsers().then(us => {
        const owner = us.find(u => u.is_owner);
        if (owner) {
          setOwnerId(owner.id);
          setPartnerId(owner.id);
          setPartnerName(owner.username);
          loadMessages(owner.id);
        }
      }).catch(() => {});
    }
  }, [me.is_owner, loadDialogs, loadMessages]);

  useEffect(() => {
    if (!partnerId) return;
    const iv = setInterval(() => {
      loadMessages(partnerId);
      if (me.is_owner) loadDialogs();
    }, 4000);
    return () => clearInterval(iv);
  }, [partnerId, loadMessages, loadDialogs, me.is_owner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectPartner = (id: number, name: string) => {
    setPartnerId(id);
    setPartnerName(name);
    loadMessages(id);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !partnerId) return;
    setSending(true);
    try {
      await sendPrivateMessage(partnerId, text.trim());
      setText('');
      await loadMessages(partnerId);
      if (me.is_owner) loadDialogs();
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

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (!me.is_owner && !ownerId) {
    return (
      <div className="glass rounded-3xl p-12 text-center text-muted-foreground">
        <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
        Загрузка...
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] gap-4">
      {/* Список диалогов — только владелец */}
      {me.is_owner && (
        <div className="w-56 shrink-0 glass rounded-2xl p-3 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs text-muted-foreground font-semibold uppercase px-2 py-1">Диалоги</p>
          {users.length === 0 && (
            <p className="text-xs text-muted-foreground px-2">Нет сотрудников</p>
          )}
          {users.map(u => {
            const dlg = dialogs.find(d => d.partner_id === u.id);
            const isActive = partnerId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => selectPartner(u.id, u.username)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                  isActive ? 'bg-gradient-to-r from-primary to-accent text-white' : 'hover:bg-secondary/60'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-xs font-bold shrink-0">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{u.username}</div>
                  {dlg && (
                    <div className="text-[10px] truncate opacity-70">{dlg.last_message}</div>
                  )}
                </div>
                {dlg?.has_unread && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Окно чата */}
      <div className="flex-1 flex flex-col min-w-0">
        {!partnerId ? (
          <div className="flex-1 glass rounded-2xl flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Icon name="MessageCircle" size={48} />
            <p>Выберите собеседника</p>
          </div>
        ) : (
          <>
            <div className="glass rounded-t-2xl px-5 py-3 flex items-center gap-3 border-b border-border/30">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{partnerName}</p>
                <p className="text-xs text-muted-foreground">Личные сообщения</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto glass rounded-b-none p-4 space-y-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 opacity-60">
                  <Icon name="MessageSquareDashed" size={36} />
                  <p className="text-sm">Начните переписку</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.from_user_id === meId;
                const prev = messages[i - 1];
                const showName = !prev || prev.from_user_id !== msg.from_user_id;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${showName ? 'mt-3' : 'mt-0.5'}`}>
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      {showName && !isMe && (
                        <span className="text-xs text-muted-foreground mb-1 ml-1">{msg.from_username}</span>
                      )}
                      <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-gradient-to-br from-primary to-accent text-white rounded-br-sm'
                          : 'bg-secondary/70 rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5 mx-1">{fmtTime(msg.created_at)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex gap-2 pt-3">
              <div className="flex-1 glass rounded-2xl flex items-center px-4 py-2">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Сообщение... (Enter — отправить)"
                  rows={1}
                  className="flex-1 bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground max-h-28"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {sending
                  ? <Icon name="Loader2" size={20} className="animate-spin text-white" />
                  : <Icon name="Send" size={20} className="text-white" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PrivateChatSection;