// src/components/Profiles.jsx
import React, { useState, useEffect } from 'react';
import { addProfile, deleteProfile, searchProfiles, loadProfiles } from '../services/profileManager.js';
import { loadHistory } from '../services/historyManager.js';
import { ProfileModal, ConfirmationModal } from './Modals.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { useAppContext } from '../contexts/AppContext';

const ClockIcon = () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const TableIcon = () => <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>;

function ProfileCard({ profile, onEdit, onDelete, onAnalyze }) {
  const lastUpdatedDate = new Date(profile.lastUpdated).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const ruleCount = profile.rules ? profile.rules.length : 0;
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-col justify-between border border-slate-200 dark:border-slate-700">
      <div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate" title={profile.name}>{profile.name}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Atualizado: {lastUpdatedDate}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{ruleCount} regra(s)</p>
      </div>
      <div className="flex items-center justify-end space-x-3 mt-3">
        <button onClick={() => onEdit(profile)} className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-500">Gerir Regras</button>
        <button onClick={() => onDelete(profile)} className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-500">Excluir</button>
      </div>
      <button onClick={() => onAnalyze(profile)} className="mt-3 w-full bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-semibold hover:bg-blue-700">Analisar</button>
    </div>
  );
}

function RecentAnalyses() {
  const [history, setHistory] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const { navigateToAnalysis, currentView } = useAppContext();

  useEffect(() => {
    if (currentView === 'dashboard') {
      setHistory(loadHistory());
      setProfiles(loadProfiles());
    }
  }, [currentView]);

  const handleReanalyze = (historyItem) => {
    const profileToUse = profiles.find(p => p.id === historyItem.profileId);
    if (profileToUse) {
      navigateToAnalysis(profileToUse);
    } else {
      alert(`Perfil "${historyItem.profileName}" não encontrado. Pode ter sido excluído.`);
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <p className="text-slate-500">Nenhuma análise recente. Comece uma nova análise para ver o seu histórico aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map(item => {
        const date = new Date(item.timestamp);
        const formattedDate = `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const hasErrors = item.summary.errorCount > 0;
        return (
          <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center justify-between border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{item.fileName}</p>
              <p className="text-sm text-slate-500">Analisado com "{item.profileName}" em {formattedDate}</p>
              <div className={`mt-1 text-xs font-semibold px-2 py-0.5 inline-block rounded-full ${hasErrors ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                {item.summary.errorCount} erros em {item.summary.rowCount} linhas
              </div>
            </div>
            <button onClick={() => handleReanalyze(item)} className="text-sm font-semibold text-blue-600 hover:underline">Re-analisar</button>
          </div>
        );
      })}
    </div>
  );
}

export function ProfileSelector() {
  const [profiles, setProfiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { navigateToAnalysis, navigateToSettings } = useAppContext();

  const refreshProfiles = () => {
    setProfiles(searchProfiles(debouncedSearchTerm));
  };

  useEffect(refreshProfiles, [debouncedSearchTerm]);

  const handleSaveNewProfile = (profileData) => {
    addProfile(profileData);
    const newProfile = loadProfiles()[0];
    navigateToSettings(newProfile);
  };

  const handleConfirmDelete = () => {
    if (profileToDelete) {
      deleteProfile(profileToDelete.id);
      refreshProfiles();
      setProfileToDelete(null);
    }
  };

  return (
    <section>
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h2>
        <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Bem-vindo ao SheetGuard. Comece uma nova análise ou veja as suas atividades recentes.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TableIcon />
            <h3 className="text-xl font-bold">Perfis de Validação</h3>
          </div>
          <div className="flex items-center gap-3">
            <input type="search" placeholder="Buscar perfis..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
            <button onClick={() => setIsModalOpen(true)} className="flex-shrink-0 bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700">+ Novo</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(profiles || []).length > 0 ? (
              profiles.map(p => (
                <ProfileCard key={p.id} profile={p} onEdit={navigateToSettings} onDelete={setProfileToDelete} onAnalyze={navigateToAnalysis} />
              ))
            ) : (
              <div className="md:col-span-2 text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-slate-500">Nenhum perfil encontrado.</p>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClockIcon />
            <h3 className="text-xl font-bold">Análises Recentes</h3>
          </div>
          <RecentAnalyses />
        </div>
      </div>
      <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveNewProfile} />
      <ConfirmationModal isOpen={!!profileToDelete} onClose={() => setProfileToDelete(null)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão de Perfil">
        {profileToDelete && <p>Tem a certeza de que deseja excluir o perfil <strong>"{profileToDelete.name}"</strong>?</p>}
      </ConfirmationModal>
    </section>
  );
}