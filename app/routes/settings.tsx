import { useEffect, useState, useCallback } from 'react';
import { requireAuth } from '~/lib/auth.server';
import type { Route } from './+types/settings';
import { CATEGORIES } from '~/lib/constants';
import type { BudgetSettings } from '~/lib/budget';
import { getBudgetSettings, saveBudgetSettings } from '~/lib/budget';
import {
  requestNotificationPermission,
  isNotificationEnabled,
  getDailyReminderTime,
  setDailyReminderTime,
  scheduleDailyReminder,
  getCustomNotifMessage,
  setCustomNotifMessage,
  sendLocalNotification,
} from '~/lib/notifications';
import { getStoredTheme, saveTheme } from '~/lib/theme';
import type { Theme } from '~/lib/theme';

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

function formatIDR(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseIDR(value: string): number {
  return Number(value.replace(/\./g, '')) || 0;
}

export default function Settings() {
  const [theme, setThemeState] = useState<Theme>('system');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [reminderTime, setReminderTimeState] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [budget, setBudget] = useState<BudgetSettings>({ totalBudget: null, categoryBudgets: {} });
  const [totalBudgetInput, setTotalBudgetInput] = useState('');
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    // Apply stored theme on mount
    const stored = getStoredTheme();
    setThemeState(stored);

    setNotifEnabled(isNotificationEnabled());
    if ('Notification' in window) setNotifPermission(Notification.permission);
    const storedTime = getDailyReminderTime();
    if (storedTime) setReminderTimeState(storedTime);
    const storedMsg = getCustomNotifMessage();
    setCustomMessage(storedMsg);

    const b = getBudgetSettings();
    setBudget(b);
    if (b.totalBudget) setTotalBudgetInput(formatIDR(String(b.totalBudget)));
  }, []);

  function handleThemeChange(newTheme: Theme) {
    setThemeState(newTheme);
    saveTheme(newTheme);
  }

  async function handleEnableNotif() {
    const granted = await requestNotificationPermission();
    setNotifEnabled(granted);
    if ('Notification' in window) setNotifPermission(Notification.permission);
    if (granted && reminderTime) {
      scheduleDailyReminder();
    }
  }

  function handleSaveNotif() {
    setDailyReminderTime(reminderTime || null);
    setCustomNotifMessage(customMessage);
    if (reminderTime && isNotificationEnabled()) {
      scheduleDailyReminder();
    }
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  }

  function handleTestNotif() {
    const msg = customMessage || 'Jangan lupa catat pengeluaran hari ini!';
    sendLocalNotification('💰 DuitLog Reminder', msg);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  }

  function handleTotalBudgetChange(value: string) {
    setTotalBudgetInput(formatIDR(value));
  }

  function handleCategoryBudgetChange(category: string, value: string) {
    const num = parseIDR(value);
    setBudget((prev) => ({
      ...prev,
      categoryBudgets: {
        ...prev.categoryBudgets,
        [category]: num || undefined,
      },
    }));
  }

  const handleSaveBudget = useCallback(() => {
    const newBudget: BudgetSettings = {
      totalBudget: parseIDR(totalBudgetInput) || null,
      categoryBudgets: budget.categoryBudgets,
    };
    saveBudgetSettings(newBudget);
    setBudget(newBudget);
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  }, [totalBudgetInput, budget.categoryBudgets]);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-white dark:bg-slate-950">
      <header className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Settings
        </h1>
      </header>

      <div className="flex flex-col gap-6 px-4 pb-24">

        {/* ── Dark Mode ── */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Tampilan
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'system', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  theme === t
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t === 'light' ? '☀️ Terang' : t === 'dark' ? '🌙 Gelap' : '⚙️ Sistem'}
              </button>
            ))}
          </div>
        </section>

        {/* ── Notifikasi ── */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Notifikasi
          </h2>

          {notifPermission === 'denied' ? (
            <p className="text-sm text-red-500">
              Notifikasi diblokir di browser. Aktifkan dari pengaturan browser kamu.
            </p>
          ) : !notifEnabled ? (
            <button
              onClick={handleEnableNotif}
              className="w-full rounded-xl bg-slate-900 dark:bg-white py-3 text-sm font-semibold text-white dark:text-slate-900"
            >
              🔔 Aktifkan Notifikasi
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Notifikasi aktif</span>
              </div>

              {/* Jam pengingat */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Jam Pengingat Harian
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTimeState(e.target.value)}
                    className="flex-1 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  />
                  {reminderTime && (
                    <button
                      onClick={() => setReminderTimeState('')}
                      className="text-xs text-slate-400 hover:text-red-400"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>

              {/* Custom pesan notifikasi */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Pesan Notifikasi (custom)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Jangan lupa catat pengeluaran hari ini!"
                  maxLength={100}
                  rows={2}
                  className="w-full rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-slate-900 dark:focus:border-slate-400 resize-none"
                />
                <p className="mt-1 text-xs text-slate-400">{customMessage.length}/100 karakter</p>
              </div>

              {/* Tombol simpan & test */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNotif}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    notifSaved
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  }`}
                >
                  {notifSaved ? '✓ Tersimpan!' : 'Simpan'}
                </button>
                <button
                  onClick={handleTestNotif}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all border-2 ${
                    testSent
                      ? 'border-green-500 text-green-500'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {testSent ? '✓ Terkirim!' : 'Test Notif'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Budget Bulanan ── */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Budget Bulanan
          </h2>
          <p className="mb-3 text-xs text-slate-400">Budget tersimpan di perangkat ini.</p>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Total Budget Bulanan (IDR)
            </label>
            <div className="flex items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 px-4 py-3 focus-within:border-slate-900 dark:focus-within:border-slate-400">
              <span className="text-sm font-semibold text-slate-400">IDR</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={totalBudgetInput}
                onChange={(e) => handleTotalBudgetChange(e.target.value)}
                className="w-full bg-transparent text-xl font-bold text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Budget per Kategori (opsional)
            </label>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                    {cat}
                  </span>
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <span className="text-xs text-slate-400">IDR</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Tidak dibatasi"
                      value={
                        budget.categoryBudgets[cat]
                          ? formatIDR(String(budget.categoryBudgets[cat]))
                          : ''
                      }
                      onChange={(e) => handleCategoryBudgetChange(cat, e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveBudget}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
              budgetSaved
                ? 'bg-green-500 text-white'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
            }`}
          >
            {budgetSaved ? '✓ Tersimpan!' : 'Simpan Budget'}
          </button>
        </section>
      </div>
    </main>
  );
}