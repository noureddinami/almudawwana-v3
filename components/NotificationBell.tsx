'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import toast from 'react-hot-toast'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

type Status = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

interface Props {
  className?: string
  /** Show as full labeled button (default: icon only) */
  labeled?: boolean
}

export default function NotificationBell({ className = '', labeled = false }: Props) {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  const subscribe = async () => {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        toast.error('يجب السماح بالإشعارات من إعدادات المتصفح')
        return
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: (json.keys as any)?.p256dh,
          auth: (json.keys as any)?.auth,
        }),
      })

      setStatus('subscribed')
      toast.success('🔔 سيتم إشعارك بكل تحديث جديد')
    } catch (e: any) {
      setStatus('unsubscribed')
      toast.error('تعذّر تفعيل الإشعارات')
    }
  }

  const unsubscribe = async () => {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
      toast('تم إيقاف الإشعارات', { icon: '🔕' })
    } catch {
      setStatus('subscribed')
      toast.error('تعذّر إيقاف الإشعارات')
    }
  }

  if (status === 'unsupported') return null

  const isSubscribed = status === 'subscribed'
  const isLoading   = status === 'loading'
  const isDenied    = status === 'denied'

  const handleClick = () => {
    if (isLoading || isDenied) return
    isSubscribed ? unsubscribe() : subscribe()
  }

  const icon = isDenied
    ? <BellOff className="w-5 h-5" />
    : isSubscribed
      ? <BellRing className="w-5 h-5 text-blue-600" />
      : <Bell className="w-5 h-5" />

  const label = isDenied
    ? 'الإشعارات محجوبة'
    : isSubscribed
      ? 'إيقاف الإشعارات'
      : 'تفعيل الإشعارات'

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isDenied}
      title={label}
      className={`
        flex items-center gap-2 transition-colors
        ${isDenied ? 'opacity-40 cursor-not-allowed' : 'hover:text-blue-600 cursor-pointer'}
        ${isLoading ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {isLoading
        ? <Bell className="w-5 h-5 animate-pulse" />
        : icon}
      {labeled && <span className="text-sm">{label}</span>}
    </button>
  )
}
