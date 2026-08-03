import { Capacitor } from '@capacitor/core';

// The web Notification API cannot deliver notifications while the app/tab
// isn't open, and doesn't exist at all in a reliable form inside a
// Capacitor WKWebView on iOS. On native platforms we schedule real,
// OS-level local notifications via @capacitor/local-notifications instead,
// which fire even when the app is backgrounded or closed - required for
// a "daily reminder" feature to actually work as advertised on iOS.
//
// This module is imported dynamically inside each function so that web
// builds (which don't have the native plugin registered) never pay for
// loading it, and so this file has zero effect on the existing browser
// behavior in DailyReminder.jsx / DailyReflection.jsx beyond routing
// through it.

export function isNative() {
  return Capacitor.isNativePlatform();
}

export async function getPermissionStatus() {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.checkPermissions();
    return display; // 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
}

export async function requestPermission() {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.requestPermissions();
    return display;
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.requestPermission();
}

/**
 * Schedules a repeating daily local notification at the given time.
 * `id` must be a small stable positive integer per "slot" (e.g. 1 for the
 * reading reminder, 2 for the reflection reminder) so re-scheduling
 * replaces the previous one instead of stacking duplicates.
 * No-op on web - the web fallback path is the existing foreground
 * setTimeout logic already in DailyReminder.jsx/DailyReflection.jsx,
 * since browsers have no API to schedule a notification ahead of time.
 */
export async function scheduleDailyReminder({ id, title, body, hour, minute }) {
  if (!isNative()) return;

  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id,
        title,
        body,
        schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
      },
    ],
  });
}

export async function cancelReminder(id) {
  if (!isNative()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.cancel({ notifications: [{ id }] });
}

/** Fire-and-forget confirmation notification (e.g. "Reminders enabled"). */
export async function showImmediateNotification({ title, body }) {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [{ id: Date.now() % 1000000, title, body }],
    });
    return;
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body });
    } catch (e) {
      /* ignore - some browsers restrict this */
    }
  }
}

// Stable notification IDs used across the app - keep in sync with callers.
export const NOTIFICATION_IDS = {
  DAILY_READING_REMINDER: 1,
  DAILY_REFLECTION_REMINDER: 2,
};
