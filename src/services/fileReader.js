// src/services/fileReader.js

import * as XLSX from 'xlsx';

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
 * Lê o conteúdo completo de um ficheiro de planilha de forma assíncrona.
 * @param {File} file O ficheiro a ser lido.
 * @returns {Promise<Array<Array<string>>>} Uma promessa que resolve com o conteúdo da planilha como um array de arrays.
 */
export function readFileData(file) {
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
        reject(new Error("Erro ao processar o conteúdo do ficheiro."));
      }
    };
    reader.onerror = () => reject(new Error(`Ocorreu um erro ao tentar ler o ficheiro.`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Recebe os dados brutos de uma planilha e formata-os para serem usados numa grelha de dados.
 * @param {Array<Array<string>>} data Os dados brutos da planilha.
 * @returns {{columns: Array<object>, data: Array<object>, headerRowIndex: number}} Um objeto pronto para a grelha.
 */
export function processFileDataForGrid(data) {
  if (!data || data.length === 0) {
    return { columns: [], data: [], headerRowIndex: 0 };
  }

  const { headers, headerRowIndex } = findHeaderRow(data);

  const columns = headers.map(header => ({
    accessorKey: header,
    header: header,
  }));

  const dataRows = data.slice(headerRowIndex + 1);

  const formattedData = dataRows.map((row, rowIndex) => {
    const rowObject = {
      __originalRowIndex: headerRowIndex + 1 + rowIndex, // Guardamos o índice original para referência futura
    };
    headers.forEach((header, colIndex) => {
      rowObject[header] = row[colIndex];
    });
    return rowObject;
  });

  return { columns, data: formattedData, headerRowIndex };
}


/**
 * Função utilitária que combina a leitura e o processamento para o Assistente Inteligente.
 */
export async function extractHeadersFromFile(file) {
    const data = await readFileData(file);
    const { headers } = findHeaderRow(data);
    return headers;
}