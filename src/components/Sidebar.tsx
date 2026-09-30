import type { Chat, Credentials, Message } from '../types'
import { NewChatForm } from './NewChatForm'
import { formatTime } from './format'

interface Props {
  creds: Credentials
  chats: Chat[]
  messages: Message[]
  activeChatId: string | null
  onSelect: (chatId: string) => void
  onCreate: (chat: Chat) => void
  onLogout: () => void
}

export function Sidebar({ creds, chats, messages, activeChatId, onSelect, onCreate, onLogout }: Props) {
  const lastByChat = new Map<string, Message>()
  for (const m of messages) {
    const prev = lastByChat.get(m.chatId)
    if (!prev || prev.timestamp <= m.timestamp) lastByChat.set(m.chatId, m)
  }

  const sorted = [...chats].sort(
    (a, b) => (lastByChat.get(b.chatId)?.timestamp ?? 0) - (lastByChat.get(a.chatId)?.timestamp ?? 0),
  )

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <span className="sidebar__title">Чаты</span>
        <button className="btn btn--ghost" onClick={onLogout} title={`Инстанс ${creds.idInstance}`}>
          Выйти
        </button>
      </header>

      <NewChatForm creds={creds} onCreate={onCreate} />

      <ul className="chat-list">
        {sorted.length === 0 && <li className="chat-list__empty">Создайте чат по номеру телефона</li>}
        {sorted.map((chat) => {
          const last = lastByChat.get(chat.chatId)
          return (
            <li key={chat.chatId}>
              <button
                className={`chat-item ${chat.chatId === activeChatId ? 'chat-item--active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <span className="avatar">{chat.name.replace('+', '').slice(0, 2)}</span>
                <span className="chat-item__body">
                  <span className="chat-item__row">
                    <span className="chat-item__name">{chat.name}</span>
                    {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                  </span>
                  <span className="chat-item__preview">
                    {last ? `${last.outgoing ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
