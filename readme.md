# Towels Wrap

A simple, modern two-player strategy game inspired by the classic towel game.

Towels Wrap is designed to be lightweight, easy to understand, and playable directly in a web browser.

## Features

- Two-player local gameplay
- Simple grid-based strategy
- Horizontal and vertical pieces
- Configurable board size
- Configurable piece length
- Custom rule settings
- Custom win conditions
- Player turn tracking
- Chess-style player clocks
- Stopwatch mode
- Countdown mode
- Configurable countdown duration
- Move preview
- Move counter
- Player color customization
- Empty-cell color customization
- Multiple board cell styles
- Light, dark, and system themes
- Animation controls
- Accessibility options
- Keyboard-friendly controls
- Responsive layout for desktop and mobile
- No external libraries required

## How to Play

Towels Wrap is played by two players on the same board.

Each player places a piece of a fixed length onto the board. Depending on the configured rules, pieces can be placed horizontally, vertically, or according to the selected orientation.

Players take turns placing pieces.

The goal is to make legal moves while preventing your opponent from doing so.

### Default Rules

The default configuration uses:

- Board: `7 × 8`
- Piece length: `2`
- Player 1 and Player 2 use opposite orientations
- Player 1 starts
- A player with no legal moves loses
- Filling the board results in a tie

These rules can be changed through the settings.

## Player Clock

Towels Wrap includes an optional chess-style clock.

### Stopwatch

The default clock mode is **Stopwatch**.

Each player's clock starts at:

```text
00:00
