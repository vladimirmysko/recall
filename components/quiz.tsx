"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Progress,
  RadioCards,
  Skeleton,
  Text,
} from "@radix-ui/themes";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/16/solid";

import { grade, modeLabels } from "@/lib/format";
import {
  answer,
  countCorrect,
  next,
  type Session,
  startSession,
  useProgress,
} from "@/lib/progress";
import type { Question, Test } from "@/lib/tests";

export function Quiz({ test }: { test: Test }) {
  const progress = useProgress(test.id);
  if (!progress) return <QuizSkeleton />;

  const session = progress.session;
  if (!session) {
    return (
      <Card size="3">
        <Flex direction="column" align="start" gap="3">
          <Heading size="4">Нет активной попытки</Heading>
          <Text color="gray">Выберите режим на странице теста.</Text>
          <Button asChild>
            <Link href={`/tests/${test.id}`}>К тесту</Link>
          </Button>
        </Flex>
      </Card>
    );
  }

  if (session.finishedAt) return <Results test={test} session={session} />;

  return (
    <QuestionView
      key={`${session.startedAt}-${session.current}`}
      test={test}
      session={session}
    />
  );
}

export function QuizSkeleton() {
  return (
    <Flex direction="column" gap="4">
      <Skeleton height="40px" />
      <Skeleton height="420px" />
    </Flex>
  );
}

function BackButton({ testId }: { testId: string }) {
  return (
    <Button variant="ghost" color="gray" asChild>
      <Link href={`/tests/${testId}`}>
        <ArrowLeftIcon width="16" height="16" />К тесту
      </Link>
    </Button>
  );
}

function QuestionView({ test, session }: { test: Test; session: Session }) {
  const index = session.current;
  const total = session.questionIds.length;
  const question = test.questions.find(
    (q) => q.id === session.questionIds[index],
  )!;
  const order = session.optionOrders[index];
  const chosen = session.answers[index];

  // In exam mode the choice stays here until "Далее", so it can be changed.
  const [selected, setSelected] = useState<number | null>(null);
  const value = session.exam ? selected : chosen;
  const revealed = !session.exam && chosen !== null;

  function choose(option: number) {
    if (session.exam) setSelected(option);
    else if (chosen === null) answer(test, option);
  }

  function proceed() {
    if (session.exam) {
      if (selected === null) return;
      answer(test, selected);
    } else if (chosen === null) {
      return;
    }
    next(test);
  }

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Keys 1–5 pick an option, and Enter moves on.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
        return;
      }
      const number = Number(event.key);
      if (number >= 1 && number <= order.length) {
        choose(order[number - 1]);
      } else if (event.key === "Enter") {
        // A focused button handles Enter itself.
        const target = event.target as Element;
        if (target.closest?.('button:not([role="radio"]), a')) return;
        event.preventDefault();
        proceed();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const isLast = index === total - 1;
  const canProceed = session.exam ? selected !== null : chosen !== null;

  return (
    <Flex direction="column" gap="5">
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <BackButton testId={test.id} />
          <Flex gap="2" align="center">
            {session.exam && <Badge color="gray">Экзамен</Badge>}
            <Text size="2" color="gray">
              Вопрос {index + 1} из {total}
            </Text>
          </Flex>
        </Flex>
        <Progress value={(index / total) * 100} />
      </Flex>

      <Card size={{ initial: "2", sm: "3" }}>
        <Flex direction="column" gap="4">
          <Heading size={{ initial: "4", sm: "5" }}>{question.text}</Heading>

          <RadioCards.Root
            value={value === null ? "" : String(value)}
            onValueChange={(option) => choose(Number(option))}
            columns="1"
          >
            {order.map((option, position) => (
              <RadioCards.Item key={option} value={String(option)}>
                <Flex width="100%" align="center" gap="3">
                  <Text color="gray" size="2">
                    {position + 1}
                  </Text>
                  <Text style={{ flex: 1 }}>{question.options[option]}</Text>
                  {revealed && option === question.answer && (
                    <Text color="green" asChild>
                      <CheckCircleIcon width="20" height="20" />
                    </Text>
                  )}
                  {revealed &&
                    option === chosen &&
                    option !== question.answer && (
                      <Text color="red" asChild>
                        <XCircleIcon width="20" height="20" />
                      </Text>
                    )}
                </Flex>
              </RadioCards.Item>
            ))}
          </RadioCards.Root>

          {revealed && <Feedback question={question} chosen={chosen} />}
        </Flex>
      </Card>

      <Flex justify="end">
        <Button size="3" disabled={!canProceed} onClick={proceed}>
          {isLast ? "Завершить" : "Далее"}
        </Button>
      </Flex>
    </Flex>
  );
}

function Feedback({ question, chosen }: { question: Question; chosen: number }) {
  if (chosen === question.answer) {
    return (
      <Callout.Root color="green">
        <Callout.Icon>
          <CheckCircleIcon width="16" height="16" />
        </Callout.Icon>
        <Callout.Text>Верно!</Callout.Text>
      </Callout.Root>
    );
  }
  return (
    <Callout.Root color="red">
      <Callout.Icon>
        <XCircleIcon width="16" height="16" />
      </Callout.Icon>
      <Callout.Text>
        Неверно. Правильный ответ: {question.options[question.answer]}
      </Callout.Text>
    </Callout.Root>
  );
}

function Results({ test, session }: { test: Test; session: Session }) {
  const total = session.questionIds.length;
  const correct = countCorrect(test, session);
  const percent = Math.round((correct / total) * 100);
  const { label, color } = grade(percent);

  const mistakes = session.questionIds
    .map((id, index) => ({
      question: test.questions.find((q) => q.id === id)!,
      chosen: session.answers[index],
    }))
    .filter(({ question, chosen }) => chosen !== question.answer);

  function restart(questionIds?: number[]) {
    startSession(
      test,
      questionIds ? "mistakes" : session.mode,
      session.exam,
      questionIds,
    );
    window.scrollTo({ top: 0 });
  }

  return (
    <Flex direction="column" gap="5">
      <Box>
        <BackButton testId={test.id} />
      </Box>

      <Card size="4">
        <Flex direction="column" align="center" gap="3">
          <Text color="gray">
            {modeLabels[session.mode]}
            {session.exam && " · экзамен"}
          </Text>
          <Heading size="9">{percent}%</Heading>
          <Badge size="3" color={color}>
            {label}
          </Badge>
          <Text>
            Правильных ответов: {correct} из {total}
          </Text>
          <Flex gap="3" mt="3" wrap="wrap" justify="center">
            {mistakes.length > 0 && (
              <Button
                size="3"
                onClick={() => restart(mistakes.map((m) => m.question.id))}
              >
                Повторить ошибки
              </Button>
            )}
            {session.mode !== "mistakes" && (
              <Button size="3" variant="soft" onClick={() => restart()}>
                <ArrowPathIcon width="16" height="16" />
                Пройти ещё раз
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>

      {mistakes.length > 0 ? (
        <Flex direction="column" gap="3">
          <Heading size="5">Ошибки · {mistakes.length}</Heading>
          {mistakes.map(({ question, chosen }) => (
            <Card key={question.id} size="2">
              <Flex direction="column" gap="3">
                <Text weight="bold">{question.text}</Text>
                {chosen !== null && (
                  <AnswerLine
                    correct={false}
                    text={question.options[chosen]}
                  />
                )}
                <AnswerLine
                  correct
                  text={question.options[question.answer]}
                />
              </Flex>
            </Card>
          ))}
        </Flex>
      ) : (
        <Callout.Root color="green" size="2">
          <Callout.Icon>
            <CheckCircleIcon width="16" height="16" />
          </Callout.Icon>
          <Callout.Text>Ни одной ошибки, отличная работа!</Callout.Text>
        </Callout.Root>
      )}
    </Flex>
  );
}

function AnswerLine({ correct, text }: { correct: boolean; text: string }) {
  const Icon = correct ? CheckCircleIcon : XCircleIcon;
  return (
    <Flex gap="2" align="start">
      <Text color={correct ? "green" : "red"} asChild>
        <Icon width="16" height="16" style={{ flexShrink: 0, marginTop: 3 }} />
      </Text>
      <Text size="2" color={correct ? "green" : "red"}>
        {text}
      </Text>
    </Flex>
  );
}
