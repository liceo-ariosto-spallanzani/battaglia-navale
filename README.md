
# Naval Warfare

## Setup

`npm i`
`cp .env-sample ./.env`

## Start game

`npm start`

## Dev mode

`npm run dev`

## How to play

### Rules & scores

- Signup, hit and kill all the ships.
- fire delay = 1000ms
- hit the water -> +0 points
- hit a ship -> +10 points
- kill a ship -> +50 points
- hit a cell that has already been hit -> -5 points
- fire out of the field -> -10

### API interface

- `/` get html field and scores dashboard
- `/?format=json` get JSON format field and ships state
- `/signup?team=...&password=...` signup
- `/scores` get scores
- `/fire?team=...&password=...&x=...&y=...` fire to x y coords
