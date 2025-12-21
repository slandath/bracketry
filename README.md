# Basketball Bracket

A digital bracket to track your picks for a single-elimination basketball tournament.

Powered by [Bracketry](https://github.com/sbachinin/bracketry)

---

## What Is It?

I was looking for a easy way to track my March Madness picks and I was unsatisfied with the digital brackets I found.

I loved the look of the Bracketry bracket, but it was not designed for basketball.  So I converted it from a library to a front-end application and made some tweaks to the data structure.

## How It Works

* Bracket is saved locally - no account required.
* Load the tournament information into the JSON template and save in /src.
* Selecting "Make Picks" will open a modal to predict a winner for each match.
* Load game results in the results.json in /public.
* Selecting "Evaluate Bracket" will compare your bracket against the real-game results, highlighting correct picks in green and incorrect picks in red.

## Powered By

* [Bracketry](https://github.com/sbachinin/bracketry)
* [ESLint](https://github.com/eslint/eslint)
* [Prettier](https://github.com/prettier/prettier)
* [Sass](https://github.com/sass/sass)
* [Typescript](https://github.com/microsoft/TypeScript)
* [Vite](https://github.com/vitejs/vite)
* [Vue](https://github.com/vuejs)
