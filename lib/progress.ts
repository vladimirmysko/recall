import { useSyncExternalStore } from "react";

import type { Test } from "./tests";

// Progress lives in the browser's localStorage, one key per test. There are no
// accounts, so each device keeps its own progress.

export type Mode = "all" | "quick" | "mistakes";

export type Session = {
  mode: Mode;
  /** In exam mode, answers are revealed only on the results screen. */
  exam: boolean;
  questionIds: number[];
  /** For each question, the order to show its options in, as option indexes. */
  optionOrders: number[][];
  /** For each question, the index of the chosen option, or null. */
  answers: (number | null)[];
  current: number;
  startedAt: number;
  finishedAt: number | null;
};

export type Attempt = {
  mode: Mode;
  exam: boolean;
  correct: number;
  total: number;
  finishedAt: number;
};

export type Progress = {
  /** Whether the latest answer to each question, by id, was correct. */
  results: Record<number, boolean>;
  attempts: Attempt[];
  session: Session | null;
};

export const QUICK_SIZE = 20;
const MAX_ATTEMPTS = 50;

const emptyProgress: Progress = { results: {}, attempts: [], session: null };

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: Progress }>();

function storageKey(testId: string) {
  return `recall:progress:${testId}`;
}

function read(testId: string): Progress {
  const cached = cache.get(testId);
  let raw: string | null;
  try {
    raw = localStorage.getItem(storageKey(testId));
  } catch {
    // Storage is blocked, so keep what this page has in memory.
    return cached?.value ?? emptyProgress;
  }
  if (cached && cached.raw === raw) return cached.value;

  let value = emptyProgress;
  if (raw) {
    try {
      value = { ...emptyProgress, ...JSON.parse(raw) };
    } catch {}
  }
  cache.set(testId, { raw, value });
  return value;
}

function write(testId: string, update: (progress: Progress) => Progress) {
  const value = update(read(testId));
  const raw = JSON.stringify(value);
  cache.set(testId, { raw, value });
  try {
    localStorage.setItem(storageKey(testId), raw);
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the progress.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith("recall:")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** The test's progress, or null while rendering on the server. */
export function useProgress(testId: string): Progress | null {
  return useSyncExternalStore(
    subscribe,
    () => read(testId),
    () => null,
  );
}

export function mistakeIds(test: Test, progress: Progress) {
  return test.questions
    .filter((question) => progress.results[question.id] === false)
    .map((question) => question.id);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Starts a session with the questions for `mode`, or with `questionIds` when
 * given. Questions and their options are shuffled.
 */
export function startSession(
  test: Test,
  mode: Mode,
  exam: boolean,
  questionIds?: number[],
) {
  write(test.id, (progress) => {
    let ids = questionIds ?? test.questions.map((question) => question.id);
    if (!questionIds && mode === "mistakes") ids = mistakeIds(test, progress);
    ids = shuffle(ids);
    if (!questionIds && mode === "quick") ids = ids.slice(0, QUICK_SIZE);

    const questions = new Map(test.questions.map((q) => [q.id, q]));
    return {
      ...progress,
      session: {
        mode,
        exam,
        questionIds: ids,
        optionOrders: ids.map((id) =>
          shuffle(questions.get(id)!.options.map((_, index) => index)),
        ),
        answers: ids.map(() => null),
        current: 0,
        startedAt: Date.now(),
        finishedAt: null,
      },
    };
  });
}

/** Records `choice` as the answer to the session's current question. */
export function answer(test: Test, choice: number) {
  write(test.id, (progress) => {
    const session = progress.session;
    if (!session || session.finishedAt) return progress;

    const id = session.questionIds[session.current];
    const question = test.questions.find((q) => q.id === id)!;
    const answers = [...session.answers];
    answers[session.current] = choice;
    return {
      ...progress,
      results: { ...progress.results, [id]: choice === question.answer },
      session: { ...session, answers },
    };
  });
}

/** Moves to the next question, or finishes the session after the last one. */
export function next(test: Test) {
  write(test.id, (progress) => {
    const session = progress.session;
    if (!session || session.finishedAt) return progress;

    if (session.current < session.questionIds.length - 1) {
      return {
        ...progress,
        session: { ...session, current: session.current + 1 },
      };
    }

    const finishedAt = Date.now();
    const attempt: Attempt = {
      mode: session.mode,
      exam: session.exam,
      correct: countCorrect(test, session),
      total: session.questionIds.length,
      finishedAt,
    };
    return {
      ...progress,
      attempts: [attempt, ...progress.attempts].slice(0, MAX_ATTEMPTS),
      session: { ...session, finishedAt },
    };
  });
}

export function countCorrect(test: Test, session: Session) {
  const questions = new Map(test.questions.map((q) => [q.id, q]));
  return session.questionIds.filter(
    (id, index) => session.answers[index] === questions.get(id)!.answer,
  ).length;
}

export function resetProgress(testId: string) {
  write(testId, () => emptyProgress);
}
