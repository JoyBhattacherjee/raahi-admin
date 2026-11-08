import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildData } from '../data/mock';

const AppContext = createContext(null);

const AUTH_KEY = 'raahi_admin_user';
const THEME_KEY = 'raahi_admin_theme';

export const DEMO_EMAIL = 'admin@raahi.app';
export const DEMO_PASSWORD = 'admin123';

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage can be unavailable (private mode); the app still works */
  }
}

export function AppProvider({ children }) {
  const [data, setData] = useState(buildData);
  const [user, setUser] = useState(() => {
    const raw = readStorage(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [theme, setTheme] = useState(() => readStorage(THEME_KEY) || 'light');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeStorage(THEME_KEY, theme);
  }, [theme]);

  // ------------------------------------------------------------------ toasts
  const toast = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // -------------------------------------------------------------------- auth
  const login = useCallback((email, password) => {
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const u = { name: 'Admin', email: DEMO_EMAIL, role: 'Operations Lead' };
      setUser(u);
      writeStorage(AUTH_KEY, JSON.stringify(u));
      return { ok: true };
    }
    return { ok: false, error: 'Incorrect email or password.' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    writeStorage(AUTH_KEY, null);
  }, []);

  // ------------------------------------------------------------ data actions
  const patch = useCallback((key, id, changes) => {
    setData((d) => ({
      ...d,
      [key]: d[key].map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }));
  }, []);

  const actions = useMemo(
    () => ({
      // Rides
      cancelRide: (id) => {
        patch('rides', id, { status: 'cancelled', fare: 0 });
        toast(`Ride ${id} cancelled`, 'warning');
      },
      refundRide: (id) => {
        patch('rides', id, { refunded: true });
        toast(`Refund initiated for ${id}`);
      },
      // Drivers
      approveDriver: (id) => {
        patch('drivers', id, {
          status: 'offline',
          rating: 5,
          docs: { license: true, rc: true, insurance: true, background: true },
        });
        toast('Driver approved and onboarded');
      },
      rejectDriver: (id) => {
        setData((d) => ({ ...d, drivers: d.drivers.filter((x) => x.id !== id) }));
        toast('Application rejected', 'warning');
      },
      suspendDriver: (id) => {
        patch('drivers', id, { status: 'suspended' });
        toast('Driver suspended', 'warning');
      },
      reinstateDriver: (id) => {
        patch('drivers', id, { status: 'offline' });
        toast('Driver reinstated');
      },
      // Riders
      toggleRider: (id, blocked) => {
        patch('riders', id, { status: blocked ? 'active' : 'blocked' });
        toast(blocked ? 'Rider unblocked' : 'Rider blocked', blocked ? 'success' : 'warning');
      },
      // Pricing
      updateRideType: (id, changes) => patch('rideTypes', id, changes),
      // Promos
      addPromo: (promo) => {
        setData((d) => ({
          ...d,
          promos: [
            { id: `p${Date.now()}`, uses: 0, active: true, ...promo },
            ...d.promos,
          ],
        }));
        toast(`Promo ${promo.code} created`);
      },
      togglePromo: (id, active) => patch('promos', id, { active }),
      deletePromo: (id) => {
        setData((d) => ({ ...d, promos: d.promos.filter((p) => p.id !== id) }));
        toast('Promo deleted', 'warning');
      },
    }),
    [patch, toast],
  );

  const value = useMemo(
    () => ({
      ...data,
      user,
      login,
      logout,
      theme,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
      toast,
      toasts,
      ...actions,
    }),
    [data, user, login, logout, theme, toast, toasts, actions],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
