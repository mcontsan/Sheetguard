// src/renderer.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { AppProvider, useAppContext } from './contexts/AppContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { ProfileSelector } from './components/Profiles.jsx'; // Continua a ser o ecrã do Dashboard
import { AnalysisView } from './components/Analysis.jsx';
import { SettingsView } from './components/Settings.jsx';

function CurrentView() {
  const { currentView } = useAppContext();

  switch (currentView) {
    case 'analysis':
      return <AnalysisView />;
    case 'settings':
      return <SettingsView />;
    case 'dashboard':
    default:
      return <ProfileSelector />;
  }
}

function DesktopLayout() {
  const { theme } = useAppContext();
  return (
    <div key={theme} className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-grow overflow-y-auto p-8">
          <CurrentView />
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <div className="font-sans">
        <DesktopLayout />
      </div>
    </AppProvider>
  </React.StrictMode>
);