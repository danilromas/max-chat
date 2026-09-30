import { useCallback, useEffect, useState } from 'react'

function read<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : initial
  } catch {
    return initial
  }
}

/** useState, который сохраняется в localStorage. При смене ключа значение перечитывается. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [state, setState] = useState(() => ({ key, value: read(key, initial) }))

  // ключ поменялся (например, вошли в другой инстанс) — подгружаем данные для нового ключа
  const current = state.key === key ? state.value : read(key, initial)
  if (state.key !== key) setState({ key, value: current })

  useEffect(() => {
    try {
      localStorage.setItem(state.key, JSON.stringify(state.value))
    } catch {
      /* localStorage может быть недоступен — работаем без сохранения */
    }
  }, [state])

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) =>
      setState((s) => ({
        key: s.key,
        value: typeof next === 'function' ? (next as (prev: T) => T)(s.value) : next,
      })),
    [],
  )

  return [current, setValue] as const
}
