# Towels Wrap

A simple, modern two-player strategy game inspired by the classic towel game.

**Towels Wrap** is designed to be lightweight, easy to understand, and playable directly in a modern web browser. It uses plain HTML, CSS, and JavaScript with no external libraries or dependencies.

## Features

- Two-player local gameplay
- Human vs AI gameplay
- Three AI difficulty levels
  - Easy
  - Normal
  - Hard

- Simple grid-based strategy
- Configurable rectangular board size
- Configurable piece length
- Horizontal and vertical pieces
- Random Player 1 orientation
- Configurable Player 2 orientation
- Configurable starting player
- Configurable no-move rule
- Configurable full-board rule
- Player turn tracking
- Chess-style player clocks
- Stopwatch mode
- Countdown mode
- Configurable countdown duration
- Move preview
- Optional move confirmation
- Move counter
- Player color customization
- Empty-cell color customization
- Rounded or square cells
- Light, dark, and system themes
- Animation controls
- Reduced-motion accessibility option
- Automatic pause when the browser tab is hidden
- Manual pause and resume
- Responsive desktop and mobile layout
- Keyboard-friendly controls
- Settings saved locally in the browser
- No external libraries
- No server required
- No build process required

## How to Play

Towels Wrap is played on a rectangular grid.

Each player places a piece consisting of a configurable number of connected cells.

The piece must follow the player's assigned orientation:

- **Horizontal** — cells extend from left to right
- **Vertical** — cells extend from top to bottom

Players take turns placing pieces.

A piece can only be placed when:

1. Every cell occupied by the piece is inside the board.
2. Every cell occupied by the piece is currently empty.
3. The piece follows the current player's orientation.

The goal is to continue making legal moves while preventing your opponent from doing so.

## Default Rules

The default configuration uses:

- Board: `8 × 8`
- Piece length: `2`
- Player 1 orientation: Random
- Player 2 orientation: Opposite of Player 1
- Starting player: Player 1
- No legal moves: Player loses
- Full board: Game is a tie
- Time control: Stopwatch

These rules can be changed through **Settings**.

## Game Modes

### Human vs Human

Both players control their own turns locally on the same device.

### Human vs AI

Player 1 plays against an AI-controlled Player 2.

The AI has three difficulty levels.

#### Easy

Uses a lightweight move-selection strategy with some randomness.

#### Normal

Uses a deeper search with alpha-beta pruning, move ordering, and a limited search time.

#### Hard

Uses a deeper search with alpha-beta pruning, tactical move ordering, and a strict search deadline.

The AI runs entirely in the browser and does not require a server or external AI service.

## Player Clock

Towels Wrap includes a chess-style player clock.

Only the current player's clock runs.

When a player makes a move, the clock switches to the other player.

### Stopwatch

The default clock mode is **Stopwatch**.

Each player's clock starts at:

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

If a player's clock reaches zero, that player loses and the other player wins.

The countdown duration can be configured in **Settings**.

## Board Settings

The board can be customized before starting a new game.

### Board Size

The board width and height can each be configured from:

```text
2
```

to:

```text
20
```

This allows rectangular boards such as:

```text
2 × 2
8 × 8
12 × 8
20 × 10
10 × 20
20 × 20
```

The default size is:

```text
8 × 8
```

Board-size changes apply to new games.

### Piece Length

The number of connected cells occupied by each piece can be configured.

The default is:

```text
2
```

The available setting supports piece lengths from `1` through `7`.

A piece must still fit completely inside the board to be a legal move.

## Orientation Settings

Player 1 can use:

- Random
- Horizontal
- Vertical

By default, Player 2 uses the opposite orientation.

For example:

```text
Player 1 → Horizontal
Player 2 → Vertical
```

The rules can also be changed so that both players use the same orientation.

## Win Conditions

Towels Wrap supports configurable end-game rules.

### No Legal Move

When a player has no legal moves, the game can either:

- Make that player lose
- End the game in a tie

The default is:

```text
Player loses
```

### Full Board

When every cell on the board is occupied, the game can either:

- End in a tie
- Award the win to the last player to move

The default is:

```text
Game is a tie
```

## Move Preview

When enabled, hovering over a board cell previews where the current player's piece would be placed.

The preview uses the current player's color.

Move preview can be disabled in **Settings**.

## Confirm Moves

Move confirmation is optional.

When enabled, the player must select the same starting cell twice before the piece is placed.

This can help prevent accidental moves, especially when playing on a touch device.

## Pause

Games can be paused at any time.

While paused:

- The board cannot be played
- Both clocks stop
- The AI stops thinking
- The game can be resumed

Towels Wrap can also automatically pause when the browser tab becomes hidden.

Automatic pausing can be disabled in **Settings**.

## Appearance

Towels Wrap provides several visual customization options.

### Themes

- Dark
- Light
- System

The **System** option follows the operating system's preferred color scheme.

### Cell Styles

- Rounded
- Square

### Colors

You can customize:

- Player 1 color
- Player 2 color
- Empty-cell color

## Accessibility

Towels Wrap includes several accessibility-focused features:

- Keyboard-friendly controls
- Responsive layouts
- Reduced-motion support
- System reduced-motion detection
- Optional animation disabling
- Customizable player colors
- Large, clearly separated controls

The **Reduced Motion** setting can be configured to:

- Follow System
- On
- Off

## Settings Storage

Game settings are stored locally using the browser's `localStorage`.

Settings are saved under:

```text
towelsWrapSettings
```

This allows your configuration to remain available when you return to the game using the same browser.

No account is required.

No game data needs to be uploaded to a server.

## Running the Game

Towels Wrap is a standalone web application.

The project can be run by opening:

```text
index.html
```

in a modern web browser.

No installation is required.

No build process is required.

No package manager is required.

No external dependencies are required.

For normal gameplay, the project can run entirely on the user's device.

## Project Structure

The project is organized into three main files:

```text
Towels Wrap/
├── index.html
├── style.css
└── script.js
```

### `index.html`

Contains the game's interface and page structure, including:

- Main menu
- Game setup
- How to Play
- Settings
- Game screen
- Player clocks
- Board

### `style.css`

Contains the complete visual design, including:

- Dark and light themes
- Responsive layouts
- Buttons
- Cards
- Game board
- Board cells
- Player colors
- Clocks
- Settings controls
- Mobile layouts
- Reduced-motion behavior

### `script.js`

Contains the game's functionality, including:

- Game state
- Board generation
- Move validation
- Piece placement
- Turn management
- AI
- Clock system
- Settings
- Local storage
- Pause/resume
- Game-end detection
- Board rendering
- UI navigation

## Browser Support

Towels Wrap is designed for modern browsers supporting standard HTML, CSS, and JavaScript features.

Recommended browsers include:

- Chrome
- Microsoft Edge
- Firefox
- Safari

For the best experience, use a reasonably recent version of your browser.

## Privacy

Towels Wrap does not require:

- An account
- A server
- External AI services
- External libraries
- Online game services

The game runs entirely in the browser.

Settings are stored locally using the browser's `localStorage`.

No account or online service is required to play.

## License

See the project's license file for usage and distribution terms.
