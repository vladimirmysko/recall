import { Card, Flex, Heading, Text } from "@radix-ui/themes";

export default function HomePage() {
  return (
    <Flex
      height="100dvh"
      width="100vw"
      direction="column"
      align="center"
      px="4"
      py="9"
    >
      <Flex
        direction="column"
        align="stretch"
        maxWidth="560px"
        width="100%"
        gap="8"
      >
        <Card variant="classic" size="3">
          <Flex direction="row" justify="between" align="center">
            <Heading>Test name</Heading>
            <Text size="2">N questions</Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  );
}
