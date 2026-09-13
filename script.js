"use strict";

/* =========================================================
   TOWELS WRAP
   Main game script
========================================================= */

/* =========================================================
   CONSTANTS
========================================================= */

const EMPTY = 0;
const P1 = 1;
const P2 = 2;
const X = 3;

const STORAGE_KEY = "towelsWrapSettings";

const DEFAULT_SETTINGS = {
    theme: "dark",
    cellStyle: "rounded",
    animations: "on",
    preview: "on",

    boardWidth: 7,
    boardHeight: 8,

    p1Color: "#4f8cff",
    p2Color: "#ff5757",
    emptyColor: "#20242b",

    timeControl: "stopwatch",
    countdownMinutes: 5,
    countdownSeconds: 0,

    pieceLength: 2,
    noMove: "lose",
    fullBoard: "tie",
    oppositeOrientation: "opposite",

    confirmMove: "off",
    autoPause: "on",
    reducedMotion: "system"
};

const AI_SETTINGS = {
    easy: {
        depth: 1,
        time: 50
    },

    normal: {
        depth: 3,
        time: 250
    },

    hard: {
        depth: 7,
        time: 1000
    }
};

const THEMES = {
    dark: {
        "--bg": "#0f1115",
        "--surface": "#171a21",
        "--surface-2": "#1d2129",
        "--border": "#2a303b",
        "--text": "#f2f4f7",
        "--muted": "#9ba3b1"
    },

    light: {
        "--bg": "#f3f5f8",
        "--surface": "#ffffff",
        "--surface-2": "#eef1f5",
        "--border": "#d7dce3",
        "--text": "#171a21",
        "--muted": "#687180"
    }
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = id => document.getElementById(id);

const ui = {
    screens: {
        menu: $("menuScreen"),
        setup: $("setupScreen"),
        howToPlay: $("howToPlayScreen"),
        settings: $("settingsScreen"),
        game: $("gameScreen")
    },

    menu: {
        play: $("menuPlay"),
        howToPlay: $("menuHowToPlay"),
        settings: $("menuSettings")
    },

    setup: {
        p1Color: $("setupP1Color"),
        p2Color: $("setupP2Color"),

        p1Preview: $("setupP1Preview"),
        p2Preview: $("setupP2Preview"),

        p1Orientation: $("setupP1Orientation"),
        p2Orientation: $("setupP2Orientation"),
        startingPlayer: $("setupStartingPlayer"),
        gameMode: $("setupGameMode"),
        aiDifficulty: $("setupAIDifficulty"),
        aiDifficultySetting: $("aiDifficultySetting"),
        timeControl: $("setupTimeControl"),
        start: $("startGameButton")
    },

    settings: {
        theme: $("themeSetting"),
        cellStyle: $("cellStyleSetting"),
        animations: $("animationSetting"),
        preview: $("previewSetting"),

        boardWidth: $("boardWidthSetting"),
        boardHeight: $("boardHeightSetting"),

        p1Color: $("settingsP1Color"),
        p2Color: $("settingsP2Color"),
        emptyColor: $("settingsEmptyColor"),

        timeControl: $("timeControlSetting"),
        countdownSettings: $("countdownSettings"),
        countdownMinutes: $("countdownMinutesSetting"),
        countdownSeconds: $("countdownSecondsSetting"),

        pieceLength: $("pieceLengthSetting"),
        noMove: $("noMoveSetting"),
        fullBoard: $("fullBoardSetting"),
        oppositeOrientation: $("oppositeOrientationSetting"),

        confirmMove: $("confirmMoveSetting"),
        autoPause: $("autoPauseSetting"),
        reducedMotion: $("reducedMotionSetting"),

        save: $("saveSettingsButton"),
        reset: $("resetSettingsButton")
    },

    game: {
        pause: $("gamePauseButton"),
        menu: $("gameMenuButton"),
        newGame: $("gameNewButton"),

        p1ClockCard: $("p1ClockCard"),
        p2ClockCard: $("p2ClockCard"),

        p1Clock: $("p1Clock"),
        p2Clock: $("p2Clock"),

        p1ClockTurn: $("p1ClockTurn"),
        p2ClockTurn: $("p2ClockTurn"),

        turnText: $("turnText"),
        substatus: $("substatus"),

        board: $("board"),

        p1Orientation: $("p1Orientation"),
        p2Orientation: $("p2Orientation"),

        moveCount: $("moveCount"),
        timeControlLabel: $("timeControlLabel")
    },

    examples: {
        horizontal: $("horizontalExample"),
        vertical: $("verticalExample"),
        blocked: $("blockedExample")
    }
};


/* =========================================================
   SETTINGS
========================================================= */

let settings = loadSettings();

function loadSettings() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        if (!saved || typeof saved !== "object") {
            return { ...DEFAULT_SETTINGS };
        }

        return {
            ...DEFAULT_SETTINGS,
            ...saved
        };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
    );
}

function resetSettings() {
    settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    applySettings();
}


/* =========================================================
   GAME STATE
========================================================= */

let board = [];
let currentPlayer = P1;

let gameOver = false;
let gamePaused = false;
let moveCount = 0;

let hoverCell = null;
let pendingMove = null;

let orientations = {
    [P1]: "H",
    [P2]: "V"
};


/* =========================================================
   CLOCK STATE
========================================================= */

let clockInterval = null;

let clocks = {
    [P1]: 0,
    [P2]: 0
};

let lastClockTime = 0;


/* =========================================================
   AI STATE
========================================================= */

const aiState = {
    thinking: false,
    cancelled: false,
    timer: null,
    deadline: 0
};


/* =========================================================
   BASIC HELPERS
========================================================= */

function otherPlayer(player) {
    return player === P1 ? P2 : P1;
}

function playerName(player) {
    return player === P1
        ? "Player 1"
        : "Player 2";
}

function playerColor(player) {
    return player === P1
        ? settings.p1Color
        : settings.p2Color;
}

function orientationName(orientation) {
    return orientation === "H"
        ? "Horizontal"
        : "Vertical";
}

function oppositeOrientation(orientation) {
    return orientation === "H"
        ? "V"
        : "H";
}

function randomOrientation() {
    return Math.random() < 0.5
        ? "H"
        : "V";
}

function clamp(value, min, max) {
    return Math.max(
        min,
        Math.min(max, value)
    );
}

function isInsideBoard(
    row,
    col,
    stateBoard = board
) {
    return (
        row >= 0 &&
        row < stateBoard.length &&
        col >= 0 &&
        col < (stateBoard[0]?.length ?? 0)
    );
}

function isBoardFull(stateBoard = board) {
    for (const row of stateBoard) {
        for (const cell of row) {
            if (cell === EMPTY) {
                return false;
            }
        }
    }

    return true;
}


/* =========================================================
   SCREEN NAVIGATION
========================================================= */

function showScreen(name) {
    for (
        const [screenName, element]
        of Object.entries(ui.screens)
    ) {
        element.classList.toggle(
            "hidden",
            screenName !== name
        );
    }
}

function showMainMenu() {
    cancelAIThinking();
    stopClock();

    gamePaused = false;
    pendingMove = null;

    ui.game.pause.textContent = "Pause";

    showScreen("menu");
}


/* =========================================================
   SETTINGS UI
========================================================= */

function applyTheme() {
    let theme = settings.theme;

    if (theme === "system") {
        theme =
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches
                ? "light"
                : "dark";
    }

    const values =
        THEMES[theme] ?? THEMES.dark;

    for (
        const [property, value]
        of Object.entries(values)
    ) {
        document.documentElement.style.setProperty(
            property,
            value
        );
    }

    document.documentElement.dataset.theme =
        theme;
}

function applyCellStyle() {
    document.body.classList.toggle(
        "square-cells",
        settings.cellStyle === "square"
    );
}

function applyMotionSettings() {
    const reduce =
        settings.reducedMotion === "on" ||
        (
            settings.reducedMotion === "system" &&
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        );

    document.body.classList.toggle(
        "reduced-motion",
        reduce || settings.animations === "off"
    );
}

function applyColors() {
    document.documentElement.style.setProperty(
        "--p1-color",
        settings.p1Color
    );

    document.documentElement.style.setProperty(
        "--p2-color",
        settings.p2Color
    );

    document.documentElement.style.setProperty(
        "--empty-color",
        settings.emptyColor
    );

    /* X is always red with a white X */
    document.documentElement.style.setProperty(
        "--x-color",
        "#ff0000"
    );

    document.documentElement.style.setProperty(
        "--x-text-color",
        "#ffffff"
    );
}

function applySettings() {
    applyTheme();
    applyCellStyle();
    applyMotionSettings();
    applyColors();

    updateCountdownVisibility();
}

function populateSettingsUI() {
    ui.settings.theme.value =
        settings.theme;

    ui.settings.cellStyle.value =
        settings.cellStyle;

    ui.settings.animations.value =
        settings.animations;

    ui.settings.preview.value =
        settings.preview;

    ui.settings.boardWidth.value =
        settings.boardWidth;

    ui.settings.boardHeight.value =
        settings.boardHeight;

    ui.settings.p1Color.value =
        settings.p1Color;

    ui.settings.p2Color.value =
        settings.p2Color;

    ui.settings.emptyColor.value =
        settings.emptyColor;

    ui.settings.timeControl.value =
        settings.timeControl;

    ui.settings.countdownMinutes.value =
        settings.countdownMinutes;

    ui.settings.countdownSeconds.value =
        settings.countdownSeconds;

    ui.settings.pieceLength.value =
        settings.pieceLength;

    ui.settings.noMove.value =
        settings.noMove;

    ui.settings.fullBoard.value =
        settings.fullBoard;

    ui.settings.oppositeOrientation.value =
        settings.oppositeOrientation;

    ui.settings.confirmMove.value =
        settings.confirmMove;

    ui.settings.autoPause.value =
        settings.autoPause;

    ui.settings.reducedMotion.value =
        settings.reducedMotion;

    updateCountdownVisibility();
}

function readSettingsUI() {
    settings.theme =
        ui.settings.theme.value;

    settings.cellStyle =
        ui.settings.cellStyle.value;

    settings.animations =
        ui.settings.animations.value;

    settings.preview =
        ui.settings.preview.value;

    settings.boardWidth = clamp(
        Number(ui.settings.boardWidth.value) ||
            DEFAULT_SETTINGS.boardWidth,
        2,
        20
    );

    settings.boardHeight = clamp(
        Number(ui.settings.boardHeight.value) ||
            DEFAULT_SETTINGS.boardHeight,
        2,
        20
    );

    settings.p1Color =
        ui.settings.p1Color.value;

    settings.p2Color =
        ui.settings.p2Color.value;

    settings.emptyColor =
        ui.settings.emptyColor.value;

    settings.timeControl =
        ui.settings.timeControl.value;

    settings.countdownMinutes = clamp(
        Number(
            ui.settings.countdownMinutes.value
        ) || 0,
        0,
        999
    );

    settings.countdownSeconds = clamp(
        Number(
            ui.settings.countdownSeconds.value
        ) || 0,
        0,
        59
    );

    settings.pieceLength = clamp(
        Number(
            ui.settings.pieceLength.value
        ) || 2,
        1,
        7
    );

    settings.noMove =
        ui.settings.noMove.value;

    settings.fullBoard =
        ui.settings.fullBoard.value;

    settings.oppositeOrientation =
        ui.settings.oppositeOrientation.value;

    settings.confirmMove =
        ui.settings.confirmMove.value;

    settings.autoPause =
        ui.settings.autoPause.value;

    settings.reducedMotion =
        ui.settings.reducedMotion.value;
}

function openSettings() {
    populateSettingsUI();
    showScreen("settings");
}

function updateCountdownVisibility() {
    ui.settings.countdownSettings.classList.toggle(
        "hidden",
        settings.timeControl !== "countdown"
    );
}


/* =========================================================
   SETUP
========================================================= */

function prepareSetup() {
    ui.setup.p1Color.value =
        settings.p1Color;

    ui.setup.p2Color.value =
        settings.p2Color;

    ui.setup.p1Orientation.value =
        "random";

    updateSetupPreviews();
    updateAIDifficultyVisibility();

    ui.setup.timeControl.textContent =
        settings.timeControl === "stopwatch"
            ? "Stopwatch"
            : `Countdown (${formatDuration(
                getCountdownTime()
            )})`;
}

function updateSetupPreviews() {
    ui.setup.p1Preview.style.backgroundColor =
        ui.setup.p1Color.value;

    ui.setup.p2Preview.style.backgroundColor =
        ui.setup.p2Color.value;
}

function updateAIDifficultyVisibility() {
    ui.setup.aiDifficultySetting.classList.toggle(
        "hidden",
        ui.setup.gameMode.value !== "ai"
    );
}

function getStartingPlayer() {
    const value =
        ui.setup.startingPlayer.value;

    if (value === "random") {
        return Math.random() < 0.5
            ? P1
            : P2;
    }

    return Number(value);
}

function getSetupOrientations() {
    let p1 =
        ui.setup.p1Orientation.value;

    if (p1 === "random") {
        p1 = randomOrientation();
    }

    const p2 =
        settings.oppositeOrientation === "same"
            ? p1
            : oppositeOrientation(p1);

    return {
        [P1]: p1,
        [P2]: p2
    };
}


/* =========================================================
   GAME START
========================================================= */

function startGameFromSetup() {
    settings.p1Color =
        ui.setup.p1Color.value;

    settings.p2Color =
        ui.setup.p2Color.value;

    applyColors();

    orientations =
        getSetupOrientations();

    currentPlayer =
        getStartingPlayer();

    gameOver = false;
    gamePaused = false;
    moveCount = 0;

    pendingMove = null;
    hoverCell = null;

    clocks[P1] =
        getInitialClock();

    clocks[P2] =
        getInitialClock();

    createBoard();

    updateGameInfo();
    renderBoard();
    updateStatus();
    updateClocks();

    ui.game.pause.textContent =
        "Pause";

    showScreen("game");

    startClock();

    if (isAITurn()) {
        scheduleAI();
    }
}


/* =========================================================
   BOARD
========================================================= */

function createBoard() {
    board = Array.from(
        {
            length: settings.boardHeight
        },
        () =>
            Array(
                settings.boardWidth
            ).fill(EMPTY)
    );
}

function getMoveCells(
    row,
    col,
    orientation,
    length = settings.pieceLength
) {
    const cells = [];

    for (let i = 0; i < length; i++) {
        const nextRow =
            orientation === "V"
                ? row + i
                : row;

        const nextCol =
            orientation === "H"
                ? col + i
                : col;

        cells.push({
            row: nextRow,
            col: nextCol
        });
    }

    return cells;
}

function isMoveValid(
    row,
    col,
    player,
    stateBoard = board
) {
    const cells =
        getMoveCells(
            row,
            col,
            orientations[player]
        );

    return cells.every(cell =>
        isInsideBoard(
            cell.row,
            cell.col,
            stateBoard
        ) &&
        stateBoard[cell.row][cell.col] ===
            EMPTY
    );
}

function getLegalMoves(
    player,
    stateBoard = board
) {
    const moves = [];

    for (
        let row = 0;
        row < stateBoard.length;
        row++
    ) {
        for (
            let col = 0;
            col < stateBoard[row].length;
            col++
        ) {
            if (
                isMoveValid(
                    row,
                    col,
                    player,
                    stateBoard
                )
            ) {
                moves.push({
                    row,
                    col,
                    cells:
                        getMoveCells(
                            row,
                            col,
                            orientations[player]
                        )
                });
            }
        }
    }

    return moves;
}

function applyMove(
    move,
    player,
    stateBoard = board
) {
    const nextBoard =
        stateBoard.map(
            row => [...row]
        );

    for (const cell of move.cells) {
        nextBoard[cell.row][cell.col] =
            player;
    }

    return nextBoard;
}


/* =========================================================
   BOARD RENDERING
========================================================= */

function renderBoard() {
    ui.game.board.innerHTML = "";

    ui.game.board.style.gridTemplateColumns =
        `repeat(${settings.boardWidth}, minmax(0, 1fr))`;

    ui.game.board.style.gridTemplateRows =
        `repeat(${settings.boardHeight}, minmax(0, 1fr))`;

    ui.game.board.style.aspectRatio =
        `${settings.boardWidth} / ${settings.boardHeight}`;

    for (
        let row = 0;
        row < settings.boardHeight;
        row++
    ) {
        for (
            let col = 0;
            col < settings.boardWidth;
            col++
        ) {
            const cell =
                document.createElement("button");

            cell.type = "button";
            cell.className =
                "board-cell";

            cell.dataset.row = row;
            cell.dataset.col = col;

            const value =
                board[row][col];

            if (value === P1) {
                cell.classList.add(
                    "player-one"
                );

                cell.style.backgroundColor =
                    settings.p1Color;
            }

            if (value === P2) {
                cell.classList.add(
                    "player-two"
                );

                cell.style.backgroundColor =
                    settings.p2Color;
            }

            /*
             * X CELL
             *
             * Always:
             * - Red background
             * - White X
             */
            if (value === X) {
                cell.classList.add(
                    "player-x"
                );

                cell.style.backgroundColor =
                    "#ff0000";

                cell.style.color =
                    "#ffffff";

                cell.style.fontWeight =
                    "900";

                cell.style.fontSize =
                    "1.5em";

                cell.textContent = "X";
            }

            if (
                hoverCell &&
                settings.preview === "on" &&
                !gameOver &&
                !gamePaused
            ) {
                const previewCells =
                    getMoveCells(
                        hoverCell.row,
                        hoverCell.col,
                        orientations[currentPlayer]
                    );

                const isPreview =
                    previewCells.some(
                        preview =>
                            preview.row === row &&
                            preview.col === col
                    );

                if (
                    isPreview &&
                    value === EMPTY
                ) {
                    cell.classList.add(
                        "preview"
                    );

                    cell.style.backgroundColor =
                        playerColor(
                            currentPlayer
                        );
                }
            }

            if (
                pendingMove &&
                pendingMove.cells.some(
                    pending =>
                        pending.row === row &&
                        pending.col === col
                )
            ) {
                cell.classList.add(
                    "pending"
                );
            }

            ui.game.board.appendChild(
                cell
            );
        }
    }
}


/* =========================================================
   STATUS
========================================================= */

function updateStatus() {
    if (gameOver) {
        return;
    }

    if (gamePaused) {
        ui.game.turnText.textContent =
            "Game Paused";

        ui.game.substatus.textContent =
            "Press Resume to continue";

        return;
    }

    ui.game.turnText.textContent =
        `${playerName(currentPlayer)}'s turn`;

    ui.game.substatus.textContent =
        isAITurn()
            ? "AI is thinking..."
            : orientationName(
                orientations[currentPlayer]
            );
}

function updateGameInfo() {
    ui.game.p1Orientation.textContent =
        orientationName(
            orientations[P1]
        );

    ui.game.p2Orientation.textContent =
        orientationName(
            orientations[P2]
        );

    ui.game.moveCount.textContent =
        String(moveCount);

    ui.game.timeControlLabel.textContent =
        settings.timeControl === "stopwatch"
            ? "Stopwatch"
            : "Countdown";
}


/* =========================================================
   GAME RESULT
========================================================= */

function getGameResult(
    player = currentPlayer,
    stateBoard = board
) {
    if (isBoardFull(stateBoard)) {
        if (settings.fullBoard === "tie") {
            return {
                type: "tie",
                winner: null,
                message:
                    "The board is full. The game is a tie."
            };
        }

        return {
            type: "win",
            winner: otherPlayer(player),
            message:
                `${playerName(
                    otherPlayer(player)
                )} wins!`
        };
    }

    const legalMoves =
        getLegalMoves(
            player,
            stateBoard
        );

    if (legalMoves.length === 0) {
        if (settings.noMove === "tie") {
            return {
                type: "tie",
                winner: null,
                message:
                    `${playerName(
                        player
                    )} has no legal move. The game is a tie.`
            };
        }

        return {
            type: "win",
            winner: otherPlayer(player),
            message:
                `${playerName(
                    player
                )} has no legal move. ` +
                `${playerName(
                    otherPlayer(player)
                )} wins!`
        };
    }

    return null;
}

function finishGame(result) {
    gameOver = true;
    pendingMove = null;
    hoverCell = null;

    cancelAIThinking();
    stopClock();

    ui.game.turnText.textContent =
        result.message;

    ui.game.substatus.textContent =
        result.type === "tie"
            ? "Tie game"
            : `${playerName(
                result.winner
            )} wins`;

    renderBoard();
}

function checkGameEnd() {
    const result =
        getGameResult();

    if (!result) {
        return false;
    }

    finishGame(result);

    return true;
}


/* =========================================================
   PLAYER MOVES
========================================================= */

function humanMove(row, col) {
    if (
        gameOver ||
        gamePaused ||
        isAITurn()
    ) {
        return;
    }

    if (
        !isMoveValid(
            row,
            col,
            currentPlayer
        )
    ) {
        pendingMove = null;
        renderBoard();
        return;
    }

    const move = {
        row,
        col,
        cells:
            getMoveCells(
                row,
                col,
                orientations[currentPlayer]
            )
    };

    if (
        settings.confirmMove === "on"
    ) {
        if (
            pendingMove &&
            movesEqual(
                pendingMove,
                move
            )
        ) {
            pendingMove = null;
            placeMove(move);
        } else {
            pendingMove = move;
            renderBoard();
        }

        return;
    }

    placeMove(move);
}

function placeMove(move) {
    board =
        applyMove(
            move,
            currentPlayer,
            board
        );

    moveCount++;

    pendingMove = null;
    hoverCell = null;

    if (checkGameEnd()) {
        updateGameInfo();
        updateClocks();
        renderBoard();
        return;
    }

    currentPlayer =
        otherPlayer(
            currentPlayer
        );

    updateGameInfo();
    updateStatus();
    renderBoard();

    restartClockForTurn();

    if (isAITurn()) {
        scheduleAI();
    }
}

function movesEqual(a, b) {
    if (!a || !b) {
        return false;
    }

    return (
        a.row === b.row &&
        a.col === b.col
    );
}


/* =========================================================
   AI
========================================================= */

function isAITurn() {
    return (
        ui.setup.gameMode.value === "ai" &&
        currentPlayer === P2
    );
}

function scheduleAI() {
    cancelAIThinking(false);

    aiState.timer =
        setTimeout(
            startAIThinking,
            50
        );
}

function cancelAIThinking(
    clearTimer = true
) {
    aiState.cancelled = true;
    aiState.thinking = false;

    if (
        clearTimer &&
        aiState.timer !== null
    ) {
        clearTimeout(
            aiState.timer
        );

        aiState.timer = null;
    }
}

function startAIThinking() {
    if (
        gameOver ||
        gamePaused ||
        !isAITurn()
    ) {
        return;
    }

    aiState.cancelled = false;
    aiState.thinking = true;

    updateStatus();

    const difficulty =
        ui.setup.aiDifficulty.value;

    const config =
        AI_SETTINGS[difficulty] ??
        AI_SETTINGS.normal;

    aiState.deadline =
        performance.now() +
        config.time;

    let move;

    try {
        move =
            findAIMove(
                currentPlayer,
                config.depth
            );
    } finally {
        aiState.thinking = false;
        aiState.timer = null;
    }

    if (
        aiState.cancelled ||
        gameOver ||
        gamePaused ||
        !isAITurn()
    ) {
        return;
    }

    if (!move) {
        checkGameEnd();
        return;
    }

    placeMove(move);
}


/* =========================================================
   AI SEARCH
========================================================= */

function findAIMove(
    player,
    maxDepth
) {
    const moves =
        getLegalMoves(
            player,
            board
        );

    if (moves.length === 0) {
        return null;
    }

    if (moves.length === 1) {
        return moves[0];
    }

    if (maxDepth <= 1) {
        return chooseEasyMove(
            moves,
            player
        );
    }

    let bestMove =
        moves[0];

    let bestScore =
        -Infinity;

    for (
        const move
        of orderAIMoves(moves)
    ) {
        if (searchTimedOut()) {
            break;
        }

        const nextBoard =
            applyMove(
                move,
                player,
                board
            );

        const score =
            minimax(
                nextBoard,
                otherPlayer(player),
                maxDepth - 1,
                -Infinity,
                Infinity,
                player
            );

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function minimax(
    stateBoard,
    player,
    depth,
    alpha,
    beta,
    aiPlayer
) {
    if (searchTimedOut()) {
        return 0;
    }

    const result =
        getGameResult(
            player,
            stateBoard
        );

    if (result) {
        return terminalScore(
            result,
            aiPlayer,
            depth
        );
    }

    if (depth <= 0) {
        return evaluateBoard(
            stateBoard,
            aiPlayer
        );
    }

    const moves =
        getLegalMoves(
            player,
            stateBoard
        );

    if (moves.length === 0) {
        return evaluateBoard(
            stateBoard,
            aiPlayer
        );
    }

    const maximizing =
        player === aiPlayer;

    if (maximizing) {
        let value = -Infinity;

        for (
            const move
            of orderAIMoves(moves)
        ) {
            const nextBoard =
                applyMove(
                    move,
                    player,
                    stateBoard
                );

            value =
                Math.max(
                    value,
                    minimax(
                        nextBoard,
                        otherPlayer(player),
                        depth - 1,
                        alpha,
                        beta,
                        aiPlayer
                    )
                );

            alpha =
                Math.max(
                    alpha,
                    value
                );

            if (beta <= alpha) {
                break;
            }

            if (searchTimedOut()) {
                break;
            }
        }

        return value;
    }

    let value = Infinity;

    for (
        const move
        of orderAIMoves(moves)
    ) {
        const nextBoard =
            applyMove(
                move,
                player,
                stateBoard
            );

        value =
            Math.min(
                value,
                minimax(
                    nextBoard,
                    otherPlayer(player),
                    depth - 1,
                    alpha,
                    beta,
                    aiPlayer
                )
            );

        beta =
            Math.min(
                beta,
                value
            );

        if (beta <= alpha) {
            break;
        }

        if (searchTimedOut()) {
            break;
        }
    }

    return value;
}

function searchTimedOut() {
    return (
        aiState.cancelled ||
        performance.now() >=
            aiState.deadline
    );
}

function terminalScore(
    result,
    aiPlayer,
    depth
) {
    if (result.type === "tie") {
        return 0;
    }

    if (result.winner === aiPlayer) {
        return 100000 + depth;
    }

    return -100000 - depth;
}

function evaluateBoard(
    stateBoard,
    aiPlayer
) {
    const opponent =
        otherPlayer(aiPlayer);

    const myMoves =
        getLegalMoves(
            aiPlayer,
            stateBoard
        ).length;

    const opponentMoves =
        getLegalMoves(
            opponent,
            stateBoard
        ).length;

    return (
        (myMoves - opponentMoves) *
        10
    );
}

function orderAIMoves(moves) {
    return [...moves].sort(
        (a, b) => {
            const aCenter =
                centerDistance(a);

            const bCenter =
                centerDistance(b);

            return (
                aCenter - bCenter
            );
        }
    );
}

function centerDistance(move) {
    const centerRow =
        (settings.boardHeight - 1) /
        2;

    const centerCol =
        (settings.boardWidth - 1) /
        2;

    return (
        Math.abs(
            move.row - centerRow
        ) +
        Math.abs(
            move.col - centerCol
        )
    );
}

function chooseEasyMove(
    moves,
    player
) {
    let bestMoves = [];
    let bestScore = -Infinity;

    for (const move of moves) {
        const nextBoard =
            applyMove(
                move,
                player,
                board
            );

        const opponent =
            otherPlayer(player);

        const opponentMoves =
            getLegalMoves(
                opponent,
                nextBoard
            ).length;

        const score =
            -opponentMoves +
            Math.random() * 0.5;

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [move];
        } else if (
            Math.abs(
                score - bestScore
            ) < 0.5
        ) {
            bestMoves.push(move);
        }
    }

    return (
        bestMoves[
            Math.floor(
                Math.random() *
                bestMoves.length
            )
        ] ?? moves[0]
    );
}


/* =========================================================
   CLOCKS
========================================================= */

function getCountdownTime() {
    return (
        settings.countdownMinutes *
            60 +
        settings.countdownSeconds
    ) * 1000;
}

function getInitialClock() {
    return settings.timeControl ===
        "countdown"
        ? getCountdownTime()
        : 0;
}

function startClock() {
    stopClock();

    if (
        gameOver ||
        gamePaused
    ) {
        return;
    }

    lastClockTime =
        performance.now();

    clockInterval =
        setInterval(
            tickClock,
            100
        );
}

function stopClock() {
    if (
        clockInterval !== null
    ) {
        clearInterval(
            clockInterval
        );

        clockInterval = null;
    }
}

function restartClockForTurn() {
    stopClock();

    if (
        gameOver ||
        gamePaused
    ) {
        return;
    }

    lastClockTime =
        performance.now();

    clockInterval =
        setInterval(
            tickClock,
            100
        );
}

function tickClock() {
    if (
        gameOver ||
        gamePaused
    ) {
        return;
    }

    const now =
        performance.now();

    const elapsed =
        now - lastClockTime;

    lastClockTime = now;

    if (
        settings.timeControl ===
        "stopwatch"
    ) {
        clocks[currentPlayer] +=
            elapsed;
    } else {
        clocks[currentPlayer] -=
            elapsed;

        if (
            clocks[currentPlayer] <= 0
        ) {
            clocks[currentPlayer] =
                0;

            finishTimeLoss(
                currentPlayer
            );

            return;
        }
    }

    updateClocks();
}

function updateClocks() {
    ui.game.p1Clock.textContent =
        formatDuration(
            clocks[P1]
        );

    ui.game.p2Clock.textContent =
        formatDuration(
            clocks[P2]
        );

    const p1Active =
        !gameOver &&
        !gamePaused &&
        currentPlayer === P1;

    const p2Active =
        !gameOver &&
        !gamePaused &&
        currentPlayer === P2;

    ui.game.p1ClockCard.classList.toggle(
        "active",
        p1Active
    );

    ui.game.p2ClockCard.classList.toggle(
        "active",
        p2Active
    );

    ui.game.p1ClockTurn.textContent =
        p1Active
            ? "Playing"
            : gamePaused
                ? "Paused"
                : "Waiting";

    ui.game.p2ClockTurn.textContent =
        p2Active
            ? "Playing"
            : gamePaused
                ? "Paused"
                : "Waiting";
}

function formatDuration(
    milliseconds
) {
    const totalSeconds =
        Math.max(
            0,
            Math.ceil(
                milliseconds / 1000
            )
        );

    const minutes =
        Math.floor(
            totalSeconds / 60
        );

    const seconds =
        totalSeconds % 60;

    return (
        `${minutes}:${String(
            seconds
        ).padStart(2, "0")}`
    );
}

function finishTimeLoss(player) {
    finishGame({
        type: "time",
        winner: otherPlayer(player),
        message:
            `${playerName(
                player
            )} ran out of time. ` +
            `${playerName(
                otherPlayer(player)
            )} wins!`
    });
}


/* =========================================================
   PAUSE
========================================================= */

function pauseGame() {
    if (
        gameOver ||
        gamePaused
    ) {
        return;
    }

    gamePaused = true;

    cancelAIThinking();
    stopClock();

    ui.game.pause.textContent =
        "Resume";

    updateStatus();
    updateClocks();
    renderBoard();
}

function resumeGame() {
    if (
        gameOver ||
        !gamePaused
    ) {
        return;
    }

    gamePaused = false;

    ui.game.pause.textContent =
        "Pause";

    updateStatus();
    updateClocks();
    renderBoard();

    restartClockForTurn();

    if (isAITurn()) {
        scheduleAI();
    }
}


/* =========================================================
   HOW TO PLAY EXAMPLES
========================================================= */

function buildHowToPlayExamples() {
    buildExample(
        ui.examples.horizontal,
        [
            [P1, P1, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        4
    );

    buildExample(
        ui.examples.vertical,
        [
            [P2, EMPTY, EMPTY, EMPTY],
            [P2, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        4
    );

    buildExample(
        ui.examples.blocked,
        [
            [P1, X, EMPTY, EMPTY],
            [EMPTY, P2, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY, EMPTY]
        ],
        4
    );
}

function buildExample(
    container,
    exampleBoard,
    size
) {
    container.innerHTML = "";

    container.style.gridTemplateColumns =
        `repeat(${size}, 1fr)`;

    for (
        let row = 0;
        row < size;
        row++
    ) {
        for (
            let col = 0;
            col < size;
            col++
        ) {
            const cell =
                document.createElement(
                    "div"
                );

            cell.className =
                "example-cell";

            const value =
                exampleBoard[row][col];

            if (value === P1) {
                cell.style.backgroundColor =
                    settings.p1Color;
            }

            if (value === P2) {
                cell.style.backgroundColor =
                    settings.p2Color;
            }

            if (value === X) {
                cell.style.backgroundColor =
                    "#ff0000";

                cell.style.color =
                    "#ffffff";

                cell.style.fontWeight =
                    "900";

                cell.style.fontSize =
                    "1.5em";

                cell.style.display =
                    "flex";

                cell.style.alignItems =
                    "center";

                cell.style.justifyContent =
                    "center";

                cell.textContent = "X";
            }

            if (value === EMPTY) {
                cell.style.backgroundColor =
                    settings.emptyColor;
            }

            container.appendChild(
                cell
            );
        }
    }
}


/* =========================================================
   BOARD EVENTS
========================================================= */
function updatePreview() {
    // Remove previous preview
    ui.game.board
        .querySelectorAll(".board-cell.preview")
        .forEach(cell => {
            cell.classList.remove("preview");
            cell.style.backgroundColor = "";
        });

    if (!hoverCell) {
        return;
    }

    const previewCells = getMoveCells(
        hoverCell.row,
        hoverCell.col,
        orientations[currentPlayer]
    );

    for (const preview of previewCells) {
        if (!isInsideBoard(preview.row, preview.col)) {
            continue;
        }

        const cell = ui.game.board.querySelector(
            `.board-cell[data-row="${preview.row}"][data-col="${preview.col}"]`
        );

        if (!cell) {
            continue;
        }

        if (board[preview.row][preview.col] === EMPTY) {
            cell.classList.add("preview");
            cell.style.backgroundColor =
                playerColor(currentPlayer);
        }
    }
}

function clearPreview() {
    ui.game.board
        .querySelectorAll(".board-cell.preview")
        .forEach(cell => {
            cell.classList.remove("preview");
            cell.style.backgroundColor = "";
        });
}

ui.game.board.addEventListener(
    "click",
    event => {
        const cell =
            event.target.closest(".board-cell");

        if (!cell) {
            return;
        }

        humanMove(
            Number(cell.dataset.row),
            Number(cell.dataset.col)
        );
    }
);

ui.game.board.addEventListener(
    "mouseover",
    event => {
        const cell =
            event.target.closest(".board-cell");

        if (!cell) {
            return;
        }

        if (
            gameOver ||
            gamePaused ||
            isAITurn() ||
            settings.preview === "off"
        ) {
            return;
        }

        hoverCell = {
            row: Number(cell.dataset.row),
            col: Number(cell.dataset.col)
        };

        // Don't rebuild the board here.
        // Rebuilding the buttons breaks clicking.
        updatePreview();
    }
);

ui.game.board.addEventListener(
    "mouseleave",
    () => {
        hoverCell = null;
        clearPreview();
    }
);


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

document
    .querySelectorAll("[data-back]")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => {
                cancelAIThinking();
                stopClock();

                showScreen(
                    button.dataset.back
                );
            }
        );
    });

ui.menu.play.addEventListener(
    "click",
    () => {
        prepareSetup();
        showScreen("setup");
    }
);

ui.menu.howToPlay.addEventListener(
    "click",
    () => {
        buildHowToPlayExamples();
        showScreen("howToPlay");
    }
);

ui.menu.settings.addEventListener(
    "click",
    openSettings
);


/* =========================================================
   SETUP EVENTS
========================================================= */

ui.setup.p1Color.addEventListener(
    "input",
    updateSetupPreviews
);

ui.setup.p2Color.addEventListener(
    "input",
    updateSetupPreviews
);

ui.setup.gameMode.addEventListener(
    "change",
    updateAIDifficultyVisibility
);

ui.setup.start.addEventListener(
    "click",
    startGameFromSetup
);


/* =========================================================
   SETTINGS EVENTS
========================================================= */

ui.settings.timeControl.addEventListener(
    "change",
    () => {
        settings.timeControl =
            ui.settings.timeControl.value;

        updateCountdownVisibility();
    }
);

ui.settings.theme.addEventListener(
    "change",
    () => {
        settings.theme =
            ui.settings.theme.value;

        applyTheme();
    }
);

ui.settings.cellStyle.addEventListener(
    "change",
    () => {
        settings.cellStyle =
            ui.settings.cellStyle.value;

        applyCellStyle();
    }
);

ui.settings.animations.addEventListener(
    "change",
    () => {
        settings.animations =
            ui.settings.animations.value;

        applyMotionSettings();
    }
);

ui.settings.reducedMotion.addEventListener(
    "change",
    () => {
        settings.reducedMotion =
            ui.settings.reducedMotion.value;

        applyMotionSettings();
    }
);

ui.settings.save.addEventListener(
    "click",
    () => {
        readSettingsUI();
        saveSettings();
        applySettings();

        showScreen("menu");
    }
);

ui.settings.reset.addEventListener(
    "click",
    () => {
        resetSettings();
        populateSettingsUI();
    }
);


/* =========================================================
   GAME EVENTS
========================================================= */

ui.game.pause.addEventListener(
    "click",
    () => {
        if (gamePaused) {
            resumeGame();
        } else {
            pauseGame();
        }
    }
);

ui.game.menu.addEventListener(
    "click",
    showMainMenu
);

ui.game.newGame.addEventListener(
    "click",
    () => {
        cancelAIThinking();
        stopClock();

        prepareSetup();
        showScreen("setup");
    }
);


/* =========================================================
   TAB VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {
        if (
            document.hidden &&
            settings.autoPause === "on" &&
            !gameOver &&
            !gamePaused
        ) {
            pauseGame();
        }
    }
);


/* =========================================================
   SYSTEM THEME
========================================================= */

window
    .matchMedia(
        "(prefers-color-scheme: light)"
    )
    .addEventListener(
        "change",
        () => {
            if (
                settings.theme ===
                "system"
            ) {
                applyTheme();
            }
        }
    );


/* =========================================================
   INITIALIZATION
========================================================= */

applySettings();
prepareSetup();
buildHowToPlayExamples();
showScreen("menu");
