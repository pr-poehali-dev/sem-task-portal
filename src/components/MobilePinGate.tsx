import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

const MOBILE_PIN = 'Tel222';
const STORAGE_KEY = 'sem_mobile_unlocked';

interface Props {
  children: React.ReactNode;
}

function isMobile() {
  return window.innerWidth < 768;
}

const MobilePinGate = ({ children }: Props) => {
  const [unlocked, setUnlocked] = useState(() => {
    if (!isMobile()) return true;
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  });
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const check = () => {
      if (!isMobile()) setUnlocked(true);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === MOBILE_PIN) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setUnlocked(true);
    } else {
      setError('Неверный код');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className={`relative w-full max-w-xs animate-scale-in ${shake ? 'animate-[shake_0.5s_ease]' : ''}`}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent glow mb-4">
            <Icon name="Smartphone" size={38} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient">Sem</h1>
          <p className="text-muted-foreground text-sm mt-1">Мобильный доступ</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-7 space-y-5">
          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">Введите код доступа для мобильной версии</p>
          </div>

          <div className="relative">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              placeholder="••••••"
              autoFocus
              className="w-full h-14 text-center text-2xl tracking-[0.5em] bg-secondary/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-destructive text-sm text-center flex items-center justify-center gap-1">
              <Icon name="AlertCircle" size={14} /> {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Icon name="Unlock" size={18} /> Войти
          </button>
        </form>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-8px); }
          40%,80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};

export default MobilePinGate;
