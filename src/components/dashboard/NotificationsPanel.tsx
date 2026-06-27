import { Notification } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
}

const NotificationsPanel = ({ open, onClose, notifications }: Props) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm h-full glass border-l border-border/40 p-6 overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold flex items-center gap-2">
            <Icon name="Bell" size={22} /> Уведомления
          </h3>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-secondary/60 flex items-center justify-center">
            <Icon name="X" size={20} />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="BellOff" size={40} className="mx-auto mb-3" />
            Уведомлений пока нет
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`rounded-xl p-4 ${n.is_read ? 'bg-secondary/40' : 'bg-primary/15 border border-primary/30'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Icon name="Package" size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;
