import { Task, User, cancelTask } from '@/lib/api';
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
    <div className="space-y-4">
      <h2 className="text-2xl font-display font-bold">Задачи</h2>
      {tasks.map((task) => {
        const sm = statusMeta[task.status] ?? statusMeta.new;
        const isCancelled = task.status === 'cancelled';
        return (
          <div key={task.id} className={`glass rounded-2xl p-6 card-hover ${isCancelled ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className={`text-lg font-semibold ${isCancelled ? 'line-through' : ''}`}>{task.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Icon name="Tag" size={14} />
                  {task.target_rank}
                  {task.assigned_username && (
                    <>
                      <span>•</span>
                      <Icon name="User" size={14} />
                      {task.assigned_username}
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
              <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{task.description}</p>
            )}

            <div className="flex gap-2 flex-wrap">
              {/* Кнопки для сотрудников */}
              {!me.is_owner && !isCancelled && (
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
                      onClick={() => onStatus(task.id, 'done')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Icon name="Check" size={16} className="mr-1" /> Завершить
                    </Button>
                  )}
                  {task.status === 'done' && (
                    <span className="text-sm text-emerald-400 flex items-center gap-1">
                      <Icon name="CheckCircle2" size={16} /> Выполнено
                    </span>
                  )}
                </>
              )}

              {/* Кнопки для владельца */}
              {me.is_owner && !isCancelled && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleCancel(task.id)}
                  className="ml-auto"
                >
                  <Icon name="X" size={16} className="mr-1" /> Отменить заказ
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TasksSection;
