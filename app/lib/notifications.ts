export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function isNotificationEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && Notification.permission === 'granted';
}

export function sendLocalNotification(title: string, body: string, icon = '/icon-192.png') {
  if (!isNotificationEnabled()) return;
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      icon,
    });
  } else {
    new Notification(title, { body, icon });
  }
}

const REMINDER_KEY = 'duitlog-daily-reminder';
const CUSTOM_MSG_KEY = 'duitlog-notif-message';

export function getDailyReminderTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REMINDER_KEY);
}

export function setDailyReminderTime(time: string | null) {
  if (time) {
    localStorage.setItem(REMINDER_KEY, time);
  } else {
    localStorage.removeItem(REMINDER_KEY);
  }
}

export function getCustomNotifMessage(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(CUSTOM_MSG_KEY) || '';
}

export function setCustomNotifMessage(message: string) {
  if (message.trim()) {
    localStorage.setItem(CUSTOM_MSG_KEY, message.trim());
  } else {
    localStorage.removeItem(CUSTOM_MSG_KEY);
  }
}

export function scheduleDailyReminder() {
  const time = getDailyReminderTime();
  if (!time || !isNotificationEnabled()) return;

  const [hours, minutes] = time.split(':').map(Number);

  function scheduleNext() {
    const now = new Date();
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const msUntil = next.getTime() - now.getTime();
    setTimeout(() => {
      const msg = getCustomNotifMessage() || 'Jangan lupa catat pengeluaran hari ini!';
      sendLocalNotification('💰 DuitLog Reminder', msg);
      scheduleNext();
    }, msUntil);
  }

  scheduleNext();
}

export function sendBudgetWarningNotification(percentage: number, remaining: number) {
  const formattedRemaining = new Intl.NumberFormat('id-ID').format(remaining);
  if (percentage >= 100) {
    sendLocalNotification('🚨 Budget Terlampaui!', 'Pengeluaran bulan ini sudah melebihi budget kamu.');
  } else if (percentage >= 80) {
    sendLocalNotification('⚠️ Budget Hampir Habis', `Sisa budget bulan ini: IDR ${formattedRemaining}`);
  }
}