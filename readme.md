# Towels Wrap

A lightweight, browser-based two-player strategy game inspired by the classic towel game.

Towels Wrap is designed to be simple to understand while providing customizable rules, board sizes, time controls, visual settings, and browser-based AI. It runs entirely on the user's device using standard HTML, CSS, and JavaScript.

## Features

- Two-player local gameplay
- Human vs Human mode
- Human vs AI mode
- Three AI difficulty levels:
  - Easy
  - Normal
  - Hard

- Configurable rectangular board
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
- Move preview
- Optional move confirmation
- Move counter
- Player color customization
- Empty-cell color customization
- Rounded or square board cells
- Dark, light, and system themes
- Animation controls
- Reduced-motion support
- Automatic pause when the browser tab is hidden
- Manual pause and resume
- Responsive desktop and mobile layouts
- Keyboard-friendly controls
- Settings saved locally with `localStorage`
- No external libraries
- No server required
- No build process required

## How to Play

Towels Wrap is played on a rectangular grid.

Players take turns placing a connected piece on the board. The piece must follow the player's assigned orientation.

### Piece Orientations

**Horizontal**

The piece extends from left to right.

**Vertical**

The piece extends from top to bottom.

A move is legal only when:

1. Every cell occupied by the piece is inside the board.
2. Every cell occupied by the piece is empty.
3. The piece follows the current player's orientation.

The goal is to continue making legal moves while preventing your opponent from doing so.

## Default Configuration

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

Game rules and visual settings can be changed before starting a game.

## Game Setup

The **Game Setup** page controls settings for the next game.

### Players

Each player can have a custom color.

Player 1's orientation can be:

- Random
- Horizontal
- Vertical

Player 2 can use:

- The opposite orientation of Player 1
- Horizontal
- Vertical

### Starting Player

The starting player can be:

- Player 1
- Player 2
- Random

### Game Mode

Towels Wrap supports two game modes:

- Human vs Human
- Human vs AI

When Human vs AI is selected, Player 2 is controlled by the AI.

### AI Difficulty

The AI has three difficulty levels.

#### Easy

Uses a lightweight move-selection strategy with some randomness.

#### Normal

Uses deeper search with alpha-beta pruning, move ordering, tactical evaluation, and a limited search time.

#### Hard

Uses significantly deeper iterative search with tactical move ordering and a strict search deadline.

The AI runs entirely in the browser and does not use an external AI service.

## Board Settings

The board can be customized before starting a game.

### Board Size

The board width and height can be changed independently.

The main Settings page supports dimensions from:

```text
2 × 2
```

through:

```text
20 × 20
```

The Game Setup interface also validates board dimensions before saving them.

This allows rectangular boards such as:

```text
2 × 2
7 × 8
8 × 8
12 × 8
20 × 10
10 × 20
20 × 20
```

### Piece Length

The piece length determines how many connected cells are placed by each move.

The normal configuration supports piece lengths up to 7 cells, while the game automatically ensures that a piece cannot extend beyond the board.

For example:

```text
Piece length: 2
```

places two neighboring cells.

```text
Piece length: 5
```

places five neighboring cells in the assigned orientation.

## Orientation Rules

Player 1 can have a random, horizontal, or vertical orientation.

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

The game can also be configured so both players use the same orientation.

## Win Conditions

Towels Wrap supports configurable end-game rules.

### No Legal Move

When a player has no legal move, the game can:

- Make that player lose
- End in a tie

The default rule is:

```text
Player loses
```

### Full Board

When every cell on the board is occupied, the game can:

- End in a tie
- Award the win according to the configured full-board rule

The default is:

```text
Game is a tie
```

## Time Control

Each player has their own clock.

Only the current player's clock runs. After a move, the active clock switches to the other player.

### Stopwatch

Stopwatch mode starts each player's clock at:

```text
0:00
```

The clock counts upward while that player is taking their turn.

### Countdown

Countdown mode gives each player a fixed amount of time.

For example:

```text
10:00
```

The active player's clock counts downward.

If the active player's time reaches zero, that player loses.

The countdown can be configured with separate minute and second values.

## Move Preview

When enabled, moving the pointer over the board previews the piece placement.

The preview follows:

- The current player's orientation
- The configured piece length
- The current board state

Invalid preview positions are visually indicated.

Move preview can be disabled in Settings.

## Confirm Moves

Move confirmation can be enabled to help prevent accidental moves.

When enabled, selecting a starting cell prepares the move. Selecting the same starting cell again confirms it.

This can be useful when playing on touch devices or when accidental clicks are a concern.

## Pause

A game can be manually paused at any time.

While paused:

- The board cannot be played
- Player clocks stop
- The AI stops thinking
- The game can be resumed

Towels Wrap also supports automatically pausing when the browser tab becomes hidden.

Automatic pausing can be enabled or disabled through the settings.

## Appearance

Towels Wrap includes several visual customization options.

### Themes

- Dark
- Light
- System

The System option follows the operating system's preferred color scheme.

### Cell Styles

Board cells can be displayed as:

- Rounded
- Square

### Colors

The following colors can be customized:

- Player 1
- Player 2
- Empty cells

Player colors can also be changed from the Game Setup page.

## Accessibility

Towels Wrap includes several accessibility-focused features:

- Keyboard-friendly controls
- Responsive layouts
- Clearly separated controls
- Reduced-motion support
- System reduced-motion detection
- Optional animation disabling
- Customizable player colors

Reduced Motion supports:

- System Default
- On
- Off

Animations can also be independently enabled or disabled.

## Settings Storage

Towels Wrap does not require an account.

Settings are stored locally in the browser using `localStorage`.

The main settings are stored under:

```text
towelsWrapSettings
```

Game setup information is stored separately under:

```text
towelsWrapSetup
```

This allows the game to remember configuration between visits using the same browser.

No settings need to be uploaded to a server.

## Pages

Towels Wrap is divided into several browser pages.

### Main Menu

The main menu provides access to:

- Play
- How to Play
- Settings

### Game Setup

The Game Setup page allows players to configure:

- Player colors
- Player orientations
- Starting player
- Game mode
- AI difficulty
- Board size
- Piece length
- No-move rule
- Full-board rule
- Time control
- Countdown duration
- Cell style
- Animations
- Move confirmation
- Automatic pausing

Setup changes are saved automatically.

### How to Play

The How to Play page explains the basic game rules, piece placement, turns, clocks, and winning conditions.

### Settings

The Settings page controls persistent appearance, board, time, rules, and game-behavior preferences.

Settings can be saved or reset to their defaults.

### Game

The Game page contains the actual board and gameplay interface.

It includes:

- Player clocks
- Current-turn status
- Board
- Move counter
- Orientation information
- Time-control information
- Pause controls
- New Game controls
- Game-over screen

## Running the Game

Towels Wrap is a standalone web application.

The project does not require:

- Node.js
- npm
- A package manager
- A compiler
- A build system
- External JavaScript libraries
- A backend server

The pages can be opened directly in a modern web browser.

The main entry point is:

```text
index.html
```

From there, the game provides navigation to the setup, instructions, settings, and game pages.

## Project Structure

The project uses separate HTML pages for the major parts of the application.

A typical structure is:

```text
Towels Wrap/
├── index.html
├── setup.html
├── howtoplay.html
├── settings.html
└── game.html
```

The current pages contain their own HTML, CSS, and JavaScript rather than relying on external frameworks or libraries.

### `index.html`

The main menu.

Provides navigation to:

- Play
- How to Play
- Settings

### `setup.html`

Handles game configuration before starting a match.

It manages player configuration, game mode, AI difficulty, board rules, time controls, and gameplay behavior.

### `howtoplay.html`

Contains the game's instructions and basic rules.

### `settings.html`

Contains persistent visual and gameplay settings.

### `game.html`

Contains the actual game board, game state, move validation, clocks, AI, pause system, and game-end handling.

## Browser Support

Towels Wrap is designed for modern browsers supporting standard HTML, CSS, and JavaScript features.

Recommended browsers include:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari

A reasonably recent browser is recommended for the best experience.

## Privacy

Towels Wrap is designed to run locally.

It does not require:

- An account
- A backend server
- An online multiplayer service
- An external AI service
- External JavaScript libraries

Game configuration is stored locally using the browser's `localStorage`.

No online account is required to play.

## License

See the project's license file for usage and distribution terms.
