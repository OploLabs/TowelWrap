const TOWEL_WRAP_SERVER =
  "https://towel-wrap.shawn-andrew.workers.dev";

let onlineSocket = null;
let onlineState = null;
let onlinePlayer = null;
let onlineMode = false;
let onlineHoverCell = null;

function getOnlineCredentials() {
  const params = new URLSearchParams(window.location.search);

  return {
    gameId: params.get("game"),
    token: params.get("token"),
  };
}

function onlineWsUrl(gameId, token) {
  const base =
    TOWEL_WRAP_SERVER
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://");

  return (
    `${base}/ws/${encodeURIComponent(gameId)}` +
    `?token=${encodeURIComponent(token)}`
  );
}

function onlineFormatTime(ms) {
  ms = Math.max(0, Math.floor(ms));

  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function onlineOrientationName(orientation) {
  return orientation === "H"
    ? "Horizontal"
    : "Vertical";
}

function onlineGetMoveCells(row, col) {
  if (!onlineState || !onlinePlayer) {
    return [];
  }

  const orientation =
    onlineState.orientations[onlinePlayer];

  const length =
    Number(onlineState.config.pieceLength);

  const cells = [];

  for (let i = 0; i < length; i++) {
    cells.push({
      r: orientation === "H"
        ? row
        : row + i,

      c: orientation === "H"
        ? col + i
        : col,
    });
  }

  return cells;
}

function onlineIsLegalMove(row, col) {
  if (!onlineState) {
    return false;
  }

  // The game MUST be actively playing.
  if (onlineState.status !== "playing") {
    return false;
  }

  // It MUST be this player's turn.
  if (onlineState.currentPlayer !== onlinePlayer) {
    return false;
  }

  const cells = onlineGetMoveCells(row, col);

  if (cells.length === 0) {
    return false;
  }

  return cells.every((cell) => {
    if (
      cell.r < 0 ||
      cell.r >= Number(onlineState.config.boardHeight) ||
      cell.c < 0 ||
      cell.c >= Number(onlineState.config.boardWidth)
    ) {
      return false;
    }

    return onlineState.board[cell.r][cell.c] === 0;
  });
}

function onlineClearPreview() {
  const board =
    document.getElementById("board");

  if (!board) {
    return;
  }

  board
    .querySelectorAll(".preview, .invalid")
    .forEach((cell) => {
      cell.classList.remove(
        "preview",
        "invalid",
      );
    });
}

function onlineShowPreview(row, col) {
  const board =
    document.getElementById("board");

  if (!board || !onlineState) {
    return;
  }

  onlineClearPreview();

  // Never show previews when:
  // - waiting
  // - paused
  // - finished
  // - not our turn
  if (
    onlineState.status !== "playing" ||
    onlineState.currentPlayer !== onlinePlayer
  ) {
    return;
  }

  const cells =
    onlineGetMoveCells(row, col);

  const legal =
    onlineIsLegalMove(row, col);

  for (const moveCell of cells) {
    const element =
      board.querySelector(
        `.cell[data-row="${moveCell.r}"][data-col="${moveCell.c}"]`,
      );

    if (!element) {
      continue;
    }

    element.classList.add(
      legal ? "preview" : "invalid",
    );
  }
}

function installOnlineBoardEvents() {
  const board =
    document.getElementById("board");

  if (!board) {
    return;
  }

  /*
   * IMPORTANT:
   * These handlers use the capture phase so the local game's
   * board handlers don't get a chance to make an online move.
   */

  board.addEventListener(
    "mousemove",
    (event) => {
      if (!onlineMode) {
        return;
      }

      event.stopPropagation();

      const cell =
        event.target.closest(".cell");

      if (!cell) {
        onlineHoverCell = null;
        onlineClearPreview();
        return;
      }

      const row =
        Number(cell.dataset.row);

      const col =
        Number(cell.dataset.col);

      if (
        onlineHoverCell &&
        onlineHoverCell.r === row &&
        onlineHoverCell.c === col
      ) {
        return;
      }

      onlineHoverCell = {
        r: row,
        c: col,
      };

      onlineShowPreview(row, col);
    },
    true,
  );

  board.addEventListener(
    "mouseleave",
    (event) => {
      if (!onlineMode) {
        return;
      }

      event.stopPropagation();

      onlineHoverCell = null;
      onlineClearPreview();
    },
    true,
  );

  board.addEventListener(
    "click",
    (event) => {
      if (!onlineMode) {
        return;
      }

      event.stopPropagation();

      const cell =
        event.target.closest(".cell");

      if (!cell) {
        return;
      }

      const row =
        Number(cell.dataset.row);

      const col =
        Number(cell.dataset.col);

      /*
       * If it isn't our turn, don't do anything.
       */
      if (
        !onlineState ||
        onlineState.status !== "playing" ||
        onlineState.currentPlayer !== onlinePlayer
      ) {
        onlineClearPreview();
        return;
      }

      /*
       * Illegal move:
       * show the red preview but DO NOT send anything.
       */
      if (!onlineIsLegalMove(row, col)) {
        onlineShowPreview(row, col);
        return;
      }

      onlineClearPreview();

      onlineSendMove(row, col);
    },
    true,
  );
}

function onlineRenderBoard() {
  const boardElement =
    document.getElementById("board");

  if (!boardElement || !onlineState) {
    return;
  }

  /*
   * Save the current hover before rebuilding.
   */
  const oldHover = onlineHoverCell;

  boardElement.innerHTML = "";

  document.documentElement.style.setProperty(
    "--board-width",
    onlineState.config.boardWidth,
  );

  for (
    let r = 0;
    r < Number(onlineState.config.boardHeight);
    r++
  ) {
    for (
      let c = 0;
      c < Number(onlineState.config.boardWidth);
      c++
    ) {
      const cell =
        document.createElement("div");

      cell.className = "cell";

      const value =
        onlineState.board[r][c];

      if (value === 1) {
        cell.classList.add("p1");
      } else if (value === 2) {
        cell.classList.add("p2");
      }

      /*
       * Only mark empty cells clickable while:
       * - game is playing
       * - it is our turn
       */
      if (
        onlineState.status === "playing" &&
        onlineState.currentPlayer === onlinePlayer &&
        value === 0
      ) {
        cell.classList.add("clickable");
      }

      cell.dataset.row = r;
      cell.dataset.col = c;

      boardElement.appendChild(cell);
    }
  }

  /*
   * Restore hover preview only if the game is still
   * playable.
   */
  if (
    oldHover &&
    onlineState.status === "playing" &&
    onlineState.currentPlayer === onlinePlayer
  ) {
    onlineHoverCell = oldHover;

    onlineShowPreview(
      oldHover.r,
      oldHover.c,
    );
  } else {
    onlineHoverCell = null;
    onlineClearPreview();
  }
}

function onlineUpdateUI() {
  if (!onlineState) {
    return;
  }

  const turnText =
    document.getElementById("turnText");

  const substatus =
    document.getElementById("substatus");

  const moveCount =
    document.getElementById("moveCount");

  const p1Orientation =
    document.getElementById("p1Orientation");

  const p2Orientation =
    document.getElementById("p2Orientation");

  const timeControlLabel =
    document.getElementById("timeControlLabel");

  if (moveCount) {
    moveCount.textContent =
      String(onlineState.moveCount);
  }

  if (p1Orientation) {
    p1Orientation.textContent =
      onlineOrientationName(
        onlineState.orientations[1],
      );
  }

  if (p2Orientation) {
    p2Orientation.textContent =
      onlineOrientationName(
        onlineState.orientations[2],
      );
  }

  if (timeControlLabel) {
    timeControlLabel.textContent =
      onlineState.config.timeControl === "stopwatch"
        ? "Stopwatch"
        : "Countdown";
  }

  if (onlineState.status === "waiting") {
    turnText.textContent =
      "Waiting for player 2...";

    substatus.textContent =
      "Share the username and password with your opponent.";

    return;
  }

  if (onlineState.status === "paused") {
    turnText.textContent =
      "Game paused";

    substatus.textContent =
      "Both clocks are stopped.";

    return;
  }

  if (onlineState.status === "finished") {
    if (onlineState.tie) {
      turnText.textContent =
        "It's a tie!";

      substatus.textContent =
        "The game ended in a tie.";
    } else if (
      onlineState.winner === onlinePlayer
    ) {
      turnText.textContent =
        "You win!";

      substatus.textContent =
        "You won the game.";
    } else {
      turnText.textContent =
        "You lose";

      substatus.textContent =
        "Your opponent won the game.";
    }

    return;
  }

  if (
    onlineState.currentPlayer === onlinePlayer
  ) {
    turnText.textContent =
      "Your turn";

    substatus.textContent =
      onlineOrientationName(
        onlineState.orientations[
          onlineState.currentPlayer
        ],
      );
  } else {
    turnText.textContent =
      "Opponent's turn";

    substatus.textContent =
      onlineOrientationName(
        onlineState.orientations[
          onlineState.currentPlayer
        ],
      );
  }
}

function onlineUpdateClocks() {
  if (!onlineState) {
    return;
  }

  const p1Clock =
    document.getElementById("p1Clock");

  const p2Clock =
    document.getElementById("p2Clock");

  const p1ClockCard =
    document.getElementById("p1ClockCard");

  const p2ClockCard =
    document.getElementById("p2ClockCard");

  const p1ClockTurn =
    document.getElementById("p1ClockTurn");

  const p2ClockTurn =
    document.getElementById("p2ClockTurn");

  if (p1Clock) {
    p1Clock.textContent =
      onlineFormatTime(
        onlineState.playerTimeMs[1],
      );
  }

  if (p2Clock) {
    p2Clock.textContent =
      onlineFormatTime(
        onlineState.playerTimeMs[2],
      );
  }

  const p1Active =
    onlineState.status === "playing" &&
    onlineState.currentPlayer === 1;

  const p2Active =
    onlineState.status === "playing" &&
    onlineState.currentPlayer === 2;

  if (p1ClockCard) {
    p1ClockCard.classList.toggle(
      "active",
      p1Active,
    );
  }

  if (p2ClockCard) {
    p2ClockCard.classList.toggle(
      "active",
      p2Active,
    );
  }

  if (p1ClockTurn) {
    p1ClockTurn.textContent =
      p1Active
        ? onlinePlayer === 1
          ? "Your turn"
          : "Opponent"
        : "Waiting";
  }

  if (p2ClockTurn) {
    p2ClockTurn.textContent =
      p2Active
        ? onlinePlayer === 2
          ? "Your turn"
          : "Opponent"
        : "Waiting";
  }
}

function onlineApplyState(state) {
    onlineState = state;
  
    onlineHoverCell = null;
  
    document.documentElement.style.setProperty(
      "--current-player-color",
      onlineState.currentPlayer === 1
        ? "var(--p1)"
        : "var(--p2)",
    );
  
    onlineRenderBoard();
    onlineClearPreview();
    onlineUpdateUI();
    onlineUpdateClocks();
  }
function onlineSendMove(row, col) {
  if (!onlineSocket) {
    return;
  }

  if (
    onlineSocket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  if (!onlineState) {
    return;
  }

  if (onlineState.status !== "playing") {
    return;
  }

  if (onlineState.currentPlayer !== onlinePlayer) {
    return;
  }

  if (!onlineIsLegalMove(row, col)) {
    return;
  }

  onlineSocket.send(
    JSON.stringify({
      type: "move",
      row,
      col,
    }),
  );
}

function onlineConnect(gameId, token) {
  onlineMode = true;

  installOnlineBoardEvents();

  onlineSocket =
    new WebSocket(
      onlineWsUrl(
        gameId,
        token,
      ),
    );

  onlineSocket.addEventListener(
    "open",
    () => {
      console.log(
        "Connected to Towel Wrap server.",
      );
    },
  );

  onlineSocket.addEventListener(
    "message",
    (event) => {
      let message;

      try {
        message =
          JSON.parse(event.data);
      } catch {
        return;
      }

      if (
        message.type === "connected"
      ) {
        onlinePlayer =
          Number(message.player);

        return;
      }

      if (
        message.type === "state"
      ) {
        onlineApplyState(
          message.state,
        );

        return;
      }

      if (
        message.type === "error"
      ) {
        const substatus =
          document.getElementById(
            "substatus",
          );

        if (substatus) {
          substatus.textContent =
            message.message ||
            "A server error occurred.";
        }
      }
    },
  );

  onlineSocket.addEventListener(
    "close",
    () => {
      if (
        onlineState &&
        onlineState.status === "finished"
      ) {
        return;
      }

      const substatus =
        document.getElementById(
          "substatus",
        );

      if (substatus) {
        substatus.textContent =
          "Connection to the server was lost.";
      }
    },
  );

  onlineSocket.addEventListener(
    "error",
    () => {
      const substatus =
        document.getElementById(
          "substatus",
        );

      if (substatus) {
        substatus.textContent =
          "Could not connect to the game server.";
      }
    },
  );
}

function onlineStart() {
  const credentials =
    getOnlineCredentials();

  if (
    !credentials.gameId ||
    !credentials.token
  ) {
    const substatus =
      document.getElementById(
        "substatus",
      );

    if (substatus) {
      substatus.textContent =
        "Missing online game information.";
    }

    return;
  }

  onlineConnect(
    credentials.gameId,
    credentials.token,
  );
}

window.TowelWrapOnline = {
  start: onlineStart,
  connect: onlineConnect,
  sendMove: onlineSendMove,
};