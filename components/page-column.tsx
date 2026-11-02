import { Flex } from "@radix-ui/themes";

export function PageColumn({ children }: { children: React.ReactNode }) {
  return (
    <Flex direction="column" align="center" px="4" py={{ initial: "6", sm: "9" }}>
      <Flex
        direction="column"
        align="stretch"
        maxWidth="640px"
        width="100%"
        gap="6"
      >
        {children}
      </Flex>
    </Flex>
  );
}
