import { useCallback } from 'react'
import { extractText, sendMessage, type Notification } from './api/greenApi'
import { ChatWindow } from './components/ChatWindow'
import { LoginForm } from './components/LoginForm'
import { Sidebar } from './components/Sidebar'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useNotifications } from './hooks/useNotifications'
import type { Chat, Credentials, Message } from './types'

export default function App() {
  const [creds, setCreds] = useLocalStorage<Credentials | null>('max-chat:creds', null)
  // чаты и сообщения храним отдельно для каждого инстанса
  const scope = creds?.idInstance ?? 'none'
  const [chats, setChats] = useLocalStorage<Chat[]>(`max-chat:${scope}:chats`, [])
  const [messages, setMessages] = useLocalStorage<Message[]>(`max-chat:${scope}:messages`, [])
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>(`max-chat:${scope}:active`, null)

  const addChat = useCallback(
    (chat: Chat) => {
      setChats((prev) => (prev.some((c) => c.chatId === chat.chatId) ? prev : [...prev, chat]))
      setActiveChatId(chat.chatId)
    },
    [setChats, setActiveChatId],
  )

  const handleNotification = useCallback(
    (n: Notification) => {
      const text = extractText(n)
      const chatId = n.body.senderData?.chatId
      if (!text || !chatId) return // только текстовые сообщения

      const incoming = n.body.typeWebhook === 'incomingMessageReceived'
      const id = n.body.idMessage ?? `${n.receiptId}`

      setMessages((prev) =>
        // сообщение, отправленное из этого интерфейса, уже есть в списке — не дублируем
        prev.some((m) => m.id === id)
          ? prev
          : [...prev, { id, chatId, text, outgoing: !incoming, timestamp: n.body.timestamp, status: 'sent' }],
      )

      // если написал новый собеседник — добавляем чат в список, но не переключаемся на него
      setChats((prev) =>
        prev.some((c) => c.chatId === chatId)
          ? prev
          : [...prev, { chatId, phone: '', name: n.body.senderData?.chatName || n.body.senderData?.senderName || chatId }],
      )
    },
    [setMessages, setChats],
  )

  useNotifications(creds, handleNotification)

  async function handleSend(text: string) {
    if (!creds || !activeChatId) return
    const tempId = `local-${Date.now()}`
    const chatId = activeChatId
    setMessages((prev) => [
      ...prev,
      { id: tempId, chatId, text, outgoing: true, timestamp: Math.floor(Date.now() / 1000), status: 'sending' },
    ])
    try {
      const { idMessage } = await sendMessage(creds, chatId, text)
      setMessages((prev) =>
        // если уведомление об этом сообщении уже пришло раньше ответа — убираем временную копию
        prev.some((m) => m.id === idMessage)
          ? prev.filter((m) => m.id !== tempId)
          : prev.map((m) => (m.id === tempId ? { ...m, id: idMessage, status: 'sent' } : m)),
      )
    } catch {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'error' } : m)))
    }
  }

  if (!creds) return <LoginForm onLogin={setCreds} />

  const activeChat = chats.find((c) => c.chatId === activeChatId) ?? null

  return (
    <div className="layout">
      <Sidebar
        creds={creds}
        chats={chats}
        messages={messages}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onCreate={addChat}
        onLogout={() => setCreds(null)}
      />
      <ChatWindow
        chat={activeChat}
        messages={messages.filter((m) => m.chatId === activeChatId).sort((a, b) => a.timestamp - b.timestamp)}
        onSend={handleSend}
      />
    </div>
  )
}
