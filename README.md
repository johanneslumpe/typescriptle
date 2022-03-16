# ⬛ 🟨 🟩 TypeScriptle - Wordle in TypeScript's type system

## How to play

Simply clone this repo and open the project in an editor which supports TypeScript's language server. I'd recommend VSCode with the [Docs View extension](https://marketplace.visualstudio.com/items?itemName=bierner.docs-view) extension. It allows for a nice Wordle-like grid in the sidebar when looking at the result type, like so:

![TypeScriptle in VSCode](https://user-images.githubusercontent.com/3470207/158505041-21baad1c-01a2-4745-9e3d-25cec40b1dcd.png)

From here on pick a random number in `config.d.ts` (the max is 12947) and start guessing in `index.d.ts`. Hovering over `GuessResult` will show you the current status in TypeScript's type information.

## How?

TypeScript has such a great type system, that it made it almost trivially easy to implement this. The main two things this project relies on are template strings and recursive conditional types. Check out the annotated source in `typescriptle.d.ts` - that's what you're here for anyways if you're reading this ;).

## Why?

Purely because I thought it would be fun to implement a Wordle-like game in TypeScript's type system.

## FAQ

### Does the game ensure that you don't guess more than six times?

Yes it does. `Guess` does not accept more than six strings for its input tuple. Nothing stops you from using the `Guess` type multiple times though ;)
