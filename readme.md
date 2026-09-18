# TowelWrap

A lightweight, browser-based two-player strategy game inspired by the classic towel game.

TowelWrap is designed to be simple to learn while providing customizable rules, board sizes, time controls, visual settings, browser-based AI, and online multiplayer.

The local game runs entirely in the browser using standard HTML, CSS, and JavaScript. Online multiplayer uses a small Cloudflare-based backend for temporary game sessions.

## Play

[TowelWrap](https://oplolabs.github.io/TowelWrap/)

## Features

### Local Gameplay

- Two-player local gameplay
- Human vs Human
- Human vs AI
- Three AI difficulty levels:
  - Easy
  - Normal
  - Hard

- Configurable rectangular boards
- Configurable piece length
- Horizontal and vertical orientations
- Random Player 1 orientation
- Configurable Player 2 orientation
- Configurable starting player
- Configurable no-legal-move rule
- Configurable full-board rule
- Player turn tracking
- Player clocks
- Stopwatch time control
- Countdown time control
- Configurable countdown duration
- Move previews
- Optional move confirmation
- Move counter
- Manual pause and resume
- Automatic pause when the browser tab is hidden

### Online Multiplayer

TowelWrap also supports private online games.

Online games use:

- Private game credentials
- Randomly generated game passwords
- Two-player multiplayer
- Server-authoritative game state
- Live WebSocket communication
- Server-authoritative moves
- Server-authoritative clocks
- Pause and resume
- Automatic game expiration
- Temporary game storage
- No permanent match history

Online games currently use the default TowelWrap game configuration rather than the settings saved for local games.

### Customization

- Player color customization
- Empty-cell color customization
- Rounded or square board cells
- Dark, light, and system themes
- Animation controls
- Reduced-motion support
- Responsive desktop and mobile layouts
- Keyboard-friendly controls

### Project Design

- No frontend frameworks
- No external JavaScript libraries
- No build process for the local game
- Local settings stored with `localStorage`
- Open source
- Static frontend
- Small backend only for online multiplayer

---

# How to Play

TowelWrap is played on a rectangular grid.

Players take turns placing a connected piece on the board. The piece must follow the current player's assigned orientation.

A move is legal only when:

1. Every cell occupied by the piece is inside the board.
2. Every cell occupied by the piece is empty.
3. The piece follows the current player's orientation.

The goal is to continue making legal moves while preventing your opponent from doing so.

## Piece Orientations

### Horizontal

The piece extends from left to right.

### Vertical

The piece extends from top to bottom.

For example, with a piece length of 2:

```text
Horizontal:

[■][■]
```

```text
Vertical:

[■]
[■]
```

---

# Default Configuration

The default game configuration is:

| Setting              | Default              |
| -------------------- | -------------------- |
| Board                | 7 × 8                |
| Piece length         | 2 cells              |
| Player 1 orientation | Random               |
| Player 2 orientation | Opposite of Player 1 |
| Starting player      | Player 1             |
| No legal move        | Player loses         |
| Full board           | Game is a tie        |
| Time control         | Stopwatch            |
| Game mode            | Human vs Human       |
| AI difficulty        | Normal               |

Local games can be customized before starting.

Online games currently use these defaults.

---

# Game Setup

The **Game Setup** page controls the configuration for the next local game.

## Players

Each player can have a custom color.

Player 1's orientation can be:

- Random
- Horizontal
- Vertical

Player 2 can use:

- Opposite orientation of Player 1
- Horizontal
- Vertical

## Starting Player

The starting player can be:

- Player 1
- Player 2
- Random

## Game Mode

TowelWrap supports:

- Human vs Human
- Human vs AI

When Human vs AI is selected, Player 2 is controlled by the browser-based AI.

## AI Difficulty

The AI has three difficulty levels.

### Easy

Uses a lightweight move-selection strategy with some randomness.

### Normal

Uses deeper search with alpha-beta pruning, move ordering, tactical evaluation, and a limited search time.

### Hard

Uses deeper iterative search with tactical move ordering and a strict search deadline.

The AI runs entirely in the browser and does not use an external AI service.

---

# Board Settings

The board can be customized before starting a local game.

## Board Size

Width and height can be configured independently.

The supported range is:

```text
2 × 2
```

through:

```text
20 × 20
```

Examples include:

```text
2 × 2
7 × 8
8 × 8
12 × 8
20 × 10
10 × 20
20 × 20
```

## Piece Length

The piece length determines how many connected cells are placed by each move.

For example:

```text
Piece length: 2
```

places two neighboring cells.

```text
Piece length: 5
```

places five neighboring cells in the assigned orientation.

The game validates the configuration so pieces cannot extend beyond the board.

---

# Orientation Rules

Player 1 can use:

- Random
- Horizontal
- Vertical

Player 2 can use:

- Opposite
- Horizontal
- Vertical

When Player 2 is configured to use the opposite orientation, the orientations are automatically paired.

For example:

```text
Player 1 → Horizontal
Player 2 → Vertical
```

or:

```text
Player 1 → Vertical
Player 2 → Horizontal
```

Both players can also be configured to use the same orientation.

---

# Win Conditions

TowelWrap supports configurable end-game rules.

## No Legal Move

When a player has no legal move, the game can:

- Make that player lose
- End in a tie

The default is:

```text
Player loses
```

## Full Board

When every cell on the board is occupied, the game can end according to the configured full-board rule.

The default is:

```text
Game is a tie
```

---

# Time Control

Each player has their own clock.

Only the current player's clock runs. After a move, the active clock switches to the other player.

## Stopwatch

Stopwatch mode starts each player's clock at:

```text
0:00
```

The clock counts upward while that player is taking their turn.

## Countdown

Countdown mode gives each player a fixed amount of time.

For example:

```text
10:00
```

The active player's clock counts downward.

If the active player's time reaches zero, that player loses.

The countdown duration can be configured using separate minute and second values.

---

# Online Multiplayer

TowelWrap includes private online multiplayer.

Online games can be created from the **Online** page.

## Creating a Game

The creator enters a username.

The server then generates:

- A private game ID
- A random password
- A private session token

The password is displayed to the creator so it can be shared with the other player.

There is no separate game code. The username and password identify the private game.

## Joining a Game

The second player enters:

- Username
- Password

The username does not have to be globally unique.

The exact username and password combination must match the private game.

Incorrect credentials return the same generic message:

```text
Not correct username or password
```

This prevents the server from revealing whether a particular username exists.

## Online Game State

Online games are server-authoritative.

The browser sends a requested move to the server.

The server checks:

- Whose turn it is
- Whether the move is inside the board
- Whether the piece fits the configured orientation
- Whether the required cells are empty
- Whether the game is currently playable

The server then updates the game state and broadcasts the new state to both players.

The browser does not get to decide whether a move is valid.

## Online Configuration

Online games currently use the default configuration:

```text
Board: 7 × 8
Piece length: 2
Player 1 orientation: Random
Player 2 orientation: Opposite
Starting player: Player 1
No legal move: Player loses
Full board: Tie
Time control: Stopwatch
```

Local `Settings` and `Game Setup` preferences are not used when creating an online game.

This keeps online games consistent between players.

## Game Expiration

Online games are temporary.

A game is automatically deleted after its configured lifetime if it has not already been cleaned up.

The server currently uses a six-hour game lifetime.

Online game data is intended to be temporary and is not used as permanent match history.

---

# Privacy

TowelWrap does not require an account for local gameplay.

Local games run entirely in the browser.

Local settings are stored using:

```text
localStorage
```

The main settings are stored under:

```text
towelsWrapSettings
```

Game setup information is stored separately under:

```text
towelsWrapSetup
```

Online multiplayer requires temporary server communication because the two players need to exchange game state.

Online games temporarily store information required to operate the game, including:

- Game configuration
- Username
- Hashed game password
- Game expiration information
- Temporary game state

Passwords are stored server-side as hashes rather than plaintext passwords.

Online games are automatically cleaned up after expiration or game completion.

---

# Pause

A game can be manually paused.

While paused:

- The board cannot be played
- Player clocks stop
- Online moves are rejected
- The AI stops thinking
- The game can be resumed

Local games can also automatically pause when the browser tab becomes hidden.

Automatic pausing can be enabled or disabled in Settings.

---

# Move Preview

When enabled, moving the pointer over the board previews the piece placement.

The preview follows:

- The current player's orientation
- The configured piece length
- The current board state

A legal preview uses the current player's color.

An illegal preview is shown using the invalid-move styling.

Move previews can be disabled in Settings.

---

# Confirm Moves

Move confirmation can be enabled to help prevent accidental moves.

When enabled, selecting a starting cell prepares the move.

Selecting the same starting cell again confirms it.

This can be useful on touch devices or when accidental clicks are a concern.

---

# Appearance

TowelWrap includes several visual customization options.

## Themes

- Dark
- Light
- System

The System option follows the operating system's preferred color scheme.

## Cell Styles

Board cells can be displayed as:

- Rounded
- Square

## Colors

The following colors can be customized:

- Player 1
- Player 2
- Empty cells

---

# Accessibility

TowelWrap includes several accessibility-focused features:

- Keyboard-friendly controls
- Responsive layouts
- Reduced-motion support
- System reduced-motion detection
- Optional animation disabling
- Customizable player colors
- Mobile-friendly controls

Reduced Motion supports:

- System Default
- On
- Off

Animations can also be independently enabled or disabled.

---

# Project Structure

The repository contains a static frontend and a separate Cloudflare Worker backend.

A simplified structure is:

```text
TowelWrap/
├── index.html
├── online.html
├── online.js
├── setup.html
├── howtoplay.html
├── settings.html
├── game.html
├── readme.md
└── server/
    ├── src/
    │   └── index.ts
    ├── migrations/
    │   ├── 0001_initial.sql
    │   └── 0002_game_config.sql
    ├── wrangler.jsonc
    ├── package.json
    └── tsconfig.json
```

## Frontend

### `index.html`

The main menu.

Provides access to:

- Play
- Online
- How to Play
- Settings

### `setup.html`

Configures local games.

### `online.html`

Creates and joins private online games.

### `online.js`

Connects the game page to the online multiplayer server and handles:

- WebSocket communication
- Online board rendering
- Server state
- Online move requests
- Online previews
- Online clocks
- Connection status

### `howtoplay.html`

Contains the game's instructions and rules.

### `settings.html`

Contains persistent visual and gameplay settings.

### `game.html`

Contains the main game interface and local gameplay system.

It handles:

- Board rendering
- Move validation
- Clocks
- AI
- Pause system
- Move previews
- Game-end handling

---

# Online Server

The online backend is located in:

```text
server/
```

It uses:

- Cloudflare Workers
- Cloudflare Durable Objects
- Cloudflare D1
- WebSockets
- TypeScript

## Durable Objects

Durable Objects hold the temporary live state of each online game.

They handle:

- Connected players
- Board state
- Turns
- Clocks
- Moves
- Pause state
- Game completion
- WebSocket connections

## D1

Cloudflare D1 stores temporary private-game information needed to find and authenticate a game.

The database does not serve as permanent match history.

## Server Authority

The client cannot directly modify the authoritative online board.

For example, when a player attempts a move:

```text
Browser
   ↓
Move request
   ↓
Cloudflare Worker
   ↓
Durable Object
   ↓
Validate move
   ↓
Update state
   ↓
Broadcast state
   ↓
Both browsers
```

---

# Running Locally

## Local Game

The local game does not require:

- Node.js
- npm
- A package manager
- A compiler
- A build system
- External JavaScript libraries
- A backend server

The HTML files can be opened directly in a modern browser.

The main entry point is:

```text
index.html
```

## Online Server Development

The online backend is a Cloudflare Worker project.

From the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npx wrangler dev
```

Deploy the Worker:

```bash
npx wrangler deploy
```

The server requires the appropriate Cloudflare account and resources configured in `wrangler.jsonc`.

---

# Contributing

TowelWrap is open source and contributions are welcome.

You can contribute by:

- Fixing bugs
- Improving accessibility
- Improving the UI
- Adding tests
- Improving the AI
- Improving online multiplayer
- Improving documentation
- Optimizing performance
- Reporting bugs
- Suggesting features

## Development Guidelines

When contributing:

- Keep the game lightweight.
- Prefer browser-native APIs where practical.
- Avoid unnecessary dependencies.
- Keep local gameplay functional without the online server.
- Keep online game validation server-authoritative.
- Do not add unnecessary data collection.
- Document significant changes.
- Test changes on both desktop and mobile layouts when applicable.

## Reporting Issues

When reporting a bug, include:

- What you expected to happen
- What actually happened
- Steps to reproduce it
- Browser and version
- Operating system
- Whether the issue occurs locally or online

Screenshots, recordings, and relevant console errors can also be useful.

---

# Browser Support

TowelWrap is designed for modern browsers supporting standard HTML, CSS, and JavaScript features.

Recommended browsers include:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

A reasonably recent browser is recommended.

---

# License

See the project's license file for the applicable usage, modification, and distribution terms.

---

# Links

**Repository:**
https://github.com/OploLabs/TowelWrap

TowelWrap is developed as an open-source project by OploLabs.
