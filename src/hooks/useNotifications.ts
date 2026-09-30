import { useEffect, useRef } from 'react'
import { deleteNotification, receiveNotification, type Notification } from '../api/greenApi'
import type { Credentials } from '../types'

const MESSAGE_WEBHOOKS = new Set([
  'incomingMessageReceived',
  'outgoingMessageReceived',
  'outgoingAPIMessageReceived',
])

/**
 * Получение сообщений через HTTP API: в цикле забираем уведомление из очереди
 * (receiveNotification, long polling до 5 секунд), обрабатываем его
 * и подтверждаем обработку (deleteNotification), чтобы очередь двигалась дальше.
 */
export function useNotifications(creds: Credentials | null, onNotification: (n: Notification) => void) {
  // держим актуальный обработчик в ref, чтобы не перезапускать цикл при каждом рендере
  const handlerRef = useRef(onNotification)
  useEffect(() => {
    handlerRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    if (!creds) return
    const controller = new AbortController()
    let stopped = false

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    async function loop() {
      while (!stopped) {
        try {
          const notification = await receiveNotification(creds!, 5, controller.signal)
          if (!notification) continue
          if (MESSAGE_WEBHOOKS.has(notification.body.typeWebhook)) {
            handlerRef.current(notification)
          }
          // уведомления других типов (статусы и т.п.) нам не нужны — просто удаляем
          await deleteNotification(creds!, notification.receiptId)
        } catch (e) {
          if (stopped || (e as Error).name === 'AbortError') return
          console.error('Ошибка получения уведомлений', e)
          await sleep(3000)
        }
      }
    }

    loop()
    return () => {
      stopped = true
      controller.abort()
    }
  }, [creds])
}
