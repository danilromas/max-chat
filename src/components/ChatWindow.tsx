import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Chat, Message } from '../types'
import { formatTime } from './format'

interface Props {
  chat: Chat | null
  messages: Message[]
  onSend: (text: string) => void
}

export function ChatWindow({ chat, messages, onSend }: Props) {
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, chat?.chatId])

  if (!chat) {
    return (
      <main className="chat chat--empty">
        <p>Выберите чат или создайте новый</p>
      </main>
    )
  }

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter — отправить, Shift+Enter — перенос строки
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <main className="chat">
      <header className="chat__header">
        <span className="avatar">{chat.name.replace('+', '').slice(0, 2)}</span>
        <div>
          <div className="chat__name">{chat.name}</div>
          <div className="chat__sub">chatId: {chat.chatId}</div>
        </div>
      </header>

      <div className="chat__messages">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.outgoing ? 'bubble--out' : 'bubble--in'}`}>
            <span className="bubble__text">{m.text}</span>
            <span className="bubble__meta">
              {formatTime(m.timestamp)}
              {m.outgoing && m.status === 'sending' && ' · отправка…'}
              {m.outgoing && m.status === 'error' && ' · ошибка'}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          className="composer__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          rows={1}
          maxLength={4000}
        />
        <button className="btn btn--primary composer__send" type="submit" disabled={!text.trim()} aria-label="Отправить">
          ➤
        </button>
      </form>
    </main>
  )
}
