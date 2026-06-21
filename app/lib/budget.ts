import type { Category } from './constants';

export interface BudgetSettings {
  totalBudget: number | null; // total monthly budget in IDR
  categoryBudgets: Partial<Record<Category, number>>; // per-category budgets
}

const BUDGET_KEY = 'duitlog-budget';

export function getBudgetSettings(): BudgetSettings {
  if (typeof window === 'undefined') {
    return { totalBudget: null, categoryBudgets: {} };
  }
  try {
    const stored = localStorage.getItem(BUDGET_KEY);
    if (!stored) return { totalBudget: null, categoryBudgets: {} };
    return JSON.parse(stored) as BudgetSettings;
  } catch {
    return { totalBudget: null, categoryBudgets: {} };
  }
}

export function saveBudgetSettings(settings: BudgetSettings) {
  localStorage.setItem(BUDGET_KEY, JSON.stringify(settings));
}

export function getBudgetProgress(
  totalSpent: number,
  settings: BudgetSettings,
): {
  percentage: number;
  isWarning: boolean;
  isOver: boolean;
  remaining: number;
} | null {
  if (!settings.totalBudget) return null;
  const percentage = (totalSpent / settings.totalBudget) * 100;
  return {
    percentage: Math.min(percentage, 100),
    isWarning: percentage >= 80,
    isOver: percentage >= 100,
    remaining: settings.totalBudget - totalSpent,
  };
}