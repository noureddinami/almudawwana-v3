/**
 * Sends a push notification to all subscribed users.
 * Call this from admin pages after successful create/update operations.
 * Failures are logged but never block admin operations.
 */
export async function sendPushNotification(payload: {
  title: string
  body: string
  url?: string
}): Promise<void> {
  try {
    const res = await fetch('/api/admin/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[Push] send failed:', res.status, data)
    } else {
      console.info(`[Push] sent to ${data.sent}/${data.total} subscribers`)
    }
  } catch (e: any) {
    console.error('[Push] fetch error:', e?.message)
  }
}
