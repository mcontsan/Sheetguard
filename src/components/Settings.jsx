// src/components/Settings.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { loadProfiles, updateProfileSample, updateRuleInProfile, addRuleToProfile, deleteRuleFromProfile } from '../services/profileManager.js';
import { extractHeadersFromFile } from '../services/fileReader.js';
import { useAppContext } from '../contexts/AppContext.jsx';
import { ConfirmationModal } from './Modals.jsx';

const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PencilIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;

function RuleItem({ rule, onEdit, onDelete }) {
  const ruleDescriptions = { 'not-empty': 'Não pode estar vazio', 'is-unique': 'Deve ser único', 'is-number': 'Deve ser um número', 'matches-regex': 'Corresponde ao formato', 'in-set': 'Deve estar no conjunto' };
  return (
    <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md">
      <div>
        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">Coluna: <span className="font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{rule.column}</span></p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{ruleDescriptions[rule.type] || rule.type}{rule.value && <span className="font-mono text-xs ml-2 text-blue-600 dark:text-blue-400">({rule.value})</span>}</p>
      </div>
      <div className="flex items-center space-x-3 ml-4">
        <button onClick={() => onEdit(rule)} className="text-slate-500 hover:text-blue-500" title="Editar Regra"><PencilIcon /></button>
        <button onClick={() => onDelete(rule)} className="text-slate-500 hover:text-red-500" title="Excluir Regra"><TrashIcon /></button>
      </div>
    </div>
  );
}

function SampleFileUploader({ profile, onHeadersExtracted }) {
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      try {
        const headers = await extractHeadersFromFile(file);
        if (headers.length === 0) {
          alert("Não foi possível encontrar nenhum cabeçalho no ficheiro. Verifique se o ficheiro não está vazio.");
          return;
        }
        onHeadersExtracted(headers);
      } catch (error) {
        alert(error.message);
      }
    }
  }, [onHeadersExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] } });

  return (
    <div className="mb-6">
      <h4 className="font-semibold text-slate-800 dark:text-slate-200">Assistente de Configuração</h4>
      <div {...getRootProps()} className={`mt-2 p-4 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}>
        <input {...getInputProps()} />
        <p className="text-sm text-slate-500">Arraste uma planilha de exemplo aqui, ou clique para selecionar.</p>
        <p className="text-xs text-slate-400 mt-1">Isto irá ler os nomes das colunas para facilitar a criação de regras.</p>
      </div>
      {profile.sampleHeaders && profile.sampleHeaders.length > 0 && (
        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
          ✓ {profile.sampleHeaders.length} colunas lidas com sucesso do seu ficheiro de exemplo!
        </div>
      )}
    </div>
  );
}

function RuleEditor({ ruleToEdit, headers, onSave, onCancel }) {
  const isEditing = Boolean(ruleToEdit && ruleToEdit.id);
  const [column, setColumn] = useState('');
  const [type, setType] = useState('not-empty');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (ruleToEdit) {
      const defaultColumn = headers && headers.length > 0 ? headers[0] : '';
      setColumn(ruleToEdit.column || defaultColumn);
      setType(ruleToEdit.type || 'not-empty');
      setValue(ruleToEdit.value || '');
    }
  }, [ruleToEdit, headers]);

  const needsValue = type === 'matches-regex' || type === 'in-set';

  const handleSave = () => {
    if (!column.trim()) { alert('O nome da coluna é obrigatório.'); return; }
    const ruleData = { ...ruleToEdit, column: column.trim(), type };
    if (needsValue) {
      if (!value.trim()) { alert('O valor para este tipo de regra é obrigatório.'); return; }
      ruleData.value = value.trim();
    } else {
      delete ruleData.value;
    }
    onSave(ruleData);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
      <h5 className="font-bold text-slate-800 dark:text-slate-100">{isEditing ? 'Editar Regra' : 'Nova Regra'}</h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Coluna</label>
          {headers && headers.length > 0 ? (
            <select value={column} onChange={e => setColumn(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
              {headers.map(header => <option key={header} value={header}>{header}</option>)}
            </select>
          ) : (
            <input type="text" value={column} onChange={e => setColumn(e.target.value)} placeholder="Carregue um ficheiro ou digite" className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Regra</label>
          <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
            <option value="not-empty">Não pode estar vazio</option>
            <option value="is-unique">Deve ser único</option>
            <option value="is-number">Deve ser um número</option>
            <option value="matches-regex">Corresponde ao formato (regex)</option>
            <option value="in-set">Deve estar no conjunto (separado por vírgula)</option>
          </select>
        </div>
      </div>
      {needsValue && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{type === 'matches-regex' ? 'Expressão Regular' : 'Valores (separados por vírgula)'}</label>
          <input type="text" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'in-set' ? 'ATIVO,INATIVO' : ''} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"/>
        </div>
      )}
      <div className="flex justify-end space-x-2 mt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 dark:bg-slate-600 px-3 py-1.5 rounded-md text-sm">Cancelar</button>
        <button type="button" onClick={handleSave} className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold">Salvar Regra</button>
      </div>
    </div>
  );
}

export function SettingsView() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const { currentView } = useAppContext();

  const refreshProfiles = useCallback((profileIdToSelect) => {
    const allProfiles = loadProfiles();
    setProfiles(allProfiles);
    const id = profileIdToSelect || selectedProfile?.id;
    if (id) {
      setSelectedProfile(allProfiles.find(p => p.id === id));
    } else if (allProfiles.length > 0 && !selectedProfile) {
      setSelectedProfile(allProfiles[0]);
    }
  }, [selectedProfile]);

  useEffect(() => {
    if (currentView === 'settings') {
      refreshProfiles();
    }
  }, [currentView]);

  const handleHeadersExtracted = (headers) => {
    if (!selectedProfile) return;
    const updatedProfile = updateProfileSample(selectedProfile.id, headers);
    if (updatedProfile) {
      refreshProfiles(updatedProfile.id);
    }
  };

  const handleSaveRule = (ruleData) => {
    if (!selectedProfile) return;
    const isUpdating = Boolean(ruleData.id);
    const updatedProfile = isUpdating 
      ? updateRuleInProfile(selectedProfile.id, ruleData)
      : addRuleToProfile(selectedProfile.id, ruleData);
    
    if (updatedProfile) refreshProfiles(updatedProfile.id);
    setEditingRule(null);
  };

  const handleDeleteRule = () => {
    if (!ruleToDelete || !selectedProfile) return;
    const updatedProfile = deleteRuleFromProfile(selectedProfile.id, ruleToDelete.id);
    if (updatedProfile) refreshProfiles(updatedProfile.id);
    setRuleToDelete(null);
  };
  
  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setEditingRule(null); // Fecha o editor de regras ao trocar de perfil
  };

  return (
    <>
      <section className="h-full flex flex-col">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Configurações e Perfis</h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-1">Gira os seus perfis de validação e as suas regras.</p>
        </header>
        <div className="flex-grow grid grid-cols-12 gap-6 min-h-0">
          <div className="col-span-4 bg-white dark:bg-slate-800 rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-semibold mb-3">Perfis</h3>
            <div className="flex-grow overflow-y-auto pr-2">
              <ul>
                {profiles.map(p => (
                  <li key={p.id}><button onClick={() => handleSelectProfile(p)} className={`w-full text-left p-3 rounded-md mb-1 ${selectedProfile?.id === p.id ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{p.name}</button></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="col-span-8 bg-white dark:bg-slate-800 rounded-lg p-6 flex flex-col">
            {selectedProfile ? (
              <div className="flex flex-col h-full">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex-shrink-0">{selectedProfile.name}</h3>
                <div className="mt-4 flex-grow overflow-y-auto pr-2">
                  {editingRule ? (
                    <RuleEditor ruleToEdit={editingRule} headers={selectedProfile.sampleHeaders || []} onSave={handleSaveRule} onCancel={() => setEditingRule(null)} />
                  ) : (
                    <div>
                      <SampleFileUploader profile={selectedProfile} onHeadersExtracted={handleHeadersExtracted} />
                      <h4 className="text-lg font-semibold border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">Regras de Validação</h4>
                      <div className="mt-3 space-y-2">
                        {(selectedProfile.rules || []).length > 0 ? (
                          (selectedProfile.rules || []).map(rule => (
                            <RuleItem key={rule.id} rule={rule} onEdit={setEditingRule} onDelete={setRuleToDelete} />
                          ))
                        ) : (
                           <p className="text-center text-slate-500 py-4">Nenhuma regra definida.</p>
                        )}
                        <button onClick={() => setEditingRule({})} className="mt-2 w-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 py-2 rounded-md font-semibold hover:bg-blue-200 dark:hover:bg-blue-900">
                          + Adicionar Nova Regra
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full"><p className="text-slate-500">Selecione um perfil à esquerda para começar.</p></div>
            )}
          </div>
        </div>
      </section>
      <ConfirmationModal isOpen={!!ruleToDelete} onClose={() => setRuleToDelete(null)} onConfirm={handleDeleteRule} title="Confirmar Exclusão de Regra">
        {ruleToDelete && <p>Tem a certeza de que deseja excluir a regra para a coluna <strong>"{ruleToDelete.column}"</strong>?</p>}
      </ConfirmationModal>
    </>
  );
}