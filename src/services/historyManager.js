// src/services/historyManager.js

const HISTORY_STORAGE_KEY = 'sheetguard-analysis-history';
const MAX_HISTORY_ITEMS = 5;

export function loadHistory() {
  try {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (error) {
    console.error("Erro ao carregar histórico de análises:", error);
    return [];
  }
}

export function saveToHistory(analysisResult) {
  try {
    let history = loadHistory();
    
    const newHistoryItem = {
      id: `history-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName: analysisResult.metadata.fileName,
      profileName: analysisResult.metadata.profileName,
      profileId: analysisResult.metadata.profileId,
      summary: {
        rowCount: analysisResult.summary.rowCount,
        errorCount: analysisResult.summary.errorCount,
      }
    };

    history.unshift(newHistoryItem);

    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Erro ao salvar no histórico de análises:", error);
  }
}