import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorage } from './useLocalStorage.js';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('useLocalStorage', () => {
  it('retorna valor inicial quando chave não existe', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 42));
    expect(result.current[0]).toBe(42);
  });

  it('carrega valor existente do localStorage na inicialização', () => {
    localStorage.setItem('test-key', JSON.stringify('valor salvo'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'padrão'));
    expect(result.current[0]).toBe('valor salvo');
  });

  it('persiste novo valor no localStorage ao chamar setter', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', ''));

    act(() => {
      result.current[1]('novo valor');
    });

    expect(result.current[0]).toBe('novo valor');
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe('novo valor');
  });

  it('suporta setter funcional (prev) => next', () => {
    const { result } = renderHook(() => useLocalStorage('test-count', 0));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(JSON.parse(localStorage.getItem('test-count'))).toBe(1);
  });

  it('persiste objetos complexos corretamente', () => {
    const { result } = renderHook(() => useLocalStorage('test-obj', {}));
    const data = { name: 'Dr. Teste', minVal: 2000, days: ['Sex', 'Sáb'] };

    act(() => {
      result.current[1](data);
    });

    expect(result.current[0]).toEqual(data);
    expect(JSON.parse(localStorage.getItem('test-obj'))).toEqual(data);
  });

  it('persiste arrays corretamente', () => {
    const { result } = renderHook(() => useLocalStorage('test-arr', []));

    act(() => {
      result.current[1]([1, 2, 3]);
    });

    expect(result.current[0]).toEqual([1, 2, 3]);
    expect(JSON.parse(localStorage.getItem('test-arr'))).toEqual([1, 2, 3]);
  });

  it('trata erros de JSON.parse retornando valor inicial', () => {
    localStorage.setItem('test-broken', 'valor-invalido-nao-json{{{');
    const { result } = renderHook(() => useLocalStorage('test-broken', 'padrão'));
    expect(result.current[0]).toBe('padrão');
  });

  it('hooks diferentes com chaves diferentes são independentes', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('key-a', 'a'));
    const { result: result2 } = renderHook(() => useLocalStorage('key-b', 'b'));

    act(() => {
      result1.current[1]('atualizado-a');
    });

    expect(result1.current[0]).toBe('atualizado-a');
    expect(result2.current[0]).toBe('b');
  });
});
