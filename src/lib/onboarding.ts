// --- Онбординг первого запуска: показан ли уже, есть ли у человека данные (тестировщики до релиза) ---

const KEY = 'bar-onboarded-v1';
/** хранилище недоступно (приватный режим) — помним до закрытия вкладки */
let sessionDone = false;

const has = (key: string) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? 'null');
    return Array.isArray(v) ? v.length > 0 : !!v;
  } catch {
    return false;
  }
};

/** Первый запуск: онбординг не пройден и в приложении ещё ничего нет (бар, избранное, авторские) */
export function shouldOnboard(): boolean {
  if (sessionDone) return false;
  try {
    if (localStorage.getItem(KEY)) return false;
  } catch {
    return !sessionDone;
  }
  return !['bar-inventory-v1', 'bar-favorites-v1', 'bar-custom-cocktails-v1', 'bar-bottles-v1'].some(has);
}

export function markOnboarded() {
  sessionDone = true;
  try {
    localStorage.setItem(KEY, new Date().toISOString());
  } catch {
    // приватный режим — только до закрытия вкладки
  }
}

/** Хэш онбординга: открыт поверх корня, «Назад» его закрывает */
export const ONBOARDING_HASH = '#intro';
