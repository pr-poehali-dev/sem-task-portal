import { useEffect, useState } from 'react';
import {
  getUsers, createUser, updateUser, deleteUser, toggleUserChat, createTask, RANKS, User,
} from '@/lib/api';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Props {
  onChanged: () => void;
}

const AdminSection = ({ onChanged }: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<'task' | 'users'>('task');

  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tRank, setTRank] = useState(RANKS[0]);
  const [tAssign, setTAssign] = useState('all');
  const [tSaving, setTSaving] = useState(false);

  const [nUser, setNUser] = useState('');
  const [nPass, setNPass] = useState('');
  const [nRank, setNRank] = useState(RANKS[0]);
  const [uSaving, setUSaving] = useState(false);

  const loadUsers = () => getUsers().then(setUsers).catch((e) => toast.error(e.message));
  useEffect(() => { loadUsers(); }, []);

  const allRanks = Array.from(new Set([...RANKS, ...users.map((u) => u.rank)])).filter((r) => r !== 'Владелец');

  const submitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return toast.error('Введите название');
    setTSaving(true);
    try {
      await createTask({
        title: tTitle.trim(),
        description: tDesc.trim(),
        target_rank: tRank,
        assigned_user_id: tAssign === 'all' ? null : Number(tAssign),
      });
      toast.success('Заказ создан и разослан специалистам');
      setTTitle(''); setTDesc('');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setTSaving(false);
    }
  };

  const submitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nUser.trim() || !nPass) return toast.error('Заполните логин и пароль');
    setUSaving(true);
    try {
      await createUser({ username: nUser.trim(), password: nPass, rank: nRank });
      toast.success('Аккаунт создан');
      setNUser(''); setNPass('');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setUSaving(false);
    }
  };

  const changeRank = async (id: number, rank: string) => {
    try {
      await updateUser({ id, rank });
      toast.success('Ранг обновлён');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (!confirm(`Удалить аккаунт ${username}? Это действие нельзя отменить.`)) return;
    try {
      await deleteUser(id);
      toast.success(`Аккаунт ${username} удалён`);
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleToggleChat = async (id: number, disabled: boolean) => {
    try {
      await toggleUserChat(id, disabled);
      toast.success(disabled ? 'Чат заблокирован' : 'Чат разблокирован');
      loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const teamUsers = users.filter((u) => u.rank === tRank && !u.is_owner);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Управление</h2>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('task')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'task' ? 'bg-gradient-to-r from-primary to-accent text-white' : 'bg-secondary/60'
          }`}
        >
          <Icon name="Plus" size={16} className="inline mr-1" /> Новый заказ
        </button>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'users' ? 'bg-gradient-to-r from-primary to-accent text-white' : 'bg-secondary/60'
          }`}
        >
          <Icon name="Users" size={16} className="inline mr-1" /> Аккаунты
        </button>
      </div>

      {tab === 'task' && (
        <form onSubmit={submitTask} className="glass rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label>Название заказа</Label>
            <Input value={tTitle} onChange={(e) => setTTitle(e.target.value)} placeholder="Например: Снять рекламный ролик" className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label>Описание</Label>
            <Textarea value={tDesc} onChange={(e) => setTDesc(e.target.value)} placeholder="Детали задания..." className="bg-secondary/50 min-h-24" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Специальность</Label>
              <Select value={tRank} onValueChange={(v) => { setTRank(v); setTAssign('all'); }}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allRanks.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <Select value={tAssign} onValueChange={setTAssign}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всем специалистам</SelectItem>
                  {teamUsers.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={tSaving} className="w-full bg-gradient-to-r from-primary to-accent">
            {tSaving ? <Icon name="Loader2" size={18} className="animate-spin" /> : <><Icon name="Send" size={18} className="mr-2" /> Отправить заказ</>}
          </Button>
        </form>
      )}

      {tab === 'users' && (
        <div className="space-y-6">
          <form onSubmit={submitUser} className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold">Создать аккаунт</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Логин</Label>
                <Input value={nUser} onChange={(e) => setNUser(e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Пароль</Label>
                <Input value={nPass} onChange={(e) => setNPass(e.target.value)} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <Label>Ранг</Label>
                <Select value={nRank} onValueChange={setNRank}>
                  <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RANKS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={uSaving} className="bg-gradient-to-r from-primary to-accent">
              {uSaving ? <Icon name="Loader2" size={18} className="animate-spin" /> : <><Icon name="UserPlus" size={18} className="mr-2" /> Создать</>}
            </Button>
          </form>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Участники и ранги</h3>
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shrink-0">
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-1">
                      {u.username}
                      {u.is_owner && <Icon name="Crown" size={14} className="text-amber-400" />}
                    </div>
                  </div>
                  {u.is_owner ? (
                    <span className="text-sm text-muted-foreground px-3">Владелец</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select value={u.rank} onValueChange={(v) => changeRank(u.id, v)}>
                        <SelectTrigger className="w-36 bg-secondary/60"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from(new Set([...RANKS, u.rank])).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => handleToggleChat(u.id, !u.chat_disabled)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          u.chat_disabled
                            ? 'bg-destructive/30 text-destructive hover:bg-destructive/50'
                            : 'bg-secondary/60 text-muted-foreground hover:bg-accent/20 hover:text-accent'
                        }`}
                        title={u.chat_disabled ? 'Разблокировать чат' : 'Заблокировать чат'}
                      >
                        <Icon name={u.chat_disabled ? 'MessageSquareOff' : 'MessageSquare'} size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="w-8 h-8 rounded-lg bg-destructive/20 hover:bg-destructive/60 text-destructive flex items-center justify-center transition-colors shrink-0"
                        title="Удалить аккаунт"
                      >
                        <Icon name="Trash2" size={15} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSection;