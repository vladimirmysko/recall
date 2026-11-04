import dentistry from "@/data/dentistry.json";
import fissureSealing from "@/data/fissure-sealing.json";

export type Question = {
  id: number;
  text: string;
  options: string[];
  /** Index of the correct option in `options`. */
  answer: number;
};

export type Test = {
  id: string;
  title: string;
  questions: Question[];
};

/**
 * A test as stored in `data/`, with the correct option given by its letter as
 * in the source document: "a" for the first option, "b" for the second, etc.
 */
type TestData = Omit<Test, "questions"> & {
  questions: (Omit<Question, "answer"> & { answer: string })[];
};

const OPTION_LETTERS = "abcde";

function fromData(data: TestData): Test {
  return {
    ...data,
    questions: data.questions.map((question) => ({
      ...question,
      answer: OPTION_LETTERS.indexOf(question.answer),
    })),
  };
}

export const tests: Test[] = [fromData(fissureSealing), fromData(dentistry)];

export function getTest(id: string): Test | undefined {
  return tests.find((test) => test.id === id);
}
