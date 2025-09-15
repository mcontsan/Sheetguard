// src/components/Sidebar.jsx

import React from 'react';
import { useAppContext } from '../contexts/AppContext';

// --- Ícones (sem alterações) ---
const DashboardIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MoonIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>;
const SunIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m18 6h-1m-1-12l-.707-.707M6.343 6.343L5.636 5.636m12.728 12.728l-.707-.707M6.343 17.657l-.707.707M12 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
const CloseIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;

export function Sidebar() {
  const { theme, toggleTheme, language, toggleLanguage, currentView, navigateToDashboard, navigateToSettings, analysisSessions, activeSessionId, navigateToSession, closeSession } = useAppContext();

  return (
    <aside className="w-64 bg-slate-800 text-slate-300 p-4 flex flex-col flex-shrink-0">
      <div className="flex items-center space-x-2 mb-10">
        <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center text-2xl font-bold flex-shrink-0 text-white">S</div>
        <h1 className="text-xl font-bold text-white">SheetGuard</h1>
      </div>
      
      <nav>
        <ul>
          <li>
            <button onClick={navigateToDashboard} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md ${currentView === 'dashboard' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
              <DashboardIcon />
              <span>Dashboard</span>
            </button>
          </li>
          <li className="mt-2">
            <button onClick={() => navigateToSettings()} className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md ${currentView === 'settings' ? 'bg-slate-700/50 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
              <SettingsIcon />
              <span>Configurações</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* NOVA SECÇÃO: Sessões de Análise Ativas */}
      {analysisSessions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <h5 className="px-3 text-xs font-semibold uppercase text-slate-500 mb-2">Análises Ativas</h5>
          <ul className="space-y-1">
            {analysisSessions.map(session => (
              <li key={session.id}>
                <button 
                  onClick={() => navigateToSession(session.id)}
                  className={`w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-md group ${activeSessionId === session.id ? 'bg-blue-600/30 text-white' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
                >
                  <span className="truncate pr-2">{session.profile.name}</span>
                  <div 
                    onClick={(e) => { e.stopPropagation(); closeSession(session.id); }}
                    className="opacity-0 group-hover:opacity-100 hover:bg-red-500/50 p-1 rounded-full"
                  >
                    <CloseIcon />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex-grow flex flex-col justify-end">
        <div className="flex items-center justify-around bg-slate-900/50 p-2 rounded-lg">
          <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white" title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
          <button onClick={toggleLanguage} className="p-2 w-10 h-9 flex items-center justify-center rounded-md hover:bg-slate-700 font-semibold text-sm text-slate-400 hover:text-white" title="Alternar Idioma">
            {language === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>
      </div>
    </aside>
  );
}