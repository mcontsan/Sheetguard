// src/hooks/useDebounce.js

import { useState, useEffect } from 'react';

/**
 * Hook customizado para "atrasar" a atualização de um valor.
 * Útil para campos de busca, para evitar re-renderizações a cada tecla.
 * @param {any} value O valor a ser "atrasado" (ex: o texto da busca).
 * @param {number} delay O tempo de atraso em milissegundos.
 * @returns O valor após o atraso.
 */
export function useDebounce(value, delay) {
  // Estado para armazenar o valor "atrasado"
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Cria um temporizador que só vai atualizar o estado
    // após o 'delay' especificado
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Função de limpeza: se o valor mudar (usuário digita de novo),
    // o temporizador anterior é cancelado e um novo é criado.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Roda o efeito novamente apenas se o valor ou o delay mudarem

  return debouncedValue;
}