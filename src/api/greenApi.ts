import type { Credentials } from '../types'

export class GreenApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function buildUrl({ apiUrl, idInstance, apiTokenInstance }: Credentials, method: string, suffix = '') {
  const base = apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${idInstance}/${method}/${apiTokenInstance}${suffix}`
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new GreenApiError(text || res.statusText, res.status)
  }
  return (text ? JSON.parse(text) : null) as T
}

/** Состояние инстанса — используем при входе, чтобы проверить учётные данные */
export function getStateInstance(creds: Credentials) {
  return request<{ stateInstance: string }>(buildUrl(creds, 'getStateInstance'))
}

/**
 * В MAX писать можно только по chatId, поэтому номер телефона
 * сначала превращаем в chatId методом CheckAccount.
 */
export function checkAccount(creds: Credentials, phoneNumber: number) {
  return request<{ exist: boolean; chatId?: string }>(buildUrl(creds, 'checkAccount'), {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  })
}

export function sendMessage(creds: Credentials, chatId: string, message: string) {
  return request<{ idMessage: string }>(buildUrl(creds, 'sendMessage'), {
    method: 'POST',
    body: JSON.stringify({ chatId, message }),
  })
}

export interface Notification {
  receiptId: number
  body: {
    typeWebhook: string
    timestamp: number
    idMessage?: string
    senderData?: { chatId: string; chatName?: string; senderName?: string }
    messageData?: {
      typeMessage: string
      textMessageData?: { textMessage: string }
      extendedTextMessageData?: { text: string }
    }
  }
}

/** Long polling: сервер держит запрос до receiveTimeout секунд и возвращает null, если уведомлений нет */
export function receiveNotification(creds: Credentials, receiveTimeout = 5, signal?: AbortSignal) {
  return request<Notification | null>(buildUrl(creds, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`), {
    signal,
  })
}

export function deleteNotification(creds: Credentials, receiptId: number) {
  return request<{ result: boolean }>(buildUrl(creds, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
  })
}

/** Достаём текст из уведомления (обычный текст или текст со ссылкой) */
export function extractText(n: Notification): string | null {
  const data = n.body.messageData
  if (!data) return null
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null
  return null
}
