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

/** Subscribe the current browser to push notifications and save to DB.
 *  Returns true on success, false on failure. */
export async function subscribeToPush(): Promise<boolean> {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) {
      console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not defined')
      return false
    }

    const reg = await navigator.serviceWorker.ready
    const applicationServerKey = urlBase64ToUint8Array(publicKey)

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })

    const json = sub.toJSON()
    const p256dh = (json.keys as any)?.p256dh
    const auth   = (json.keys as any)?.auth

    if (!json.endpoint || !p256dh || !auth) {
      console.error('[Push] Subscription missing keys', json)
      return false
    }

    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: json.endpoint, p256dh, auth }),
    })

    if (!res.ok) {
      console.error('[Push] Server rejected subscription', await res.text())
      return false
    }

    return true
  } catch (e: any) {
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
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub ? 'subscribed' : 'unsubscribed'
  } catch {
    return 'unsubscribed'
  }
}
