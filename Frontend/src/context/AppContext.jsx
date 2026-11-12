import React, { createContext, useContext, useEffect, useState } from 'react';
import { portalApi, getStoredToken, setStoredToken } from '../services/api';
import { TRANSLATIONS } from '../i18n/translations';

const AppContext = createContext(null);
const LANG_STORAGE_KEY = 'cm_kerala_grievance_lang';

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [overview, setOverview] = useState(null);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return saved === 'ml' ? 'ml' : 'en';
  });

  function setLang(nextLang) {
    const safe = nextLang === 'ml' ? 'ml' : 'en';
    setLangState(safe);
    localStorage.setItem(LANG_STORAGE_KEY, safe);
  }

  function toggleLang() {
    setLang(lang === 'en' ? 'ml' : 'en');
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const tr = TRANSLATIONS[lang] || TRANSLATIONS.en;

  function notify(type, message) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  }

  function dismissToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function refreshOverview() {
    try {
      const res = await portalApi.getPublicOverview();
      setOverview(res.data);
    } catch (err) {
      notify('error', `Unable to load portal overview: ${err.message}`);
    }
  }

  useEffect(() => {
    async function init() {
      await refreshOverview();
      try {
        const demoRes = await portalApi.getDemoAccounts();
        setDemoAccounts(demoRes.data || []);
      } catch (_err) {
        // Demo accounts disabled in strict production
      }

      if (getStoredToken()) {
        try {
          const meRes = await portalApi.me();
          setUser(meRes.data.user);
        } catch (_err) {
          setStoredToken('');
        }
      }
      setAuthReady(true);
    }
    init();
  }, []);

  async function login(credentials) {
    const res = await portalApi.login(credentials);
    setStoredToken(res.data.token);
    setUser(res.data.user);
    notify('success', `Welcome back, ${res.data.user.name}`);
    return res.data.user;
  }

  async function registerCitizen(formData) {
    const res = await portalApi.registerCitizen(formData);
    setStoredToken(res.data.token);
    setUser(res.data.user);
    notify('success', 'Citizen account created successfully.');
    return res.data.user;
  }

  async function logout() {
    try {
      await portalApi.logout();
    } catch (_err) {
      // Stateless token logout
    }
    setStoredToken('');
    setUser(null);
    notify('info', 'You have signed out.');
  }

  return (
    <AppContext.Provider
      value={{
        user,
        authReady,
        overview,
        demoAccounts,
        toasts,
        notify,
        dismissToast,
        login,
        registerCitizen,
        logout,
        refreshOverview,
        lang,
        setLang,
        toggleLang,
        tr,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
