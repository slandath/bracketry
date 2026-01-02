# Basketball Bracket

A digital bracket to track your picks for a single-elimination basketball tournament.

Powered by [Bracketry](https://github.com/sbachinin/bracketry)

---

## Why?

I was looking for a easy way to track my March Madness picks and I was unsatisfied with the digital brackets I found.

I loved the look of the Bracketry bracket, but it was not designed for basketball. So I converted it from a library to a front-end application and made some tweaks to the data structure.

## How It Works

- Bracket is saved locally - no account required.
- Load the tournament information into the JSON template and save in /src.
- Selecting "Make Picks" will open a modal to predict a winner for each match.
- Load game results in the results.json in /public.
- Selecting "Evaluate Bracket" will compare your bracket against the real-game results, highlighting correct picks in green and incorrect picks in red.

## Powered By

[![eslint](https://img.shields.io/badge/ESLint-3A33D1?style=for-the-badge&logo=eslint)](https://github.com/eslint/eslint)
[![prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=ffffff)](https://github.com/prettier/prettier)
[![sass](https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=Sass&logoColor=white)](https://github.com/sass/dart-sass)
[![vite](https://img.shields.io/badge/-Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=white)](https://github.com/vitejs/vite)
[![vue](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)](https://github.com/vuejs)

* [Antfu's ESLint Config](https://github.com/antfu/eslint-config)
* [Bracketry](https://github.com/sbachinin/bracketry)
