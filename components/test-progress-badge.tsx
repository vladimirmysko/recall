"use client";

import { Badge } from "@radix-ui/themes";

import { useProgress } from "@/lib/progress";
import type { Test } from "@/lib/tests";

export function TestProgressBadge({ test }: { test: Test }) {
  const progress = useProgress(test.id);
  if (!progress) return null;

  const learned = test.questions.filter(
    (question) => progress.results[question.id],
  ).length;
  if (learned === 0) return <Badge color="gray">Не начат</Badge>;

  const percent = Math.round((learned / test.questions.length) * 100);
  return (
    <Badge color={percent === 100 ? "green" : undefined}>
      Выучено {percent}%
    </Badge>
  );
}
