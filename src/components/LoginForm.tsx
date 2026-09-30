import { useState, type FormEvent } from 'react'
import { getStateInstance } from '../api/greenApi'
import type { Credentials } from '../types'

interface Props {
  onLogin: (creds: Credentials) => void
}

export function LoginForm({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState('https://api.green-api.com')
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const creds = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    }
    setError('')
    setLoading(true)
    try {
      const { stateInstance } = await getStateInstance(creds)
      if (stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (состояние: ${stateInstance}). Подключите аккаунт в личном кабинете GREEN-API.`)
        return
      }
      onLogin(creds)
    } catch {
      setError('Не удалось подключиться. Проверьте apiUrl, idInstance и apiTokenInstance.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo">MAX</div>
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__hint">Введите данные инстанса из личного кабинета GREEN-API</p>

        <label className="field">
          <span>apiUrl</span>
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required />
        </label>
        <label className="field">
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            inputMode="numeric"
            placeholder="3100000000"
            required
          />
        </label>
        <label className="field">
          <span>apiTokenInstance</span>
          <input
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            type="password"
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
