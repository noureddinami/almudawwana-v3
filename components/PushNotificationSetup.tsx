'use client'

/**
 * PushNotificationSetup — Auto-activates push notifications by default.
 *
 * Behaviour:
 * - If permission is already 'granted' and user is not subscribed → subscribe silently
 * - If permission is 'default' (never asked) → request permission after 4s, then subscribe
 * - If permission is 'denied' → do nothing (user will see "blocked" in bell icon)
 * - Stores attempt flag in localStorage to avoid repeated prompts
 */

import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { isPushSupported, getPushStatus, subscribeToPush } from '@/lib/pushSubscribe'

const STORAGE_KEY = 'push_setup_v1'

export default function PushNotificationSetup() {
  useEffect(() => {
    if (!isPushSupported()) return

    const setup = async () => {
      const alreadyDone = localStorage.getItem(STORAGE_KEY)
      const currentStatus = await getPushStatus()

      // Already subscribed → ensure DB is in sync (silent re-subscribe if needed)
      if (currentStatus === 'subscribed') {
        localStorage.setItem(STORAGE_KEY, 'done')
        return
      }

      // Denied → nothing we can do
      if (currentStatus === 'denied') {
        localStorage.setItem(STORAGE_KEY, 'denied')
        return
      }

      // Already attempted before → only re-subscribe if permission is already granted
      if (alreadyDone === 'done' || alreadyDone === 'denied') {
        if (Notification.permission === 'granted' && currentStatus === 'unsubscribed') {
          // Silent re-subscribe (e.g. after browser cleared subscriptions)
          await subscribeToPush()
        }
        return
      }

      // ── First time setup ────────────────────────────────────────
      if (Notification.permission === 'granted') {
        // Permission was already granted in a previous session → subscribe silently
        const ok = await subscribeToPush()
        if (ok) toast.success('🔔 الإشعارات مفعّلة', { duration: 2000 })
        localStorage.setItem(STORAGE_KEY, 'done')
        return
      }

      // permission === 'default' → ask after a short delay
      const timer = setTimeout(async () => {
        try {
          const permission = await Notification.requestPermission()
          localStorage.setItem(STORAGE_KEY, permission === 'granted' ? 'done' : 'denied')
          if (permission === 'granted') {
            const ok = await subscribeToPush()
            if (ok) toast.success('🔔 تم تفعيل الإشعارات تلقائياً', { duration: 3000 })
          }
        } catch (e) {
          console.error('[PushSetup] requestPermission error:', e)
        }
      }, 4000) // 4 seconds after page load

      return () => clearTimeout(timer)
    }

    setup()
  }, [])

  return null // No UI — runs silently in background
}
