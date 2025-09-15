// src/components/Modals.jsx

import React, { useState, useEffect } from 'react'; // <-- CORREÇÃO: useEffect foi adicionado aqui.

// --- Modal de Perfil SIMPLIFICADO (apenas para criação) ---
export function ProfileModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('');

  // Este hook garante que o campo de nome seja limpo sempre que o modal for aberto.
  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSave}>
          <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-50">Novo Perfil de Validação</h3>
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nome do Perfil
            </label>
            <input
              type="text" id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required
              className="mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50"
              placeholder="Ex: Relatório Financeiro Q4"
            />
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-50 px-4 py-2 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancelar</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">Criar Perfil</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// O ConfirmationModal permanece inalterado e genérico
export function ConfirmationModal({ isOpen, onClose, onConfirm, title, children }) {
  if (!isOpen) { return null; }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{title}</h3>
        <div className="mt-4 text-slate-600 dark:text-slate-300">{children}</div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-50 px-4 py-2 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500">Cancelar</button>
          <button type="button" onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700">Confirmar</button>
        </div>
      </div>
    </div>
  );
}