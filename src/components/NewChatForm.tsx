import { useState, type FormEvent } from 'react'
import { checkAccount } from '../api/greenApi'
import type { Chat, Credentials } from '../types'
import { normalizePhone } from './format'

interface Props {
  creds: Credentials
  onCreate: (chat: Chat) => void
}

export function NewChatForm({ creds, onCreate }: Props) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const digits = normalizePhone(phone)
    if (digits.length < 11 || digits.length > 12) {
      setError('Введите номер в международном формате, например 79991234567')
      return
    }
    setError('')
    setLoading(true)
    try {
      // MAX: получаем chatId по номеру телефона
      const res = await checkAccount(creds, Number(digits))
      if (!res.exist || !res.chatId) {
        setError('Этот номер не зарегистрирован в MAX')
        return
      }
      onCreate({ chatId: res.chatId, phone: digits, name: `+${digits}` })
      setPhone('')
    } catch {
      // Инстанс WhatsApp: метода CheckAccount нет, chatId строится из номера
      onCreate({ chatId: `${digits}@c.us`, phone: digits, name: `+${digits}` })
      setPhone('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="new-chat" onSubmit={handleSubmit}>
      <input
        className="new-chat__input"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Номер получателя, 79991234567"
        inputMode="tel"
      />
      <button className="btn btn--primary" type="submit" disabled={loading || !phone.trim()}>
        {loading ? '…' : 'Создать'}
      </button>
      {error && <div className="error new-chat__error">{error}</div>}
    </form>
  )
}
