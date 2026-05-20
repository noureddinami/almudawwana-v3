/**
 * Sends a push notification to all subscribed users.
 * Call this from admin pages after successful create/update operations.
 * Failures are silently ignored (notifications are non-critical).
 */
export async function sendPushNotification(payload: {
  title: string
  body: string
  url?: string
}): Promise<void> {
  try {
    await fetch('/api/admin/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Notifications are non-critical — never block admin operations
  }
}
