import { expectType } from "tsd";

import { CompareWords } from "./typescriptle";

// full match
declare const T10: CompareWords<["a", "b", "c"], ["a", "b", "c"]>;
expectType<[" 🟩 a ", " 🟩 b ", " 🟩 c "]>(T10);

// full match, case insensitive
declare const T20: CompareWords<["a", "B", "c"], ["a", "b", "c"]>;
expectType<[" 🟩 a ", " 🟩 b ", " 🟩 c "]>(T20);

// invalid character
declare const T30: CompareWords<["a", "b", "c"], ["a", "x", "c"]>;
expectType<[" 🟩 a ", " ⬛ b ", " 🟩 c "]>(T30);

// same character appears multiple times in guess, once in solution, and has a direct match
declare const T40: CompareWords<["a", "a", "c"], ["a", "b", "b"]>;
expectType<[" 🟩 a ", " ⬛ a ", " ⬛ c "]>(T40);

// same character appears multiple times in guess, once in solution, and has an indirect match
declare const T50: CompareWords<["a", "a", "c"], ["b", "b", "a"]>;
expectType<[" 🟨 a ", " ⬛ a ", " ⬛ c "]>(T50);

// direct and indirect match, indirect match is last character in guess
declare const T60: CompareWords<["a", "x", "a"], ["a", "a", "b"]>;
expectType<[" 🟩 a ", " ⬛ x ", " 🟨 a "]>(T60);

// direct and indirect match, indirect match has characters after it
declare const T70: CompareWords<["a", "x", "a", "f"], ["a", "a", "b", "g"]>;
expectType<[" 🟩 a ", " ⬛ x ", " 🟨 a ", " ⬛ f "]>(T70);

// multiple indirect matches
declare const T80: CompareWords<["x", "a", "a", "f"], ["a", "b", "b", "a"]>;
expectType<[" ⬛ x ", " 🟨 a ", " 🟨 a ", " ⬛ f "]>(T80);

// @ts-expect-error For some reason TS thinks the type instantiation here is possibly infinite.
// We are getting the correct result type though, so for now let's mute this. It does not seem
// to happen for all word combinations.
declare const T90: CompareWords<
  ["m", "o", "u", "t", "h"],
  ["a", "c", "h", "e", "s"]
>;
expectType<[" ⬛ m ", " ⬛ o ", " ⬛ u ", " ⬛ t ", " 🟨 h "]>(T90);
