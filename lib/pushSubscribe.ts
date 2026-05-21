'use client'

/** Convert VAPID URL-safe base64 to Uint8Array */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}

/** Returns true if Web Push is supported in this browser */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

// ── Last error ───────────────────────────────────────────────
let _lastError = ''
export function getLastPushError(): string { return _lastError }

/** Get SW registration with timeout (mobile can be slow) */
async function getSwRegistration(): Promise<ServiceWorkerRegistration> {
  // Ensure SW is registered
  const regs = await navigator.serviceWorker.getRegistrations()
  if (regs.length === 0) {
    await navigator.serviceWorker.register('/sw.js')
  }

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('انتهت مهلة انتظار Service Worker — أعِد تحميل الصفحة وحاول مجدداً')),
        12000,
      )
    ),
  ])
}

/** Subscribe the current browser to push notifications and save to DB.
 *  Returns true on success, false on failure (check getLastPushError()). */
export async function subscribeToPush(): Promise<boolean> {
  _lastError = ''
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) {
      _lastError = 'مفتاح VAPID غير مُعرَّف — تحقق من إعدادات الخادم'
      console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined')
      return false
    }

    const reg = await getSwRegistration().catch((e: Error) => {
      _lastError = e.message
      throw e
    })

    const applicationServerKey = urlBase64ToUint8Array(publicKey)

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    }).catch((e: Error) => {
      _lastError = e.name === 'NotAllowedError'
        ? 'الإذن مرفوض — يرجى السماح بالإشعارات من إعدادات المتصفح'
        : `فشل الاشتراك: ${e.message}`
      console.error('[Push] pushManager.subscribe error:', e.name, e.message)
      throw e
    })

    const json = sub.toJSON()
    const p256dh = (json.keys as any)?.p256dh
    const auth   = (json.keys as any)?.auth

    if (!json.endpoint || !p256dh || !auth) {
      _lastError = 'الاشتراك ناقص — بيانات مفقودة'
      console.error('[Push] Subscription missing keys', json)
      return false
    }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: json.endpoint, p256dh, auth }),
    })

    if (!res.ok) {
      const text = await res.text()
      _lastError = `خطأ في الخادم (${res.status}): ${text}`
      console.error('[Push] Server rejected subscription', res.status, text)
      return false
    }

    return true
  } catch (e: any) {
    if (!_lastError) _lastError = e?.message ?? 'خطأ غير معروف'
    console.error('[Push] subscribeToPush error:', e?.name, e?.message)
    return false
  }
}

/** Unsubscribe and remove from DB. Returns true on success. */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return true

    await fetch('/api/push/subscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })

    await sub.unsubscribe()
    return true
  } catch (e: any) {
    console.error('[Push] unsubscribeFromPush error:', e?.message)
    return false
  }
}

/** Get current subscription status without triggering any prompts */
export async function getPushStatus(): Promise<'subscribed' | 'unsubscribed' | 'denied' | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const reg = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    const sub = await reg.pushManager.getSubscription()
    return sub ? 'subscribed' : 'unsubscribed'
  } catch {
    return 'unsubscribed'
  }
}
