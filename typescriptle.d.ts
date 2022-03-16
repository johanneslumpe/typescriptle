import { WordNumber } from "./config";
import { WordList } from "./wordlist";

// Our word list is a large array of strings. Here we are converting it into a union.
// This allows us easily to check if a word is valid via the `extends` keyword.
type Words = WordList[number];

// The split type is used to turn a word, both a guess and our solution, into an array of characters.
// This is done via template literal types. These are types which allow us to match on the pattern of a
// string and extract parts from it. Below we can see that we split our string `T` by `Delimiter`, which by
// default is an empty string. Using an empty string will effectively split a string into all its individual characters.
// The `infer` keyword is used to tell TypeScript to figure out what the type at the given position is. In our case
// it means that TypeScript will extract our characters.
type Split<T extends string, Delimiter extends string = ""> =
  // If a string has characters both before and after the delimiter
  // we extract the parts around the delimiter, add the part in front of it
  // to our list of strings and then recursively call the Split type again with the
  // the rest of our string. The result of this we spread into the array we're returning.
  // This works just like array spreading in JavaScript.
  T extends `${infer Head}${Delimiter}${infer Tail}`
    ? [Head, ...Split<Tail, Delimiter>]
    : // This check deals with empty strings to ensure that they do not end up in our list of
    // characters. `B` matches on an empty string, so this will match `'A'`, but not `''`
    T extends `${infer A}${infer B}`
    ? [A]
    : [];

// The join type is the opposite of our above split type. In this case we are not allowing for a delimiter
// to be added back in. We are simply concatenating all elements in `T` back together.
// `...infer Tail` is the equivalent of JavaScript's `rest` operator (`...`).
// The below type checks if our input `T` is a list which has 1 or more items and if so,
// extract the first item, place it into a template string and then recursively call `Join` again
// with the rest of the list. Once we have extracted all our elements from the list, we have an empty
// list and will return an empty string, terminating the recursion.
// The helper functions `CastToString` and `CastToStringList` are used because TypeScript does not know that
// `Head` and `Tail` are actually of type `string` and `string[]` respectively, even though `T` has to be a `string[]`.
// Instead of casting it would also be fine to add two additional `extend` checks, one for `Head` and one for `Tail`.
// This would increase the ternary nesting though and since we can be certain that these are strings, casting is
// the easier option.
type Join<T extends string[]> = T extends [infer Head, ...infer Tail]
  ? `${CastToString<Head>}${Join<CastToStringList<Tail>>}`
  : "";

// These are just utility types to make the conditional types below more readable
type CharacterNotFound<Character extends string> = ` ⬛ ${Character} `;
type CharacterAtCorrectPosition<Character extends string> = ` 🟩 ${Character} `;
type CharacterFound<Character extends string> = ` 🟨 ${Character} `;
type EmptyWordPlaceholder = " ⬛    ⬛    ⬛    ⬛    ⬛  ";
type InvalidWord = "       INVALID WORD        ";

// This type will check for the existence of a character in a list of characters.
// It does this by recursively checking each charater in the list `SplitWorkd` against our
// character `CharacterToSearchFor`. Depending on the result we return the appropriate
// utility type.
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

// This type is used to determine whether `Word` is a valid word from our word list.
type ValidWord<Word> = Word extends Words ? true : false;

// As mentioned above, these are useful to help TypeScript hint at a given type, when
// we are certain that a given type must be either a string or a string list.
// We will always hit the first case, where `T` matches our predicate, so we will always
// return `T`. The fact that we else return the generic, wider type allows us to keep
// TypeScript from yelling at us about the type not being compatible wherever we expect
// either a `string` or `string[]`.
type CastToStringList<T> = T extends string[] ? T : string[];
type CastToString<T> = T extends string ? T : string;

// This type is our "entry" type for comparing two lists of characters.
// `GuessCharacterList` are the characters of the word that we guessed
// and `SolutionCharacterList` are the individual characters of the word we're looking for.
// Just as in our types above, we rely heavily on conditional types.
type CompareWords<
  GuessCharacterList extends string[],
  SolutionCharacterList extends string[],
  // The full list of characters for the solution which will remain untouched.
  // This is needed for checking existence of a character _somewhere_ in the whole solution
  FullSolutionCharacterList = SolutionCharacterList
> =
  // We need to have at least a list with one character to guess
  GuessCharacterList extends [
    infer CurrentGuessedLetter,
    ...infer RestOfGuessedWord
  ]
    ? // We also need at least one character in the list of characters of our solution
      SolutionCharacterList extends [
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
          // We call `CompareWords` recursively, with both the remaining guess characters and remaining
          // solution characters. It is importat that we also explicitly pass in `FullSolutionCharacterList`
          // so that it doesn't get reassigned to ` CastToStringList<RestOfSolution>` the next recursion.
          // If that happend we would not be able to check the whole list for general existence of a character
          // as the list would shrink with each recursion.
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

type GuessWord<Guess extends string> =
  // If we haven't guessed anything yet, we just show empty squares
  Guess extends ""
    ? EmptyWordPlaceholder
    : // Only if we guessed a generally valid word, we check how many characters matched
    ValidWord<Lowercase<Guess>> extends true
    ? Join<CompareWithSolution<Split<Lowercase<Guess>>>>
    : // Otherwise we report that the word was invalid
      InvalidWord;

// Basic utility type to give us a more declarative version of "string or nothing"
type Maybe<T> = T | undefined;

// This is our entry type which is a wrapper around `GuessWord` to enforce
// a maximum of six guesses. Additionally it returns the results in an object
// which gives us always a nice gridlike view due to each property
// being shown on its own line.
export type Guess<
  T extends [
    Maybe<string>,
    Maybe<string>,
    Maybe<string>,
    Maybe<string>,
    Maybe<string>,
    Maybe<string>
  ]
> = {
  // Since `T` must be assignable to our tuple of six strings
  // we can just access the values directly via their index
  "Guess 1": GuessWord<T[0]>;
  "Guess 2": GuessWord<T[1]>;
  "Guess 3": GuessWord<T[2]>;
  "Guess 4": GuessWord<T[3]>;
  "Guess 5": GuessWord<T[4]>;
  "Guess 6": GuessWord<T[5]>;
};
