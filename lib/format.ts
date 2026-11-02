import type { Mode } from "./progress";

const pluralRules = new Intl.PluralRules("ru");

/** "1 вопрос", "3 вопроса", "5 вопросов". */
export function plural(
  count: number,
  forms: { one: string; few: string; many: string },
) {
  const rule = pluralRules.select(count);
  const form = rule === "one" || rule === "few" ? forms[rule] : forms.many;
  return `${count} ${form}`;
}

export function questions(count: number) {
  return plural(count, { one: "вопрос", few: "вопроса", many: "вопросов" });
}

export const modeLabels: Record<Mode, string> = {
  all: "Все вопросы",
  quick: "Быстрая проверка",
  mistakes: "Работа над ошибками",
};

export function grade(percent: number) {
  if (percent >= 90) return { label: "Отлично", color: "green" } as const;
  if (percent >= 80) return { label: "Хорошо", color: "teal" } as const;
  if (percent >= 70) return { label: "Удовлетворительно", color: "amber" } as const;
  return { label: "Неудовлетворительно", color: "red" } as const;
}

const dateFormat = new Intl.DateTimeFormat("ru", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(timestamp: number) {
  return dateFormat.format(timestamp);
}
