import Link from "next/link";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";

import { PageColumn } from "@/components/page-column";
import { TestProgressBadge } from "@/components/test-progress-badge";
import { questions } from "@/lib/format";
import { tests } from "@/lib/tests";

export default function HomePage() {
  return (
    <PageColumn>
      <Flex direction="column" gap="1">
        <Heading size="8">Recall</Heading>
        <Text color="gray">Выберите тест, чтобы начать подготовку</Text>
      </Flex>

      <Flex direction="column" gap="3">
        {tests.map((test) => (
          <Card key={test.id} variant="classic" size="3" asChild>
            <Link href={`/tests/${test.id}`}>
              <Flex direction="column" gap="2">
                <Heading size="4">{test.title}</Heading>
                <Flex justify="between" align="center" gap="3">
                  <Text size="2" color="gray">
                    {questions(test.questions.length)}
                  </Text>
                  <TestProgressBadge test={test} />
                </Flex>
              </Flex>
            </Link>
          </Card>
        ))}
      </Flex>
    </PageColumn>
  );
}
