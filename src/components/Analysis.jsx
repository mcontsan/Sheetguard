// src/components/Analysis.jsx

import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppContext } from '../contexts/AppContext';
import { runAnalysis } from '../services/analysisEngine.js';
import { convertErrorsToCSV } from '../services/exportManager.js';
import { readFileData, processFileDataForGrid } from '../services/fileReader.js';
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

// --- Ícones ---
const SpinnerIcon = () => <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
const UploadIcon = () => <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0 0l-2 2m2-2l2 2" /></svg>;
const FileIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
const PanelCollapseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>;
const PanelExpandIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>;
const FilterIcon = () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>;


// --- Componente FileDropzone (sem alterações) ---
const FileDropzone = ({ onFileAccepted }) => {
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) onFileAccepted(acceptedFiles[0]);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }, maxFiles: 1 });

  return (
    <div {...getRootProps()} className={`w-full h-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'}`}>
      <input {...getInputProps()} />
      <UploadIcon />
      <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-200">Arraste e solte o seu ficheiro aqui</p>
      <p className="mt-1 text-sm text-slate-500">ou clique para selecionar (.xlsx, .xls, .csv)</p>
    </div>
  );
};


// --- Componente DataTable (sem alterações) ---
const DataTable = ({ columns: columnDefs, data, errorsMap }) => {
  const table = useReactTable({
    data,
    columns: useMemo(() => [
        { id: 'rowNumber', header: '#', size: 60, minSize: 50, enableResizing: false,
          cell: ({ row }) => <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">{row.original.__originalRowIndex + 1}</span>,
        },
        { id: 'errors', header: 'Erros', size: 70, minSize: 60, enableResizing: false,
          cell: ({ row }) => {
            const rowErrors = errorsMap.get(row.original.__originalRowIndex);
            if (!rowErrors || rowErrors.length === 0) return null;
            return (
              <div className="flex justify-center items-center" title={rowErrors.map(e => `[${e.column}] ${e.message}`).join('\n')}>
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                  {rowErrors.length}
                </span>
              </div>
            );
          },
        },
      ...columnDefs,
    ], [columnDefs, errorsMap]),
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full w-full overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <table className="text-sm text-left border-collapse" style={{ width: table.getTotalSize() }}>
        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}
                  className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-200 border-b border-r border-slate-200 dark:border-slate-700 whitespace-nowrap relative select-none"
                  style={{ width: header.getSize() }}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none select-none group"
                    >
                      <div className="w-px h-full bg-slate-300 dark:bg-slate-600 group-hover:bg-blue-500 transition-colors"></div>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {table.getRowModel().rows.map(row => {
            const hasErrors = errorsMap.has(row.original.__originalRowIndex);
            return (
              <tr key={row.id} className={`transition-colors ${hasErrors ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}
                    className="px-4 py-1.5 text-slate-700 dark:text-slate-300 truncate border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                    style={{ maxWidth: 250 }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
           })}
        </tbody>
      </table>
    </div>
  );
};

const ruleDescriptions = { 'not-empty': 'Célula Vazia', 'is-unique': 'Valor Duplicado', 'is-number': 'Não é um Número', 'matches-regex': 'Formato Inválido', 'in-set': 'Valor não Permitido' };

// --- Componente Principal ---
export function AnalysisView() {
  const { analysisSessions, activeSessionId, updateSession } = useAppContext();
  const activeSession = analysisSessions.find(s => s.id === activeSessionId);
  
  const [isActionsPanelOpen, setIsActionsPanelOpen] = useState(true);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  const handleFileAccepted = useCallback(async (file) => {
    updateSession(activeSessionId, { analysisState: 'analyzing', error: null, file, results: null });
    setShowOnlyErrors(false);
    try {
      const data = await readFileData(file);
      const { columns, data: gridData, headerRowIndex } = processFileDataForGrid(data);
      updateSession(activeSessionId, { gridData: { columns, data: gridData }, headerRowIndex, analysisState: 'ready_to_analyze' });
    } catch (error) {
      console.error("Erro ao processar ficheiro:", error);
      updateSession(activeSessionId, { analysisState: 'waiting_file', error: error.message });
    }
  }, [activeSessionId, updateSession]);

  const handleRunAnalysis = useCallback(async () => {
    if (!activeSession?.file || !activeSession?.profile) return;
    updateSession(activeSessionId, { analysisState: 'analyzing' });
    try {
      const results = await runAnalysis(activeSession.file, activeSession.profile);
      updateSession(activeSessionId, { results, analysisState: 'results' });
    } catch (error) {
      console.error("Erro durante a análise:", error);
      updateSession(activeSessionId, { analysisState: 'ready_to_analyze', error: 'Ocorreu um erro inesperado durante a análise.' });
    }
  }, [activeSession, activeSessionId, updateSession]);

  const handleExport = useCallback(async () => {
    if (!activeSession?.results?.errors) return;
    const defaultFileName = `RelatorioErros_${activeSession.file.name.split('.')[0]}.csv`;
    const result = await window.electronAPI.showSaveDialog({ defaultPath: defaultFileName, filters: [{ name: 'CSV Files', extensions: ['csv'] }] });
    if (!result.canceled && result.filePath) {
      await window.electronAPI.saveFile(result.filePath, convertErrorsToCSV(activeSession.results.errors));
    }
  }, [activeSession]);
  
  const errorsMap = useMemo(() => {
      const map = new Map();
      if (activeSession?.results?.errors) {
          activeSession.results.errors.forEach(error => {
              if (!map.has(error.originalRowIndex)) {
                  map.set(error.originalRowIndex, []);
              }
              map.get(error.originalRowIndex).push(error);
          });
      }
      return map;
  }, [activeSession?.results?.errors]);
  
  // NOVO: Memoiza o resumo de erros para o painel
  const errorSummary = useMemo(() => {
    if (!activeSession?.results?.errors) return { byType: {}, byColumn: {} };
    
    const byType = {};
    const byColumn = {};

    for (const error of activeSession.results.errors) {
      byType[error.ruleType] = (byType[error.ruleType] || 0) + 1;
      byColumn[error.column] = (byColumn[error.column] || 0) + 1;
    }
    
    return { byType, byColumn };
  }, [activeSession?.results?.errors]);

  const filteredGridData = useMemo(() => {
    if (showOnlyErrors && errorsMap.size > 0) {
      return activeSession?.gridData?.data.filter(row => errorsMap.has(row.__originalRowIndex)) || [];
    }
    return activeSession?.gridData?.data || [];
  }, [activeSession?.gridData?.data, showOnlyErrors, errorsMap]);

  if (!activeSession) {
    return <div className="h-full flex items-center justify-center"><p className="text-slate-500">Nenhuma sessão de análise ativa.</p></div>;
  }
  
  return (
    <section className="h-full flex flex-col">
      <header className="flex-shrink-0 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Bancada de Análise</h2>
        <p className="text-slate-500 dark:text-slate-400">Perfil de Validação: <span className="font-semibold text-slate-600 dark:text-slate-300">{activeSession.profile.name}</span></p>
      </header>

      {activeSession.analysisState === 'waiting_file' ? (
        <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg"><FileDropzone onFileAccepted={handleFileAccepted} />{activeSession.error && <p className="text-red-500 mt-4">{activeSession.error}</p>}</div>
      ) : activeSession.analysisState === 'analyzing' ? (
        <div className="flex-1 flex items-center justify-center"><SpinnerIcon /></div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-hidden relative">
          
          <div className="flex-1 flex flex-col min-w-0 h-full">
             <DataTable columns={activeSession.gridData.columns} data={filteredGridData} errorsMap={errorsMap} />
          </div>

          <div className={`absolute top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border-y border-l dark:border-slate-700 rounded-l-md transition-all duration-300 ${isActionsPanelOpen ? 'right-80' : 'right-0'}`}>
            <button onClick={() => setIsActionsPanelOpen(!isActionsPanelOpen)} className="p-1 text-slate-500 hover:text-blue-500" title={isActionsPanelOpen ? "Esconder painel" : "Mostrar painel"}>
              {isActionsPanelOpen ? <PanelCollapseIcon /> : <PanelExpandIcon />}
            </button>
          </div>

          <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isActionsPanelOpen ? 'w-80' : 'w-0'}`} style={{ overflow: 'hidden' }}>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg h-full w-80 flex flex-col">
              <div className="flex-shrink-0">
                <h3 className="text-lg font-bold">Ações</h3>
                {activeSession.analysisState !== 'results' ? (
                  <button onClick={handleRunAnalysis} className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 disabled:bg-slate-400" disabled={activeSession.analysisState === 'analyzing'}>Analisar Ficheiro</button>
                ) : (
                  <button onClick={handleRunAnalysis} className="mt-4 w-full bg-blue-800 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-900">Re-analisar</button>
                )}

                <div className="mt-6 border-t dark:border-slate-700 pt-4">
                  <p className="text-sm font-semibold">Ficheiro Carregado:</p>
                  <div className="flex items-center mt-2 text-sm text-slate-500 dark:text-slate-400">
                    <FileIcon className="w-5 h-5 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{activeSession.file?.name}</span>
                  </div>
                </div>
              </div>
              
               {activeSession.analysisState === 'results' && activeSession.results && (
                <div className="mt-6 border-t dark:border-slate-700 pt-4 flex-grow overflow-y-auto pr-2">
                    <h3 className="text-lg font-bold mb-3">Resultados da Análise</h3>
                    <div className="space-y-2 text-sm bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md">
                      <div className="flex justify-between"><span>Total de Erros:</span> <span className="font-bold text-red-500">{activeSession.results.summary.errorCount}</span></div>
                      <div className="flex justify-between"><span>Linhas com Erros:</span> <span className="font-bold">{errorsMap.size}</span></div>
                      <div className="flex justify-between"><span>Total de Linhas:</span> <span className="font-bold">{activeSession.results.summary.rowCount}</span></div>
                    </div>

                    {activeSession.results.summary.errorCount > 0 && (
                      <>
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2">Erros por Tipo</h4>
                            <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                                {Object.entries(errorSummary.byType).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                                    <li key={type} className="flex justify-between items-center">
                                        <span>{ruleDescriptions[type] || type}</span>
                                        <span className="font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-semibold text-sm mb-2">Erros por Coluna</h4>
                            <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                                {Object.entries(errorSummary.byColumn).sort(([, a], [, b]) => b - a).map(([col, count]) => (
                                    <li key={col} className="flex justify-between items-center">
                                        <span className="font-mono truncate pr-2" title={col}>{col}</span>
                                        <span className="font-mono bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">{count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="sticky bottom-0 bg-white dark:bg-slate-800 pt-4 pb-1 mt-4 border-t dark:border-slate-700">
                            <button 
                              onClick={() => setShowOnlyErrors(prev => !prev)}
                              className={`w-full flex items-center justify-center py-2 px-4 rounded-md font-semibold text-sm transition-colors ${showOnlyErrors ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                            >
                              <FilterIcon />
                              {showOnlyErrors ? 'Mostrar Todas as Linhas' : 'Mostrar Apenas Erros'}
                            </button>
                            <button onClick={handleExport} className="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-700">Exportar Relatório</button>
                        </div>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}