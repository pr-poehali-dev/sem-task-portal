import { Task, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  me: User;
  tasks: Task[];
  onGo: (s: 'tasks') => void;
}

const HomeSection = ({ me, tasks, onGo }: Props) => {
  const active = tasks.filter((t) => t.status !== 'done').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;

  const stats = [
    { label: 'Активные', value: active, icon: 'Flame', color: 'from-primary to-accent' },
    { label: 'В работе', value: inProgress, icon: 'Loader', color: 'from-accent to-primary' },
    { label: 'Завершено', value: done, icon: 'CheckCircle2', color: 'from-emerald-500 to-teal-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        <h1 className="text-3xl font-display font-bold mb-1">
          Привет, <span className="text-gradient">{me.username}</span>!
        </h1>
        <p className="text-muted-foreground">
          {me.is_owner
            ? 'Вы владелец платформы. Создавайте заказы и управляйте командой.'
            : `Ваша роль: ${me.rank}. Здесь появляются заказы для вас.`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6 card-hover">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4`}>
              <Icon name={s.icon} size={24} className="text-white" />
            </div>
            <div className="text-4xl font-bold">{s.value}</div>
            <div className="text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onGo('tasks')}
        className="w-full glass rounded-2xl p-6 flex items-center justify-between card-hover group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Icon name="ListTodo" size={24} className="text-white" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-lg">Перейти к задачам</div>
            <div className="text-muted-foreground text-sm">{active} активных заказов</div>
          </div>
        </div>
        <Icon name="ArrowRight" size={24} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

export default HomeSection;
