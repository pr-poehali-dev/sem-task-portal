import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTasksData, updateTaskStatus, readNotifications,
  Task, Notification, User,
} from '@/lib/api';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import TasksSection from '@/components/dashboard/TasksSection';
import HomeSection from '@/components/dashboard/HomeSection';
import ProfileSection from '@/components/dashboard/ProfileSection';
import StatsSection from '@/components/dashboard/StatsSection';
import TeamSection from '@/components/dashboard/TeamSection';
import AdminSection from '@/components/dashboard/AdminSection';
import ChatSection from '@/components/dashboard/ChatSection';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';

type Section = 'home' | 'tasks' | 'chat' | 'team' | 'stats' | 'profile' | 'admin';

const SEM_WEBSITE = 'https://sem-cool-website--preview.poehali.dev/';

const Dashboard = () => {
  const navigate = useNavigate();
  const [me, setMe] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [section, setSection] = useState<Section>('home');
  const [loading, setLoading] = useState(true);
  const [showNotif, setShowNotif] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTasksData();
      setMe(data.me);
      setTasks(data.tasks);
      setNotifications(data.notifications);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
      if (err instanceof Error && err.message.includes('авториз')) logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('sem_token')) {
      navigate('/');
      return;
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load, navigate]);

  const logout = () => {
    localStorage.removeItem('sem_token');
    localStorage.removeItem('sem_user');
    navigate('/');
  };

  const handleStatus = async (id: number, status: string) => {
    await updateTaskStatus(id, status);
    toast.success('Статус обновлён');
    load();
  };

  const openNotif = async () => {
    setShowNotif(true);
    if (notifications.some((n) => !n.is_read)) {
      await readNotifications();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  if (loading || !me) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  const unread = notifications.filter((n) => !n.is_read).length;

  const navItems: { key: Section | 'website'; label: string; icon: string; external?: string }[] = [
    { key: 'home', label: 'Главная', icon: 'Home' },
    { key: 'tasks', label: 'Задачи', icon: 'ListTodo' },
    { key: 'chat', label: 'Чат', icon: 'MessageSquare' },
    { key: 'stats', label: 'Статистика', icon: 'BarChart3' },
    { key: 'profile', label: 'Профиль', icon: 'User' },
    { key: 'website', label: 'Наш сайт', icon: 'Globe', external: SEM_WEBSITE },
  ];
  if (me.is_owner) {
    navItems.splice(3, 0, { key: 'team', label: 'Команда', icon: 'Users' });
    navItems.push({ key: 'admin', label: 'Управление', icon: 'Settings' });
  }

  const handleNav = (item: typeof navItems[0]) => {
    if (item.external) {
      window.open(item.external, '_blank', 'noopener,noreferrer');
    } else {
      setSection(item.key as Section);
    }
  };

  return (
    <div className="min-h-screen bg-mesh">
      <header className="glass sticky top-0 z-40 border-b border-border/40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Icon name="Zap" size={22} className="text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-gradient">Sem</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openNotif}
              className="relative w-10 h-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors"
            >
              <Icon name="Bell" size={20} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center font-semibold">
                  {unread}
                </span>
              )}
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold">{me.username}</span>
              <span className="text-xs text-muted-foreground">{me.rank}</span>
            </div>
            <button
              onClick={logout}
              className="w-10 h-10 rounded-xl bg-secondary/60 hover:bg-destructive/80 flex items-center justify-center transition-colors"
            >
              <Icon name="LogOut" size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="container py-6 flex gap-6">
        <aside className="hidden md:flex flex-col gap-1 w-56 shrink-0">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNav(item)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                !item.external && section === item.key
                  ? 'bg-gradient-to-r from-primary to-accent text-white font-semibold'
                  : item.external
                  ? 'hover:bg-secondary/60 text-muted-foreground hover:text-accent'
                  : 'hover:bg-secondary/60 text-muted-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.external && <Icon name="ExternalLink" size={14} className="opacity-60" />}
            </button>
          ))}
        </aside>

        <main className="flex-1 min-w-0 animate-fade-in">
          {section === 'home' && <HomeSection me={me} tasks={tasks} onGo={setSection} />}
          {section === 'tasks' && (
            <TasksSection me={me} tasks={tasks} onStatus={handleStatus} onRefresh={load} />
          )}
          {section === 'chat' && <ChatSection />}
          {section === 'stats' && <StatsSection tasks={tasks} />}
          {section === 'team' && me.is_owner && <TeamSection />}
          {section === 'profile' && <ProfileSection me={me} tasks={tasks} />}
          {section === 'admin' && me.is_owner && <AdminSection onChanged={load} />}
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 glass border-t border-border/40 flex justify-around py-2 z-40">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.key}
            onClick={() => handleNav(item)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs ${
              !item.external && section === item.key ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name={item.icon} size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <NotificationsPanel
        open={showNotif}
        onClose={() => setShowNotif(false)}
        notifications={notifications}
      />
    </div>
  );
};

export default Dashboard;
