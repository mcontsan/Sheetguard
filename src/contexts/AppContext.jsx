// src/contexts/AppContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

const translations = {
    pt: { "header.subtitle": "Analisador Inteligente de Planilhas", "header.logout": "Sair" },
    en: { "header.subtitle": "Intelligent Spreadsheet Analyzer", "header.logout": "Logout" }
};

export function AppProvider({ children }) {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'pt');
    const [currentView, setCurrentView] = useState('dashboard');
    const [analysisSessions, setAnalysisSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') { root.classList.add('dark'); } 
        else { root.classList.remove('dark'); }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => { localStorage.setItem('language', language); }, [language]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    const toggleLanguage = () => setLanguage(prev => (prev === 'pt' ? 'en' : 'pt'));
    const t = (key) => translations[language][key] || key;

    const updateSession = (sessionId, updates) => {
      setAnalysisSessions(sessions => sessions.map(session => 
        session.id === sessionId ? { ...session, ...updates } : session
      ));
    };

    const navigateToAnalysis = (profile) => {
      const newSession = {
        id: `session-${Date.now()}`,
        profile: profile,
        file: null,
        gridData: null, // <-- NOVO CAMPO PARA OS DADOS DA GRELHA
        results: null,
        analysisState: 'waiting_file', // 'waiting_file', 'ready_to_analyze', 'analyzing', 'results'
        error: null,
      };
      setAnalysisSessions(prev => [...prev, newSession]);
      setActiveSessionId(newSession.id);
      setCurrentView('analysis');
    };

    const navigateToDashboard = () => setCurrentView('dashboard');
    const navigateToSettings = () => setCurrentView('settings');
    const navigateToSession = (sessionId) => {
      setActiveSessionId(sessionId);
      setCurrentView('analysis');
    };

    const closeSession = (sessionId) => {
      setAnalysisSessions(prev => {
        const remaining = prev.filter(s => s.id !== sessionId);
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            setActiveSessionId(remaining[remaining.length - 1].id);
            setCurrentView('analysis');
          } else {
            setActiveSessionId(null);
            setCurrentView('dashboard');
          }
        }
        return remaining;
      });
    };

    const value = {
        theme, toggleTheme, language, toggleLanguage, t,
        currentView, analysisSessions, activeSessionId,
        navigateToAnalysis, navigateToDashboard, navigateToSettings,
        navigateToSession, closeSession,
        updateSession,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => useContext(AppContext);