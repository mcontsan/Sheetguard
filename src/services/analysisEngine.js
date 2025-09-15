// src/services/analysisEngine.js

import * as XLSX from 'xlsx';
import { saveToHistory } from './historyManager.js';

/**
 * Analisa o conteúdo de uma planilha para encontrar a linha mais provável de ser o cabeçalho.
 */
function findHeaderRow(data) {
  let bestRowIndex = 0;
  let maxFilledCells = 0;
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i];
    const filledCells = row.filter(cell => cell != null && String(cell).trim() !== '').length;
    if (filledCells > maxFilledCells && filledCells > 1) {
      maxFilledCells = filledCells;
      bestRowIndex = i;
    }
  }
  return { headers: data[bestRowIndex] ? data[bestRowIndex].map(h => String(h).trim()) : [], headerRowIndex: bestRowIndex };
}

/**
 * Lê o conteúdo de um ficheiro de planilha de forma assíncrona.
 */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        resolve(jsonData);
      } catch (e) {
        reject(new Error("Erro ao processar o conteúdo do ficheiro. Pode estar corrompido ou num formato inesperado."));
      }
    };
    reader.onerror = () => reject(new Error(`Ocorreu um erro ao tentar ler o ficheiro.`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Executa o motor de validação de regras sobre um conjunto de dados.
 */
function validateData(data, rules) {
  const errors = [];
  if (data.length === 0) return { errors, headers: [], rowCount: 0, headerRowIndex: 0 };

  const { headers, headerRowIndex } = findHeaderRow(data);
  
  // Se não houver cabeçalho ou linhas de dados, retorna vazio
  if (headers.length === 0 || data.length <= headerRowIndex + 1) {
      return { errors, headers, rowCount: 0, headerRowIndex };
  }

  const dataRows = data.slice(headerRowIndex + 1);

  dataRows.forEach((row, rowIndex) => {
    rules.forEach(rule => {
      const colIndex = headers.indexOf(rule.column);
      if (colIndex === -1) return; // Se a coluna da regra não existe na planilha, ignora a regra

      const cellValue = row[colIndex];
      const valueStr = String(cellValue || "").trim();
      let error = null;
      
      const originalRowInFullFile = headerRowIndex + 1 + rowIndex;

      switch (rule.type) {
        case 'not-empty':
          if (valueStr === '') error = `A célula não pode estar vazia.`;
          break;
        case 'is-unique': {
          if (valueStr === '') break; // Não valida unicidade em células vazias
          const firstIndex = dataRows.findIndex(r => String(r[colIndex] || "").trim() === valueStr);
          if (firstIndex !== rowIndex) {
            error = `O valor "${valueStr}" é duplicado (primeira ocorrência na linha ${headerRowIndex + 2 + firstIndex}).`;
          }
          break;
        }
        case 'is-number':
          if (valueStr !== '' && isNaN(Number(valueStr))) {
            error = `O valor "${valueStr}" não é um número válido.`;
          }
          break;
        case 'matches-regex':
          try {
            const regex = new RegExp(rule.value);
            if (valueStr !== '' && !regex.test(valueStr)) error = `"${valueStr}" não corresponde ao formato esperado.`;
          } catch (e) { console.error("Regex inválida:", rule); }
          break;
        case 'in-set':
          const allowedValues = rule.value.split(',').map(v => v.trim());
          if (valueStr !== '' && !allowedValues.includes(valueStr)) error = `"${valueStr}" não é um valor permitido. Esperado: ${rule.value}`;
          break;
      }

      if (error) {
        errors.push({
          id: `err-${rowIndex}-${colIndex}`,
          row: originalRowInFullFile + 1, // Número da linha para o utilizador (1-based)
          originalRowIndex: originalRowInFullFile, // Índice para mapeamento interno (0-based)
          column: rule.column,
          value: cellValue,
          message: error,
          ruleType: rule.type,
        });
      }
    });
  });
  return { errors, headers, rowCount: dataRows.length, headerRowIndex };
}


/**
 * Realiza uma análise completa no ficheiro da planilha.
 */
export async function runAnalysis(file, profile) {
  try {
    const data = await readFile(file);
    
    // O motor de validação agora é a fonte da verdade para cabeçalhos e contagens
    const { errors, headers, rowCount } = validateData(data, profile.rules || []);
    
    // Simula um pequeno atraso para dar feedback visual em ficheiros muito rápidos
    await new Promise(res => setTimeout(res, 300));

    const results = {
      success: true,
      metadata: { 
        fileName: file.name, 
        fileSize: file.size, 
        profileName: profile.name,
        profileId: profile.id
      },
      summary: { rowCount: rowCount, columnCount: headers.length, errorCount: errors.length },
      errors: errors, 
    };

    // Garante que a análise é guardada no histórico
    if (rowCount > 0) {
      saveToHistory(results);
    }

    return results;
  } catch (error) {
    console.error("Erro detalhado durante a análise:", error);
    return { success: false, error: error.message || 'Ocorreu um erro desconhecido ao processar o ficheiro.' };
  }
}