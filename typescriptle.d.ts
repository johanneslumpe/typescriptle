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
    T extends `${infer A}${string}`
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

// This type might look like it returns an object, but in fact it returns a list of all keys in the list
// Example: ArrayKeyList<[true, true]> would return `['0', '1']`
type ArrayKeyList<T extends unknown[]> = {
  [P in keyof T]: P;
};
// This type turns a list into a union. This type is the backbone of our ability to compare numbers
// Example: KeyUnion<['0', '1']> would return `'0' | '1'`
type KeyUnion<T extends any[]> = ArrayKeyList<T>[number];

// Converts a given number to a tuple of `Replacement`. This enables us to use numeric values when comparing tuples/lists
// as we can use the resulting tuple can be used for conditional type checking.
type NumberToTuple<
  T extends number,
  Replacement = true,
  IsLengthInclusive extends boolean = false,
  R extends Replacement[] = []
> =
  // if the length of built-up list has reached the number we are looking for
  R["length"] extends T
    ? // special case to increase the resulting length by 1. This is useful for cases where we use this type downstream and convert it to a union, which requires the actual number to be part of it.
      // This is due to lists being 0 based, which would usually omit the actual number from our indexes
      IsLengthInclusive extends true
      ? [Replacement, ...R]
      : R
    : NumberToTuple<T, Replacement, IsLengthInclusive, [Replacement, ...R]>;

// Checks whether `T` is greater or than or equal to `R`. This type works by checking whether the stringified version of `T`
// extends the key union of the tuple version of `R`. Given that we convert our number `R` into a tuple of the same length as the number
// we can check for inclusiveness in its key union to determine whether `T` is at least as large as `R`.
// Note: this type does not work for negative numbers.
type GreaterThanOrEqual<
  T extends number,
  R extends number
> = `${T}` extends KeyUnion<NumberToTuple<R>> ? false : true;

// Basically the same type as above, except that it enforces that `T` must be strictly larger than `R`.
// It does so by using `NumberToTuple`'s `IsLengthInclusive` case, which will ensure that `R` is actually part
// of the resulting union.
// If the stringified version of `T` can be found in the union, then it is not grater than `R`.
type GreaterThan<T extends number, R extends number> = `${T}` extends KeyUnion<
  NumberToTuple<R, true, true>
>
  ? false
  : true;

// A utility type to make things more readable when computing lengths
type Length<T extends { length: number }> = T["length"];

// Utility type to check boolean intersections for trueness
type IsTrue<T extends boolean> = [T] extends [never]
  ? T extends false
    ? false
    : false
  : T extends false
  ? false
  : true;

// Boolean OR utility type
type Or<T1, T2> = T1 extends true ? true : T2 extends true ? true : false;
// Boolean AND utility type
type And<T1, T2> = T1 extends true ? (T2 extends true ? true : false) : false;

// This is a very crude type to allow iteration over tuples. It allows us to keep track of the current index
// All it does is provide a linked list of numbers that will end in `OUT_OF_BOUNDS` when we are trying to iterate
// outside of the number of supported values. This is a way to iterate finite lists. In our case we do not need
// more than 5 values, so 0-4 will suffice. This type is loosely based on a similar type in `ts-toolbelt`.
type Iteration = PossibleIterations[keyof PossibleIterations];
type PossibleIterations = {
  OUT_OF_BOUNDS: [-1, "OUT_OF_BOUNDS"];
  0: [0, 1];
  1: [1, 2];
  2: [2, 3];
  3: [3, 4];
  4: [4, "OUT_OF_BOUNDS"];
};

// utility types to walk through the iteration list
type IterationOf<T extends keyof PossibleIterations> = PossibleIterations[T];
type IterationValue<T extends Iteration> = T[0];
type NextIteration<T extends Iteration> = PossibleIterations[T[1]];

// Given `Character` will find all instances of it in `T` and return `true[]` with a length
// matching the number of times `Character` was found
type GetAllCharacterOccurrences<Character extends string, T extends string[]> =
  // If our list has elements in it
  T extends [infer Head, ...infer Tail]
    ? // and the currrent head matches our search character
      Character extends Head
      ? // add an entry to our return value and recurse
        [true, ...GetAllCharacterOccurrences<Character, CastToStringList<Tail>>]
      : // else just recurse
        GetAllCharacterOccurrences<Character, CastToStringList<Tail>>
    : // return an empty list to terminate recursion once we have exhausted the list
      [];

// Slices `List` from `IndexToStartAt` until the end
type SliceStartingAt<
  IndexToStartAt extends number,
  List extends unknown[]
> = List extends [...NumberToTuple<IndexToStartAt, any>, ...infer Rest]
  ? Rest
  : List;

// Slices a list from index 0 to `IndexToSliceUpTo`.
type SliceUpTo<
  IndexToSliceUpTo extends number,
  List extends unknown[],
  PoppedList extends unknown[] = List,
  Accumulator extends unknown[] = []
> =
  // Check if the list we have received contains at least as many items as the index we want to start slicing at
  GreaterThanOrEqual<Length<List>, IndexToSliceUpTo> extends true
    ? // If our `Accumulator` has reached the length of the index we want to slice up to
      // we have successfully sliced off enough elements
      GreaterThanOrEqual<Length<Accumulator>, IndexToSliceUpTo> extends true
      ? Accumulator
      : // Otherwise we check if we have more elements to slice and, if so, will
      // keep recursing with a new entry added to `Accumulator`.
      PoppedList extends [infer Head, ...infer Tail]
      ? SliceUpTo<IndexToSliceUpTo, List, Tail, [...Accumulator, Head]>
      : // We have no more elements to recurse over, terminate
        []
    : // If the list does not contain enough items, just return it as is
      List;

// Will return the number of characters in `List` which match `Character` after the index specified by our interation `I`
type GetCharacterOccurrencesAfterIndex<
  Character extends string,
  List extends string[],
  I extends Iteration
> =
  // guard against out of bounds iteration
  IterationValue<NextIteration<I>> extends number & infer NextIterationValue
    ? Length<
        GetAllCharacterOccurrences<
          Character,
          CastToStringList<
            SliceStartingAt<CastToNumber<NextIterationValue>, List>
          >
        >
      >
    : '"out of bounds, cannot compute"';

// Will return the number of characters in `List` which match `Character` after the index specified by our interation `I`
type GetCharacterOccurrencesBeforeIndex<
  Character extends string,
  List extends string[],
  I extends Iteration
> = Length<
  GetAllCharacterOccurrences<
    Character,
    CastToStringList<SliceUpTo<IterationValue<I>, List>>
  >
>;

// Computes `true[]` with the length of the number of times `Character` was matched at the same index in `T` and `R`.
// Example: `GetExactmatches<'c', ['a','b','c','c','d'], ['c','a','c','c','e']>` would return `[true, true]` as we have two matches.
type GetExactMatches<
  Character extends string,
  T extends string[],
  R extends string[]
> = T extends [infer Head, ...infer Tail]
  ? R extends [infer RHead, ...infer RTail]
    ? Character extends Head & RHead
      ? [
          true,
          ...GetExactMatches<
            Character,
            CastToStringList<Tail>,
            CastToStringList<RTail>
          >
        ]
      : GetExactMatches<
          Character,
          CastToStringList<Tail>,
          CastToStringList<RTail>
        >
    : []
  : [];

// These are just utility types to make the conditional types below more readable
type CharacterNotFound<Character extends string> = ` ⬛ ${Character} `;
type CharacterAtCorrectPosition<Character extends string> = ` 🟩 ${Character} `;
type CharacterFound<Character extends string> = ` 🟨 ${Character} `;
type EmptyWordPlaceholder = " ⬛    ⬛    ⬛    ⬛    ⬛  ";
type InvalidWord = "       INVALID WORD        ";
type InvalidCase =
  "This is an invalid case and should never happen, please report a bug with steps to reproduce, thanks!";

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
    : // Recursively check the rest of the characters until we run out or find a match
      ContainsCharacter<CastToStringList<RestOfWord>, CharacterToSearchFor>
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
type CastToNumber<T> = T extends number ? T : number;

// Utility type to compute counts required for our calculations.
type ComputeCounts<
  CurrentCharacter extends string,
  FullSolution extends string[],
  FullGuess extends string[],
  I extends Iteration
> = [
  MatchingCharactersAfterCurrentIndexForSolution: CastToNumber<
    GetCharacterOccurrencesAfterIndex<
      CastToString<CurrentCharacter>,
      FullSolution,
      I
    >
  >,
  MatchingCharactersBeforeCurrentIndexForSolution: CastToNumber<
    GetCharacterOccurrencesBeforeIndex<
      CastToString<CurrentCharacter>,
      FullSolution,
      I
    >
  >,
  MatchingCharactersAfterCurrentIndexForGuess: CastToNumber<
    GetCharacterOccurrencesAfterIndex<
      CastToString<CurrentCharacter>,
      FullGuess,
      I
    >
  >,
  MatchingCharactersBeforeCurrentIndexForGuess: CastToNumber<
    GetCharacterOccurrencesBeforeIndex<
      CastToString<CurrentCharacter>,
      FullGuess,
      I
    >
  >
];

type LowercaseString<T> = CastToString<Lowercase<T>>;

// This type is our "entry" type for comparing two lists of characters.
// `CurrentGuessCharacterList` are the characters of the word that we guessed
// and `CurrentSolutionCharacterList` are the individual characters of the word we're looking for.
// Just as in our types above, we rely heavily on conditional types.
export type CompareWords<
  CurrentGuessCharacterList extends string[],
  CurrentSolutionCharacterList extends string[],
  FullSolution extends string[] = CurrentSolutionCharacterList,
  FullGuess extends string[] = CurrentGuessCharacterList,
  CurrentIteration extends Iteration = IterationOf<0>,
  // precompute values for the current iteration which are used in multiple branches
  SlicedGuess = SliceStartingAt<IterationValue<CurrentIteration>, FullGuess>,
  SlicedSolution = SliceStartingAt<
    IterationValue<CurrentIteration>,
    FullSolution
  >,
  NumberOfExactMatchesForCurrentGuessCharacter = Length<
    GetExactMatches<
      LowercaseString<CurrentGuessCharacterList[0]>,
      CastToStringList<SlicedGuess>,
      CastToStringList<SlicedSolution>
    >
  >
> = [CurrentGuessCharacterList, CurrentSolutionCharacterList] extends [
  [infer CurrentGuessCharacter, ...infer GuessTail],
  [infer CurrentSolutionCharacter, ...infer SolutionTail]
]
  ? // exact match case
    LowercaseString<CurrentGuessCharacter> extends CurrentSolutionCharacter
    ? [
        CharacterAtCorrectPosition<LowercaseString<CurrentGuessCharacter>>,
        ...CompareWords<
          CastToStringList<GuessTail>,
          CastToStringList<SolutionTail>,
          FullSolution,
          FullGuess,
          NextIteration<CurrentIteration>
        >
      ]
    : // compute data for other cases
    ComputeCounts<
        LowercaseString<CurrentGuessCharacter>,
        FullSolution,
        FullGuess,
        CurrentIteration
      > extends [
        infer SolutionCharactersAfter,
        infer SolutionCharactersBefore,
        infer GuessCharactersAfter,
        infer GuessCharactersBefore
      ]
    ? [
        // If our current character appeared in the solution before the current index
        GreaterThan<SolutionCharactersBefore, 0> extends true
          ? Or<
              // If the number of times the character appeared in the solution is larger
              // than the number of times it appeared in our guess
              GreaterThan<SolutionCharactersBefore, GuessCharactersBefore>,
              // or if the number of exact matches for this character
              // after our current index is smaller than the number of times
              // this character appears in the solution after the current index
              // then we have a partial match
              GreaterThan<
                SolutionCharactersAfter,
                NumberOfExactMatchesForCurrentGuessCharacter
              >
            > extends true
            ? CharacterFound<LowercaseString<CurrentGuessCharacter>>
            : // else the character couldn't be found
              CharacterNotFound<LowercaseString<CurrentGuessCharacter>>
          : // if the character appears somewhere in the solution after the current index
          GreaterThan<SolutionCharactersAfter, 0> extends true
          ? // First case: we have at least the same number of this character coming up in the guess as well as the solution
            GreaterThanOrEqual<
              SolutionCharactersAfter,
              GuessCharactersAfter
            > extends true
            ? And<
                // Ensure that we have more characters coming after than came before. This is necessary to account for characters
                // which have already been "claimed" by previous occurrences of the current character
                GreaterThan<SolutionCharactersAfter, GuessCharactersBefore>,
                // Finally check if we have less exact matches coming up than available matching characters. If this is the case
                // then we found a valid character
                GreaterThan<
                  SolutionCharactersAfter,
                  NumberOfExactMatchesForCurrentGuessCharacter
                >
              > extends true
              ? CharacterFound<LowercaseString<CurrentGuessCharacter>>
              : CharacterNotFound<LowercaseString<CurrentGuessCharacter>>
            : // Second case: We have less solution characters than guess characters. We check if the number of upcoming matches is less than the
            // number of total valid characters. If that is the case, then this character is valid as a partial match.
            GreaterThan<
                SolutionCharactersAfter,
                NumberOfExactMatchesForCurrentGuessCharacter
              > extends true
            ? CharacterFound<LowercaseString<CurrentGuessCharacter>>
            : CharacterNotFound<LowercaseString<CurrentGuessCharacter>>
          : CharacterNotFound<LowercaseString<CurrentGuessCharacter>>,
        // recurse the rest of the guessed word
        ...CompareWords<
          CastToStringList<GuessTail>,
          CastToStringList<SolutionTail>,
          FullSolution,
          FullGuess,
          NextIteration<CurrentIteration>
        >
      ]
    : InvalidCase
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
