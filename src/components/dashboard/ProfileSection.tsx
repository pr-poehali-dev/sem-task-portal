import { Task, User } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  me: User;
  tasks: Task[];
}

const ProfileSection = ({ me, tasks }: Props) => {
  const myDone = tasks.filter((t) => t.status === 'done').length;
  const myActive = tasks.filter((t) => t.status !== 'done').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Профиль</h2>

      <div className="glass rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white">
            {me.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-2xl font-bold">{me.username}</h3>
            <span className="inline-flex items-center gap-1 mt-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold">
              <Icon name={me.is_owner ? 'Crown' : 'Briefcase'} size={14} />
              {me.rank}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-6">
          <Icon name="Activity" size={24} className="text-primary mb-2" />
          <div className="text-3xl font-bold">{myActive}</div>
          <div className="text-sm text-muted-foreground">Активных задач</div>
        </div>
        <div className="glass rounded-2xl p-6">
          <Icon name="Trophy" size={24} className="text-emerald-400 mb-2" />
          <div className="text-3xl font-bold">{myDone}</div>
          <div className="text-sm text-muted-foreground">Выполнено</div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-2">
            <Icon name="User" size={18} /> Логин
          </span>
          <span className="font-semibold">{me.username}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-2">
            <Icon name="Shield" size={18} /> Ранг
          </span>
          <span className="font-semibold">{me.rank}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;
