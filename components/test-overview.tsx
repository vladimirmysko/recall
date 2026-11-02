"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Progress,
  RadioCards,
  Skeleton,
  Switch,
  Table,
  Text,
} from "@radix-ui/themes";
import { ArrowPathIcon, PlayIcon } from "@heroicons/react/16/solid";

import { formatDate, grade, modeLabels, questions } from "@/lib/format";
import {
  type Mode,
  type Progress as TestProgress,
  mistakeIds,
  QUICK_SIZE,
  resetProgress,
  startSession,
  useProgress,
} from "@/lib/progress";
import type { Test } from "@/lib/tests";

export function TestOverview({ test }: { test: Test }) {
  const progress = useProgress(test.id);
  if (!progress) return <TestOverviewSkeleton />;

  const session = progress.session;
  return (
    <Flex direction="column" gap="4">
      <ProgressCard test={test} progress={progress} />
      {session && !session.finishedAt && (
        <ResumeCard
          testId={test.id}
          label={modeLabels[session.mode]}
          current={session.current + 1}
          total={session.questionIds.length}
        />
      )}
      <StartCard test={test} progress={progress} />
      {progress.attempts.length > 0 && <History progress={progress} />}
      <Box>
        <ResetButton testId={test.id} />
      </Box>
    </Flex>
  );
}

export function TestOverviewSkeleton() {
  return (
    <Flex direction="column" gap="4">
      <Skeleton height="140px" />
      <Skeleton height="380px" />
    </Flex>
  );
}

function ProgressCard({
  test,
  progress,
}: {
  test: Test;
  progress: TestProgress;
}) {
  const total = test.questions.length;
  const learned = test.questions.filter((q) => progress.results[q.id]).length;
  const mistakes = mistakeIds(test, progress).length;
  const unanswered = total - learned - mistakes;

  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Flex justify="between" align="baseline">
          <Heading size="4">Прогресс</Heading>
          <Text size="2" color="gray">
            {Math.round((learned / total) * 100)}%
          </Text>
        </Flex>
        <Progress value={(learned / total) * 100} size="3" />
        <Grid columns="3" gap="3">
          <Stat label="Выучено" value={learned} color="green" />
          <Stat label="С ошибкой" value={mistakes} color="red" />
          <Stat label="Не отвечено" value={unanswered} color="gray" />
        </Grid>
        <Text size="1" color="gray">
          Вопрос считается выученным, если на него в последний раз ответили
          верно.
        </Text>
      </Flex>
    </Card>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "red" | "gray";
}) {
  return (
    <Flex direction="column">
      <Text size="6" weight="bold" color={color}>
        {value}
      </Text>
      <Text size="2" color="gray">
        {label}
      </Text>
    </Flex>
  );
}

function ResumeCard({
  testId,
  label,
  current,
  total,
}: {
  testId: string;
  label: string;
  current: number;
  total: number;
}) {
  const router = useRouter();
  return (
    <Card size="3">
      <Flex justify="between" align="center" gap="4" wrap="wrap">
        <Flex direction="column" gap="1">
          <Heading size="4">Незавершённая попытка</Heading>
          <Text size="2" color="gray">
            {label} · вопрос {current} из {total}
          </Text>
        </Flex>
        <Button onClick={() => router.push(`/tests/${testId}/quiz`)}>
          Продолжить
        </Button>
      </Flex>
    </Card>
  );
}

function StartCard({ test, progress }: { test: Test; progress: TestProgress }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("quick");
  const [exam, setExam] = useState(false);

  const mistakes = mistakeIds(test, progress).length;
  const selectedMode = mode === "mistakes" && mistakes === 0 ? "quick" : mode;

  function start() {
    startSession(test, selectedMode, exam);
    router.push(`/tests/${test.id}/quiz`);
  }

  return (
    <Card size="3">
      <Flex direction="column" gap="4">
        <Heading size="4">Новая попытка</Heading>

        <RadioCards.Root
          value={selectedMode}
          onValueChange={(value) => setMode(value as Mode)}
          columns="1"
        >
          <ModeCard
            value="quick"
            title={modeLabels.quick}
            description={`${questions(Math.min(QUICK_SIZE, test.questions.length))} в случайном порядке`}
          />
          <ModeCard
            value="all"
            title={modeLabels.all}
            description={`${questions(test.questions.length)} в случайном порядке`}
          />
          <ModeCard
            value="mistakes"
            title={modeLabels.mistakes}
            description={
              mistakes > 0
                ? `${questions(mistakes)}, на которые вы ответили неверно`
                : "Ошибок пока нет"
            }
            disabled={mistakes === 0}
          />
        </RadioCards.Root>

        <Text as="label" size="2">
          <Flex gap="3" align="start">
            <Switch checked={exam} onCheckedChange={setExam} mt="1" />
            <Flex direction="column">
              <Text weight="bold">Режим экзамена</Text>
              <Text color="gray">
                Правильные ответы покажутся только в конце
              </Text>
            </Flex>
          </Flex>
        </Text>

        <Flex justify="end">
          <Button size="3" onClick={start}>
            <PlayIcon width="16" height="16" />
            Начать
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

function ModeCard({
  value,
  title,
  description,
  disabled,
}: {
  value: Mode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <RadioCards.Item value={value} disabled={disabled}>
      <Flex direction="column" width="100%">
        <Text weight="bold">{title}</Text>
        <Text size="2" color="gray">
          {description}
        </Text>
      </Flex>
    </RadioCards.Item>
  );
}

function History({ progress }: { progress: TestProgress }) {
  return (
    <Card size="3">
      <Flex direction="column" gap="3">
        <Heading size="4">История попыток</Heading>
        <Table.Root size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Дата</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Режим</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">
                Результат
              </Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {progress.attempts.slice(0, 10).map((attempt) => {
              const percent = Math.round(
                (attempt.correct / attempt.total) * 100,
              );
              return (
                <Table.Row key={attempt.finishedAt}>
                  <Table.Cell>{formatDate(attempt.finishedAt)}</Table.Cell>
                  <Table.Cell>
                    {modeLabels[attempt.mode]}
                    {attempt.exam && (
                      <Text color="gray"> · экзамен</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell justify="end">
                    <Text color={grade(percent).color}>
                      {attempt.correct}/{attempt.total}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Flex>
    </Card>
  );
}

function ResetButton({ testId }: { testId: string }) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button variant="ghost" color="gray">
          <ArrowPathIcon width="16" height="16" />
          Сбросить прогресс
        </Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="420px">
        <AlertDialog.Title>Сбросить прогресс?</AlertDialog.Title>
        <AlertDialog.Description size="2">
          Результаты, ошибки и история попыток по этому тесту будут удалены.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Отмена
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" onClick={() => resetProgress(testId)}>
              Сбросить
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
