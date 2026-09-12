# Towels Wrap

A simple, modern 2-player strategy game.

Towels Wrap is a turn-based board game where two players compete to place pieces on the board while trying to avoid being the player who runs out of legal moves.

## Features

- 2-player gameplay
- Turn-based strategy
- Minimal, modern interface
- Dark, light, and system themes
- Customizable graphics settings
- Move previews
- Horizontal and vertical piece placement
- Win and tie conditions
- Built-in How to Play guide
- Locally saved settings
- Responsive board layout

## How to Play

Players take turns placing pieces on the board.

Each piece occupies two connected spaces and can be placed in one of two orientations:

- Horizontal
- Vertical

A piece cannot be placed on spaces that are already occupied.

The goal is to have a legal move available when it is your turn.

### Winning

A player loses when they have no legal moves remaining.

If the board becomes completely filled, the game ends in a tie.

## Game Setup

Before starting a game, you can configure:

- Player 1 color
- Player 2 color
- Player 1's piece orientation
- Starting player

The starting player can be selected manually or randomized.

Player orientations can also be randomized, with Player 2 automatically receiving the opposite orientation when that option is enabled.

## Settings

Towels Wrap includes several graphics and display settings.

### Graphics

- Dark / Light / System theme
- Rounded / Square cells
- Animations on/off
- Move preview on/off
- Board colors

Settings are saved locally in the browser.

## Running the Game

Towels Wrap is currently a browser-based game.

No installation or external dependencies are required.

Open `index.html` in a modern web browser to play.

## Browser Support

Towels Wrap is designed for modern web browsers with support for:

- JavaScript
- CSS Grid
- CSS custom properties
- Local storage

## Project Structure

```text
Towels-Wrap/
├── index.html
└── README.md
