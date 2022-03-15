import { WordNumber } from "./config";
import { WordList } from "./wordlist";

type Words = WordList[number];

type Split<
  T extends string,
  Delimiter extends string = ""
> = T extends `${infer Head}${Delimiter}${infer Tail}`
  ? [Head, ...Split<Tail, Delimiter>]
  : // This check deals with empty strings to ensure that they do not end up in our list of
  // characters. `B` matches on an empty string, so this will match `'A'`, but not `''`
  T extends `${infer A}${infer B}`
  ? [A]
  : [];

type Join<T extends string[]> = T extends [infer Head, ...infer Tail]
  ? `${CastToString<Head>}${Join<CastToStringList<Tail>>}`
  : "";

type CharacterNotFound<Character extends string> = ` ⬛ ${Character} `;
type CharacterAtCorrectPosition<Character extends string> = ` 🟩 ${Character} `;
type CharacterFound<Character extends string> = ` 🟨 ${Character} `;
type EmptyWordPlaceholder = " ⬛    ⬛    ⬛    ⬛    ⬛  ";
type InvalidWord = "       INVALID WORD        ";

type ContainsCharacter<
  SplitWord extends string[],
  CharacterToSearchFor extends string
> = SplitWord extends [infer CurrentCharacter, ...infer RestOfWord]
  ? // Character exists in solution, just not at the right spot
    CharacterToSearchFor extends CurrentCharacter
    ? CharacterFound<CharacterToSearchFor>
    : RestOfWord extends string[]
    ? // Recursively check the rest of the characters until we run out or find a match
      ContainsCharacter<RestOfWord, CharacterToSearchFor>
    : // Wrong character
      CharacterNotFound<CharacterToSearchFor>
  : // Wrong character
    CharacterNotFound<CharacterToSearchFor>;

type ValidWord<Word> = Word extends Words ? true : false;
type CastToStringList<T> = T extends string[] ? T : string[];
type CastToString<T> = T extends string ? T : string;

type CompareWords<
  GuessCharacterList extends string[],
  SolutionCharacterList extends string[],
  // The full list of characters for the solution which will remain untouched.
  // This is needed for checking existence of a character _somewhere_ in the whole solution
  FullSolutionCharacterList = SolutionCharacterList
> = GuessCharacterList extends [
  infer CurrentGuessedLetter,
  ...infer RestOfGuessedWord
]
  ? SolutionCharacterList extends [
      infer CurrentSolutionLetter,
      ...infer RestOfSolution
    ]
    ? [
        // If both letters at the current position match, the guessed letter is correct
        CurrentGuessedLetter extends CurrentSolutionLetter
          ? CharacterAtCorrectPosition<CastToString<CurrentGuessedLetter>>
          : // If they didn't match, the guessed letter might be used somewhere in the solution
            ContainsCharacter<
              CastToStringList<FullSolutionCharacterList>,
              CastToString<CurrentGuessedLetter>
            >,
        ...CompareWords<
          CastToStringList<RestOfGuessedWord>,
          CastToStringList<RestOfSolution>,
          FullSolutionCharacterList
        >
      ]
    : []
  : [];

// This wrapper type solely exists to hide the solution word from the expanded type that
// TypeScript reports. The usage of a generic and conditional type prevents expansion.
type CompareWithSolution<Guess> = Guess extends string[]
  ? CompareWords<Guess, Split<WordList[WordNumber]>>
  : never;

export type GuessWord<Guess extends string> = Guess extends ""
  ? EmptyWordPlaceholder
  : ValidWord<Lowercase<Guess>> extends true
  ? Join<CompareWithSolution<Split<Lowercase<Guess>>>>
  : InvalidWord;
