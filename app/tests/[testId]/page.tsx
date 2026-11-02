import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Flex, Heading, Skeleton, Text } from "@radix-ui/themes";
import { ArrowLeftIcon } from "@heroicons/react/16/solid";

import { PageColumn } from "@/components/page-column";
import { TestOverview, TestOverviewSkeleton } from "@/components/test-overview";
import { questions } from "@/lib/format";
import { getTest, tests } from "@/lib/tests";

type Params = PageProps<"/tests/[testId]">["params"];

export function generateStaticParams() {
  return tests.map((test) => ({ testId: test.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/tests/[testId]">): Promise<Metadata> {
  const { testId } = await params;
  return { title: getTest(testId)?.title };
}

// The page reads the test from `params` inside <Suspense>, so the route's
// App Shell can show the skeleton while navigating to a test.
export default function TestPage({ params }: PageProps<"/tests/[testId]">) {
  return (
    <PageColumn>
      <Suspense
        fallback={
          <>
            <Header />
            <TestOverviewSkeleton />
          </>
        }
      >
        <TestContent params={params} />
      </Suspense>
    </PageColumn>
  );
}

async function TestContent({ params }: { params: Params }) {
  const { testId } = await params;
  const test = getTest(testId);
  if (!test) notFound();

  return (
    <>
      <Header
        title={test.title}
        subtitle={questions(test.questions.length)}
      />
      <TestOverview test={test} />
    </>
  );
}

function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <Flex direction="column" align="start" gap="4">
      <Button variant="ghost" color="gray" asChild>
        <Link href="/">
          <ArrowLeftIcon width="16" height="16" />
          Все тесты
        </Link>
      </Button>
      <Flex direction="column" gap="1" width="100%">
        <Heading size="7">
          <Skeleton loading={!title}>{title ?? "Название теста"}</Skeleton>
        </Heading>
        <Text color="gray">
          <Skeleton loading={!subtitle}>{subtitle ?? "100 вопросов"}</Skeleton>
        </Text>
      </Flex>
    </Flex>
  );
}
