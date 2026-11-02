import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageColumn } from "@/components/page-column";
import { Quiz, QuizSkeleton } from "@/components/quiz";
import { getTest, tests } from "@/lib/tests";

type Params = PageProps<"/tests/[testId]/quiz">["params"];

export function generateStaticParams() {
  return tests.map((test) => ({ testId: test.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/tests/[testId]/quiz">): Promise<Metadata> {
  const { testId } = await params;
  return { title: getTest(testId)?.title };
}

// The page reads the test from `params` inside <Suspense>, so the route's
// App Shell can show the skeleton while navigating to the quiz.
export default function QuizPage({
  params,
}: PageProps<"/tests/[testId]/quiz">) {
  return (
    <PageColumn>
      <Suspense fallback={<QuizSkeleton />}>
        <QuizContent params={params} />
      </Suspense>
    </PageColumn>
  );
}

async function QuizContent({ params }: { params: Params }) {
  const { testId } = await params;
  const test = getTest(testId);
  if (!test) notFound();

  return <Quiz test={test} />;
}
