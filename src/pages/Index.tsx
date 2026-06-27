import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Role = 'Программист' | 'Режиссёр' | 'Дизайнер' | 'Монтажёр';

interface Task {
  id: number;
  title: string;
  role: Role;
  desc: string;
  deadline: string;
  reward: string;
  status: 'Новый' | 'В работе' | 'Готово';
  isNew?: boolean;
}

const OWNER = { login: 'DezeYT', avatar: 'D' };

const TASKS: Task[] = [
  { id: 1, title: 'Лендинг для запуска курса', role: 'Программист', desc: 'Сверстать адаптивный лендинг с анимациями и формой заявки.', deadline: '3 дня', reward: '25 000 ₽', status: 'Новый', isNew: true },
  { id: 2, title: 'Съёмка рекламного ролика', role: 'Режиссёр', desc: 'Постановка и съёмка ролика на 60 секунд для бренда.', deadline: '5 дней', reward: '60 000 ₽', status: 'Новый', isNew: true },
  { id: 3, title: 'Монтаж YouTube-выпуска', role: 'Монтажёр', desc: 'Динамичный монтаж 20-минутного видео с графикой.', deadline: '2 дня', reward: '15 000 ₽', status: 'В работе' },
  { id: 4, title: 'Дизайн фирменного стиля', role: 'Дизайнер', desc: 'Логотип, палитра, гайдлайн для нового проекта.', deadline: '7 дней', reward: '40 000 ₽', status: 'Новый', isNew: true },
  { id: 5, title: 'Интеграция API оплаты', role: 'Программист', desc: 'Подключить эквайринг и вебхуки в личный кабинет.', deadline: '4 дня', reward: '35 000 ₽', status: 'Готово' },
  { id: 6, title: 'Раскадровка клипа', role: 'Режиссёр', desc: 'Подготовить раскадровку и сценарный план съёмок.', deadline: '2 дня', reward: '18 000 ₽', status: 'В работе' },
];

const ROLE_META: Record<Role, { icon: string; color: string }> = {
  'Программист': { icon: 'Code2', color: 'from-violet-500 to-fuchsia-500' },
  'Режиссёр': { icon: 'Clapperboard', color: 'from-cyan-400 to-blue-500' },
  'Дизайнер': { icon: 'Palette', color: 'from-pink-500 to-rose-500' },
  'Монтажёр': { icon: 'Scissors', color: 'from-amber-400 to-orange-500' },
};

const NAV = [
  { id: 'home', label: 'Главная', icon: 'LayoutDashboard' },
  { id: 'tasks', label: 'Задачи', icon: 'ListChecks' },
  { id: 'team', label: 'Команда', icon: 'Users' },
  { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
  { id: 'profile', label: 'Профиль', icon: 'User' },
  { id: 'settings', label: 'Настройки', icon: 'Settings' },
];

const Index = () => {
  const [logged, setLogged] = useState(false);
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [section, setSection] = useState('home');
  const [filter, setFilter] = useState<Role | 'Все'>('Все');
  const [notifOpen, setNotifOpen] = useState(false);

  const newTasks = TASKS.filter((t) => t.isNew);
  const visibleTasks = filter === 'Все' ? TASKS : TASKS.filter((t) => t.role === filter);

  if (!logged) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4 overflow-hidden relative">
        <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-accent/20 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="glass rounded-3xl p-8 sm:p-10 w-full max-w-md relative z-10 animate-scale-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow mb-4">
              <span className="font-display font-extrabold text-2xl text-white">S</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">Sem</h1>
            <p className="text-muted-foreground text-sm mt-1">Платформа заказов для специалистов</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Логин</label>
              <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Введите логин" className="h-12 bg-secondary/50 border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Пароль</label>
              <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Введите пароль" className="h-12 bg-secondary/50 border-border" />
            </div>
            <Button
              onClick={() => setLogged(true)}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              Войти
              <Icon name="ArrowRight" size={18} className="ml-1" />
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Заказы раздаёт владелец платформы <span className="text-foreground font-medium">@DezeYT</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-border/50 p-5 fixed h-screen z-20">
        <div className="flex items-center gap-3 mb-10 px-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="font-display font-extrabold text-lg text-white">S</span>
          </div>
          <span className="font-display text-xl font-bold">Sem</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                section === item.id
                  ? 'bg-gradient-to-r from-primary/20 to-accent/10 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="glass rounded-2xl p-4 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
              {OWNER.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">@{OWNER.login}</p>
              <p className="text-xs text-muted-foreground">Владелец</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 px-5 sm:px-8 py-4 flex items-center justify-between border-b border-border/50">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold capitalize">
              {NAV.find((n) => n.id === section)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative w-11 h-11 rounded-xl glass flex items-center justify-center hover:bg-secondary/60 transition-colors"
              >
                <Icon name="Bell" size={20} />
                {newTasks.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center animate-pulse-ring">
                    {newTasks.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 glass rounded-2xl p-3 z-50 animate-scale-in shadow-2xl">
                  <p className="text-sm font-semibold px-2 py-1.5">Новые заказы от @DezeYT</p>
                  <div className="space-y-1.5 max-h-80 overflow-auto">
                    {newTasks.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${ROLE_META[t.role].color} flex items-center justify-center shrink-0`}>
                          <Icon name={ROLE_META[t.role].icon} size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.role} · {t.reward}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white">
              {OWNER.avatar}
            </div>
          </div>
        </header>

        <main className="p-5 sm:p-8 space-y-8">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl glass p-8 sm:p-10 animate-fade-in">
            <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full glass mb-4">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {newTasks.length} новых заказа ждут специалистов
              </span>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight mb-3">
                Бери задачи <span className="text-gradient animate-gradient-move">своего профиля</span>
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Программисты, режиссёры, дизайнеры и монтажёры — каждый получает заказы под свою специальность от владельца @DezeYT.
              </p>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Всего задач', value: TASKS.length, icon: 'Layers', color: 'from-violet-500 to-fuchsia-500' },
              { label: 'Новые', value: newTasks.length, icon: 'Sparkles', color: 'from-cyan-400 to-blue-500' },
              { label: 'В работе', value: TASKS.filter((t) => t.status === 'В работе').length, icon: 'Loader', color: 'from-amber-400 to-orange-500' },
              { label: 'Готово', value: TASKS.filter((t) => t.status === 'Готово').length, icon: 'CheckCircle2', color: 'from-emerald-400 to-green-500' },
            ].map((s, i) => (
              <div key={s.label} className="glass rounded-2xl p-5 card-hover animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <Icon name={s.icon} size={20} className="text-white" />
                </div>
                <p className="font-display text-3xl font-extrabold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </section>

          {/* Filters */}
          <section>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <h3 className="font-display text-2xl font-bold">Доступные задания</h3>
              <div className="flex gap-2 flex-wrap">
                {(['Все', 'Программист', 'Режиссёр', 'Дизайнер', 'Монтажёр'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilter(r)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      filter === r
                        ? 'bg-gradient-to-r from-primary to-accent text-white'
                        : 'glass text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {visibleTasks.map((t, i) => (
                <div key={t.id} className="glass rounded-2xl p-6 card-hover animate-fade-in relative overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  {t.isNew && (
                    <span className="absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full bg-destructive/90 text-white">NEW</span>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ROLE_META[t.role].color} flex items-center justify-center mb-4`}>
                    <Icon name={ROLE_META[t.role].icon} size={22} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-accent">{t.role}</span>
                  <h4 className="font-display text-lg font-bold mt-1 mb-2 leading-snug">{t.title}</h4>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{t.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Icon name="Clock" size={14} />{t.deadline}</span>
                    <span className="flex items-center gap-1 text-foreground font-semibold"><Icon name="Wallet" size={14} />{t.reward}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${
                      t.status === 'Новый' ? 'bg-primary/20 text-primary-foreground' :
                      t.status === 'В работе' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>{t.status}</span>
                    <Button size="sm" variant="ghost" className="text-accent hover:text-accent hover:bg-accent/10">
                      Взять <Icon name="ArrowRight" size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Mobile nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 glass border-t border-border/50 flex justify-around py-2 z-40">
          {NAV.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] ${
                section === item.id ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              <Icon name={item.icon} size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Index;
