const faker = require("faker")
const express = require("express")
const app = new express()
const { join } = require("path")
require("dotenv").config()

const teams = {}
const field = []
const ships = []

const PORT = Number(process.env.PORT) || 8080
const W = Number(process.env.W) || 20
const H = Number(process.env.H) || 20
const S = Number(process.env.S) || 2
const FIRE_LIMIT = Number(process.env.FIRE_LIMIT) || 10

const gameStatus = {
  active: true,
  startTime: new Date().getTime(),
  endTime: null
}

for (let y = 0; y < H; y++) {
  const row = []
  for (let x = 0; x < W; x++) {
    row.push({
      team: null,
      x,
      y,
      ship: null,
      hit: false
    })    
  } 
  field.push(row)
}

let id = 1
for (let i = 0; i < S; i++) {
  const maxHp = faker.random.number({ min: 1, max: 6 })
  const vertical = faker.random.boolean()

  const ship = {
    id,
    name: faker.name.firstName(),
    x: faker.random.number({ min: 0, max: vertical ? W - 1 : W - maxHp }),
    y: faker.random.number({ min: 0, max: vertical ? H - maxHp : H - 1 }),
    vertical,
    maxHp,
    curHp: maxHp,
    killer: null
  }

  let found = false
  for (let e = 0; e < ship.maxHp; e++) {
    const x = ship.vertical ? ship.x : ship.x + e
    const y = ship.vertical ? ship.y + e : ship.y
    if (field[y][x].ship) {
      found = true
      break
    }
  }

  if (!found) {
    console.log({ vertical, maxHp })
    for (let e = 0; e < ship.maxHp; e++) {
      const x = ship.vertical ? ship.x : ship.x + e
      const y = ship.vertical ? ship.y + e : ship.y
      field[y][x].ship = ship
    }
  
    ships.push(ship)
    id ++
  }
}

const getVisibleField = () => {
  return field.map(row => row.map(cell => ({ 
    x: cell.x,
    y: cell.y,
    hit: cell.hit,
    team: cell.team ? cell.team.name : null,
    ship: cell.hit ? 
      cell.ship ? { 
        id: cell.ship.id, 
        name: cell.ship.name, 
        alive: cell.ship.curHp > 0,
        killer: cell.ship.killer 
      } : null 
      : null
  })))
}

const getVisibleShip = () => {
  return ships.map(ship => ({
    id: ship.id,
    name: ship.name,
    alive: ship.curHp > 0,
    killer: ship.killer
  }))
}

const getScores = () => {
  return Object.values(teams).map(({
    name,
    score,
    killedShips,
    firedBullets,
    lastFiredBullet,
  }) => ({
    name,
    score,
    killedShips,
    firedBullets,
    lastFiredBullet
  }))
}

const renderField = visibleField => {
  return `
    <table>
      <tbody>
        ${visibleField.map(
          row => `
          <tr>
            ${row.map(cell => `
              <td class="${[
                cell.hit ? "hit" : null,
                cell.hit && cell.ship ? "ship" : null,
                cell.ship?.killer ? "killed" : null
              ].filter(e => e).join(" ")}">${cell.ship ? cell.team : ""}</td>`
            ).join("")}
          </tr>`)
          .join("")}
      </tbody>
    </table>
  `
}

const renderScores = score => {
  return `
    <h1>SCORES</h1>
    <ol>
      ${score
        .sort((a, b) => b.score - a.score)
        .map(({ name, score, firedBullets, killedShips }) => `<li>${name} - score: ${score} - kills: ${killedShips.length} - fired bullets: ${firedBullets}</li>`)
        .join("")
      }
    </ol>
  `
}

app.use(express.static(join(__dirname, "./public")))

app.get("/", ({ query: { format } }, res) => {
  const visibleField = getVisibleField()

  if ( format === "json") {
    res.json({ 
      field: visibleField,
      ships: getVisibleShip()
    })
  } else {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Naval warfare</title>
      <style>
        body {
          color: white;
          font-size: 20px;
          font-family: monospace;
          white-space: nowrap; 
          text-shadow: 2px 2px black;
          text-align: center;
        }

        h1 {
          font-size: 30px;
        }

        #field {
          white-space: nowrap;
        }

        #score {
          position: absolute;
          top: 0;
          left: 0;
          margin: 20px;
          padding: 20px;
          background-color: rgba(0,0,0,0.8);
        }

        td {
          border: 1px solid black;
          width: 100px;
          height: 100px;
          display: inline-block;
          background-size: 150px;
          background-image: url(./water.gif);
          color: white;
          font-family: monospace;
        }

        td.hit.ship {
          filter: hue-rotate(165deg);
        }

        td.hit.ship.killed {
          background-image: url(./explosion.gif);
          background-size: 100px;
          filter: hue-rotate(0deg);
        }

        td.hit {
          filter: sepia(1);
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
      </style>
    </head>
    <body>
      <div id="field">
        ${renderField(visibleField)}
      </div>
      <div id="score">
        ${renderScores(getScores())}
      </div>
      <script src="./script.js"></script>
    </body>
    </html>
    `)
  }
})

app.get("/getFieldHtml", (req, res) => {
  res.send(renderField(getVisibleField()))
})

app.get("/getScoresHtml", (req, res) => {
  res.send(renderScores(getScores()))
})

app.get("/scores", (req, res) => {
  res.json(getScores())
})

app.get("/signup", ({ query: { team: teamName, password } }, res) => {
  if (!teamName || !password) {
    return res.sendStatus(400)
  }
  
  if (teams[teamName]) {
    return res.sendStatus(409)
  }

  teams[teamName] = {
    name: teamName,
    password,
    score: 0,
    killedShips: [],
    firedBullets: 0,
    lastFiredBullet: 0
  }

  res.sendStatus(200)
})

app.get("/fire", ({ query: { x, y, team: teamName, password } }, res) => {  
  if (!gameStatus.active) {
    return res.sendStatus(400)
  }

  const team = teams[teamName]
  if (!team || team.password !== password) {
    return res.sendStatus(401)
  }
  
  const now = new Date().getTime()
  if (now - team.lastFiredBullet < FIRE_LIMIT) {
    team.lastFiredBullet = now
    return res.sendStatus(429)
  } else {
    team.lastFiredBullet = now
  }

  team.firedBullets ++

  let message, score
  
  x = Number(x)
  y = Number(y)

  if (isNaN(x) || isNaN(y) || x >= W || x < 0 || y >= H || y < 0) {
    message = "OUT_OF_FIELD"
    score = -10
  } else { 
    const cell = field[y][x]

    if (cell.hit) {
      message = "ALREADY_HIT"
      score = -5
    } else {
      cell.hit = true
      cell.team = team

      if (!cell.ship) {
        message = "WATER"
        score = 0
      } else {
        cell.ship.curHp --
        if (cell.ship.curHp > 0) {
          message = "HIT"
          score = 10
        } else {
          const { name, id, maxHp } = cell.ship
          cell.ship.killer = team
          team.killedShips.push({
            name,
            id,
            maxHp
          })
          message = "KILL"
          score = 50

          if (ships.every(({ curHp }) => curHp === 0)) {
            gameStatus.active = false
            gameStatus.endTime = new Date().getTime()
          }
        }
      }
    } 
  }

  res.json({
    message,
    score
  })

  team.score += score
})

app.all("*", (req, res) => {
  res.sendStatus(404)
})

app.listen(PORT, () => console.log("App listening on port %O", PORT))