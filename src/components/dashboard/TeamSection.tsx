import { useEffect, useState } from 'react';
import { getUsers, User } from '@/lib/api';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const TeamSection = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-display font-bold">Команда</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {users.map((u) => (
          <div key={u.id} className="glass rounded-2xl p-5 card-hover flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-white shrink-0">
              {u.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold flex items-center gap-1">
                {u.username}
                {u.is_owner && <Icon name="Crown" size={16} className="text-amber-400" />}
              </div>
              <div className="text-sm text-muted-foreground">{u.rank}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamSection;
