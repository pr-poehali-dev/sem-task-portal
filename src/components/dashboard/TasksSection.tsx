import { useState } from 'react';
import { Task, User, cancelTask, doneWithLink, acceptTask } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  me: User;
  tasks: Task[];
  onStatus: (id: number, status: string) => void;
  onRefresh: () => void;
}

const statusMeta: Record<string, { label: string; cls: string; icon: string }> = {
  new: { label: 'Новый', cls: 'bg-primary/20 text-primary', icon: 'Sparkles' },
  in_progress: { label: 'В работе', cls: 'bg-accent/20 text-accent', icon: 'Loader' },
  done: { label: 'Готово', cls: 'bg-emerald-500/20 text-emerald-400', icon: 'CheckCircle2' },
  cancelled: { label: 'Отменён', cls: 'bg-destructive/20 text-destructive', icon: 'XCircle' },
};

const TasksSection = ({ me, tasks, onStatus, onRefresh }: Props) => {
  const [linkModal, setLinkModal] = useState<{ taskId: number } | null>(null);
  const [linkValue, setLinkValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async (id: number) => {
    if (!confirm('Отменить этот заказ?')) return;
    try {
      await cancelTask(id);
      toast.success('Заказ отменён');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await acceptTask(id);
      toast.success('Заказ принят и закрыт');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const openLinkModal = (taskId: number) => {
    setLinkValue('');
    setLinkModal({ taskId });
  };

  const submitDone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModal) return;
    if (!linkValue.trim()) {
      toast.error('Вставьте ссылку на Яндекс Диск');
      return;
    }
    setSubmitting(true);
    try {
      await doneWithLink(linkModal.taskId, linkValue.trim());
      toast.success('Заказ завершён! Ссылка отправлена владельцу.');
      setLinkModal(null);
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="glass rounded-3xl p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-secondary/60 flex items-center justify-center mx-auto mb-4">
          <Icon name="Inbox" size={40} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Пока нет задач</h2>
        <p className="text-muted-foreground">
          {me.is_owner
            ? 'Создайте первый заказ во вкладке «Управление».'
            : 'Новые заказы появятся здесь, когда их назначит владелец.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-2xl font-display font-bold">Задачи</h2>
        {tasks.map((task) => {
          const sm = statusMeta[task.status] ?? statusMeta.new;
          const isCancelled = task.status === 'cancelled';
          const isAccepted = task.is_accepted;

          return (
            <div key={task.id} className={`glass rounded-2xl p-6 card-hover ${isCancelled || isAccepted ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className={`text-lg font-semibold ${isCancelled ? 'line-through' : ''}`}>{task.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                    <Icon name="Tag" size={14} />
                    {task.target_rank}
                    {task.assigned_username && (
                      <>
                        <span>•</span>
                        <Icon name="User" size={14} />
                        {task.assigned_username}
                      </>
                    )}
                    {isAccepted && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Icon name="BadgeCheck" size={13} /> Принят
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${sm.cls}`}>
                  <Icon name={sm.icon} size={14} />
                  {sm.label}
                </span>
              </div>

              {task.description && (
                <p className="text-muted-foreground mb-3 whitespace-pre-wrap text-sm">{task.description}</p>
              )}

              {task.completion_link && (
                <a
                  href={task.completion_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline mb-3"
                >
                  <Icon name="Link" size={14} /> Ссылка на файлы
                </a>
              )}

              {!isCancelled && !isAccepted && (
                <div className="flex gap-2 flex-wrap mt-1">
                  {/* Кнопки для сотрудников */}
                  {!me.is_owner && (
                    <>
                      {task.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => onStatus(task.id, 'in_progress')}
                          className="bg-gradient-to-r from-primary to-accent text-white"
                        >
                          <Icon name="Play" size={16} className="mr-1" /> Взять в работу
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => openLinkModal(task.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Icon name="CheckCheck" size={16} className="mr-1" /> Завершить
                        </Button>
                      )}
                      {task.status === 'done' && (
                        <span className="text-sm text-emerald-400 flex items-center gap-1">
                          <Icon name="Clock" size={15} /> Ждём проверки владельца
                        </span>
                      )}
                    </>
                  )}

                  {/* Кнопки для владельца */}
                  {me.is_owner && (
                    <div className="flex gap-2 ml-auto">
                      {task.status === 'done' && (
                        <Button
                          size="sm"
                          onClick={() => handleAccept(task.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Icon name="BadgeCheck" size={16} className="mr-1" /> Принять заказ
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(task.id)}
                      >
                        <Icon name="X" size={16} className="mr-1" /> Отменить
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Модалка ввода ссылки на Яндекс Диск */}
      {linkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setLinkModal(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <form
            onSubmit={submitDone}
            className="relative glass rounded-3xl p-8 w-full max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                <Icon name="Link" size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Завершение заказа</h3>
                <p className="text-sm text-muted-foreground">Прикрепите ссылку на файлы</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-muted-foreground">Ссылка на Яндекс Диск</label>
              <input
                type="url"
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                placeholder="https://disk.yandex.ru/d/..."
                autoFocus
                className="w-full h-12 bg-secondary/50 border border-border rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">
                Убедитесь, что ссылка открыта для просмотра
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setLinkModal(null)}
                className="flex-1 h-11 rounded-xl bg-secondary/60 hover:bg-secondary text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-400 text-white"
              >
                {submitting
                  ? <Icon name="Loader2" size={18} className="animate-spin" />
                  : <><Icon name="Send" size={16} className="mr-1" /> Отправить</>}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default TasksSection;
