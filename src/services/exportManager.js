// src/services/exportManager.js

function escapeCsvValue(value) {
  const str = String(value == null ? "" : value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function convertErrorsToCSV(errors) {
  if (!errors || errors.length === 0) {
    return "";
  }

  const headers = ['Linha', 'Coluna', 'Valor Encontrado', 'Problema'];
  const rows = errors.map(error => [
    error.row,
    error.column,
    error.value,
    error.message
  ]);

  const headerRow = headers.map(escapeCsvValue).join(',');
  const contentRows = rows.map(row => row.map(escapeCsvValue).join(','));

  return [headerRow, ...contentRows].join('\n');
}