# Towels Wrap

A simple, modern two-player strategy game inspired by the classic towel game.

**Towels Wrap** is designed to be lightweight, easy to understand, and playable directly in a web browser. It requires no external libraries or dependencies.

## Features

* Two-player local gameplay
* Human vs AI gameplay
* Three AI difficulty levels

  * Easy
  * Normal
  * Hard
* Simple grid-based strategy
* Configurable board size
* Configurable piece length
* Horizontal and vertical pieces
* Random player orientation
* Configurable Player 2 orientation
* Configurable starting player
* Configurable no-move rule
* Configurable full-board rule
* Player turn tracking
* Chess-style player clocks
* Stopwatch mode
* Countdown mode
* Configurable countdown duration
* Move preview
* Optional move confirmation
* Move counter
* Player color customization
* Empty-cell color customization
* Rounded or square cells
* Light, dark, and system themes
* Animation controls
* Reduced-motion accessibility option
* Automatic pause when the browser tab is hidden
* Manual pause and resume
* Responsive layout for desktop and mobile
* Keyboard-friendly controls
* Settings saved locally in the browser
* No external libraries required
* No server required

## How to Play

Towels Wrap is played on a rectangular grid.

Each player places a piece consisting of a configurable number of connected cells.

The piece must follow the player's assigned orientation:

* **Horizontal** — cells extend from left to right
* **Vertical** — cells extend from top to bottom

Players take turns placing pieces. A piece may only be placed if every cell it occupies is inside the board and currently empty.

The goal is to continue making legal moves while preventing your opponent from doing so.

## Default Rules

The default configuration uses:

* Board: `7 × 8`
* Piece length: `2`
* Player 1 orientation: Random
* Player 2 orientation: Opposite of Player 1
* Starting player: Player 1
* No legal moves: Player loses
* Full board: Game is a tie
* Time control: Stopwatch

These rules can be changed through **Settings**.

## Game Modes

### Human vs Human

Both players control their own turns locally.

### Human vs AI

Player 1 plays against an AI-controlled Player 2.

The AI has three difficulty levels:

#### Easy

Uses a lightweight move-selection strategy with some randomness.

#### Normal

Uses a deeper search with tactical move ordering and a limited search time.

#### Hard

Uses iterative deepening, alpha-beta search, tactical extensions, and a strict search deadline to search substantially deeper when possible.

The AI runs directly in the browser and does not require a server or external AI service.

## Player Clock

Towels Wrap includes an optional chess-style clock.

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

The width and height can each be configured from:

```text
2 × 2
```

up to:

```text
20 × 20
```

The default size is:

```text
7 × 8
```

### Piece Length

The number of connected cells in each piece can be configured.

The default is:

```text
2
```

The maximum usable length is automatically limited by the board dimensions.

## Orientation Settings

Player 1 can use:

* Random
* Horizontal
* Vertical

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

* Make that player lose
* End the game in a tie

The default is:

```text
Player loses
```

### Full Board

When every cell on the board is occupied, the game can either:

* End in a tie
* Award the win to the last player to move

The default is:

```text
Game is a tie
```

## Move Preview

When enabled, hovering over a board cell displays where the current player's piece would be placed.

Valid moves are shown using the player's color.

Invalid moves are visually marked.

Move preview can be disabled in Settings.

## Confirm Moves

Move confirmation is optional.

When enabled, the player must select the same starting cell twice before the piece is placed.

This can help prevent accidental moves, especially on touch devices.

## Pause

Games can be paused at any time.

While paused:

* The board cannot be played
* Both clocks stop
* The AI stops thinking
* The game can be resumed from the pause screen

Towels Wrap can also automatically pause when the browser tab becomes hidden.

Automatic pausing can be disabled in Settings.

## Appearance

Towels Wrap supports several visual customization options.

### Themes

* Dark
* Light
* System

The **System** option follows the operating system's preferred color scheme.

### Cell Styles

* Rounded
* Square

### Colors

You can customize:

* Player 1 color
* Player 2 color
* Empty-cell color

## Accessibility

Towels Wrap includes accessibility-focused options such as:

* Keyboard-friendly buttons and controls
* Responsive layouts
* Reduced-motion support
* System reduced-motion detection
* Optional animation disabling
* High-contrast player colors through customization

The **Reduced Motion** setting can be configured to:

* Follow System
* On
* Off

## Settings Storage

Game settings are stored locally using the browser's `localStorage`.

Settings are saved under:

```text
towelsWrapSettings
```

This means your configuration can remain available when you return to the game using the same browser.

No account or server is required.

## Running the Game

Towels Wrap is a standalone HTML application.

Simply open:

```text
index.html
```

in a modern web browser.

No installation is required.

No build process is required.

No external dependencies are required.

## Browser Support

Towels Wrap is designed for modern browsers supporting standard HTML, CSS, and JavaScript features.

Recommended browsers include:

* Chrome
* Edge
* Firefox
* Safari

For the best experience, use a reasonably recent version of your browser.

## Project Structure

The basic project can be as simple as:

```text
Towels Wrap/
└── index.html
```

The current version contains the game's HTML, CSS, and JavaScript in a single file, making it easy to distribute and run.

## Privacy

Towels Wrap does not require an account, server, or external service.

Game settings are stored locally in your browser.

The game itself runs entirely on the client.

## License

See the project's license file for usage and distribution terms.
