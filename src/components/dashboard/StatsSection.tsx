import { Task } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  tasks: Task[];
}

const StatsSection = ({ tasks }: Props) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const newCount = tasks.filter((t) => t.status === 'new').length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const byRank: Record<string, number> = {};
  tasks.forEach((t) => {
    byRank[t.target_rank] = (byRank[t.target_rank] || 0) + 1;
  });
  const maxRank = Math.max(1, ...Object.values(byRank));

  const cards = [
    { label: 'Всего задач', value: total, icon: 'Layers', color: 'from-primary to-accent' },
    { label: 'Новые', value: newCount, icon: 'Sparkles', color: 'from-purple-500 to-pink-500' },
    { label: 'В работе', value: inProgress, icon: 'Loader', color: 'from-accent to-cyan-400' },
    { label: 'Завершено', value: done, icon: 'CheckCircle2', color: 'from-emerald-500 to-teal-400' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Статистика</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5 card-hover">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
              <Icon name={c.icon} size={20} className="text-white" />
            </div>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="text-sm text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">Прогресс выполнения</span>
          <span className="text-gradient font-bold text-xl">{pct}%</span>
        </div>
        <div className="h-4 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {Object.keys(byRank).length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Задачи по специальностям</h3>
          <div className="space-y-3">
            {Object.entries(byRank).map(([rank, count]) => (
              <div key={rank}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{rank}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-primary"
                    style={{ width: `${(count / maxRank) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSection;
