'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import toast from 'react-hot-toast'
import { isPushSupported, getPushStatus, subscribeToPush, unsubscribeFromPush, getLastPushError } from '@/lib/pushSubscribe'

type Status = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading'

interface Props {
  className?: string
  labeled?: boolean
}

export default function NotificationBell({ className = '', labeled = false }: Props) {
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    if (!isPushSupported()) { setStatus('unsupported'); return }
    getPushStatus().then((s) => setStatus(s as Status))
  }, [])

  const handleSubscribe = async () => {
    setStatus('loading')
    const permission = await Notification.requestPermission()
    if (permission === 'denied') {
      setStatus('denied')
      toast.error('الإشعارات محجوبة — يرجى السماح بها من إعدادات المتصفح')
      return
    }
    const ok = await subscribeToPush()
    if (ok) {
      setStatus('subscribed')
      toast.success('🔔 تم تفعيل الإشعارات بنجاح')
    } else {
      setStatus('unsubscribed')
      const err = getLastPushError()
      toast.error(err || 'تعذّر تفعيل الإشعارات — تحقق من الاتصال', { duration: 5000 })
    }
  }

  const handleUnsubscribe = async () => {
    setStatus('loading')
    const ok = await unsubscribeFromPush()
    setStatus(ok ? 'unsubscribed' : 'subscribed')
    if (ok) toast('تم إيقاف الإشعارات', { icon: '🔕' })
  }

  if (status === 'unsupported') return null

  const isSubscribed = status === 'subscribed'
  const isLoading    = status === 'loading'
  const isDenied     = status === 'denied'

  const label = isDenied
    ? 'الإشعارات محجوبة'
    : isSubscribed ? 'إيقاف الإشعارات' : 'تفعيل الإشعارات'

  return (
    <button
      onClick={() => {
        if (isLoading || isDenied) return
        isSubscribed ? handleUnsubscribe() : handleSubscribe()
      }}
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
        : isDenied
          ? <BellOff className="w-5 h-5" />
          : isSubscribed
            ? <BellRing className="w-5 h-5 text-blue-600" />
            : <Bell className="w-5 h-5" />
      }
      {labeled && <span className="text-sm">{label}</span>}
    </button>
  )
}
