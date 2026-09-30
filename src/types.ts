export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface Message {
  id: string
  chatId: string
  text: string
  /** true — сообщение отправили мы, false — пришло от собеседника */
  outgoing: boolean
  timestamp: number
  status?: 'sending' | 'sent' | 'error'
}

export interface Chat {
  chatId: string
  phone: string
  name: string
}
