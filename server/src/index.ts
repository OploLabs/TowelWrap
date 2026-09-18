import { DurableObject } from "cloudflare:workers";

interface Env {
  MY_DURABLE_OBJECT: DurableObjectNamespace<MyDurableObject>;
  towel_wrap: D1Database;
}

interface GameConfig {
  boardWidth: number;
  boardHeight: number;
  pieceLength: number;
  oppositeOrientations: boolean;
  noMove: "lose" | "tie";
  fullBoard: "win" | "tie";
  timeControl: "stopwatch" | "countdown";
  countdownMinutes: number;
  countdownSeconds: number;
  startingPlayer: 1 | 2;
  player1Orientation?: "H" | "V";
}

interface GameState {
  board: number[][];
  currentPlayer: 1 | 2;
  orientations: {
    1: "H" | "V";
    2: "H" | "V";
  };
  moveCount: number;
  status: "waiting" | "playing" | "paused" | "finished";
  winner: 0 | 1 | 2;
  tie: boolean;
  playerTimeMs: {
    1: number;
    2: number;
  };
  turnStartedAt: number | null;
  config: GameConfig;
}

interface PlayerSession {
  token: string;
  player: 1 | 2;
}

interface ClientMessage {
  type: string;
  [key: string]: unknown;
}

const EMPTY = 0;
const P1 = 1;
const P2 = 2;

const GAME_TTL_MS = 6 * 60 * 60 * 1000;

const PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function json(
  data: unknown,
  status = 200,
  origin = "*",
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function randomToken(byteLength = 32): string {
  const bytes = randomBytes(byteLength);

  let result = "";

  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, "0");
  }

  return result;
}

function randomPassword(length = 16): string {
  const bytes = randomBytes(length);

  let password = "";

  for (const byte of bytes) {
    password += PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length];
  }

  return password;
}

async function sha256(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);

  const hash = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeUsername(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const username = value.trim();

  if (username.length < 1 || username.length > 32) {
    return null;
  }

  return username;
}

function clampInteger(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.floor(number)));
}

function normalizeConfig(input: unknown): GameConfig {
  const source =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const boardWidth = clampInteger(
    source.boardWidth,
    2,
    20,
    7,
  );

  const boardHeight = clampInteger(
    source.boardHeight,
    2,
    20,
    8,
  );

  const pieceLength = clampInteger(
    source.pieceLength,
    1,
    Math.min(boardWidth, boardHeight),
    2,
  );

  const noMove =
    source.noMove === "tie"
      ? "tie"
      : "lose";

  const fullBoard =
    source.fullBoard === "win"
      ? "win"
      : "tie";

  const timeControl =
    source.timeControl === "countdown"
      ? "countdown"
      : "stopwatch";

  const countdownMinutes = clampInteger(
    source.countdownMinutes,
    0,
    60 * 24,
    10,
  );

  const countdownSeconds = clampInteger(
    source.countdownSeconds,
    0,
    59,
    0,
  );

  const startingPlayer =
    source.startingPlayer === 2
      ? 2
      : 1;

  const player1Orientation =
    source.player1Orientation === "V"
      ? "V"
      : source.player1Orientation === "H"
        ? "H"
        : undefined;

  return {
    boardWidth,
    boardHeight,
    pieceLength,
    oppositeOrientations:
      source.oppositeOrientations !== false,
    noMove,
    fullBoard,
    timeControl,
    countdownMinutes,
    countdownSeconds,
    startingPlayer,
    player1Orientation,
  };
}

function createEmptyBoard(
  width: number,
  height: number,
): number[][] {
  return Array.from(
    { length: height },
    () => Array(width).fill(EMPTY),
  );
}

function getInitialOrientation(
  config: GameConfig,
): "H" | "V" {
  if (config.player1Orientation) {
    return config.player1Orientation;
  }

  return crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0
    ? "H"
    : "V";
}

function getOppositeOrientation(
  orientation: "H" | "V",
): "H" | "V" {
  return orientation === "H" ? "V" : "H";
}

function createInitialState(
  config: GameConfig,
): GameState {
  const p1Orientation = getInitialOrientation(config);

  const p2Orientation = config.oppositeOrientations
    ? getOppositeOrientation(p1Orientation)
    : p1Orientation;

  const initialTime =
    config.timeControl === "countdown"
      ? (
          config.countdownMinutes * 60 * 1000 +
          config.countdownSeconds * 1000
        )
      : 0;

  return {
    board: createEmptyBoard(
      config.boardWidth,
      config.boardHeight,
    ),

    currentPlayer: config.startingPlayer,

    orientations: {
      1: p1Orientation,
      2: p2Orientation,
    },

    moveCount: 0,

    status: "waiting",

    winner: 0,

    tie: false,

    playerTimeMs: {
      1: initialTime,
      2: initialTime,
    },

    turnStartedAt: null,

    config,
  };
}

function getLegalMoves(
  state: GameState,
  player: 1 | 2,
): { cells: { r: number; c: number }[] }[] {
  const moves: { cells: { r: number; c: number }[] }[] = [];

  const orientation = state.orientations[player];

  for (
    let r = 0;
    r < state.config.boardHeight;
    r++
  ) {
    for (
      let c = 0;
      c < state.config.boardWidth;
      c++
    ) {
      const cells: { r: number; c: number }[] = [];

      for (
        let i = 0;
        i < state.config.pieceLength;
        i++
      ) {
        const cellR =
          orientation === "H"
            ? r
            : r + i;

        const cellC =
          orientation === "H"
            ? c + i
            : c;

        cells.push({
          r: cellR,
          c: cellC,
        });
      }

      const inside = cells.every(
        (cell) =>
          cell.r >= 0 &&
          cell.r < state.config.boardHeight &&
          cell.c >= 0 &&
          cell.c < state.config.boardWidth,
      );

      if (!inside) {
        continue;
      }

      const empty = cells.every(
        (cell) =>
          state.board[cell.r][cell.c] === EMPTY,
      );

      if (empty) {
        moves.push({ cells });
      }
    }
  }

  return moves;
}

function isBoardFull(state: GameState): boolean {
  return state.board.every((row) =>
    row.every((cell) => cell !== EMPTY),
  );
}

function getRemainingTime(
  state: GameState,
  player: 1 | 2,
  now: number,
): number {
  let time = state.playerTimeMs[player];

  if (
    state.status === "playing" &&
    state.currentPlayer === player &&
    state.turnStartedAt !== null
  ) {
    time -= now - state.turnStartedAt;
  }

  return Math.max(0, time);
}

function updateClock(
  state: GameState,
  now: number,
): void {
  if (
    state.status !== "playing" ||
    state.turnStartedAt === null
  ) {
    return;
  }

  const player = state.currentPlayer;

  if (state.config.timeControl === "stopwatch") {
    state.playerTimeMs[player] +=
      now - state.turnStartedAt;
  } else {
    state.playerTimeMs[player] = Math.max(
      0,
      state.playerTimeMs[player] -
        (now - state.turnStartedAt),
    );
  }

  state.turnStartedAt = now;
}

function stateForClient(
  state: GameState,
  now: number,
): GameState {
  return {
    ...state,

    playerTimeMs: {
      1: getRemainingTime(state, 1, now),
      2: getRemainingTime(state, 2, now),
    },

    turnStartedAt:
      state.status === "playing"
        ? now
        : null,
  };
}

export class MyDurableObject extends DurableObject<Env> {
  private state: GameState | null = null;
  private sessions = new Map<
    string,
    PlayerSession
  >();

  constructor(
    ctx: DurableObjectState,
    env: Env,
  ) {
    super(ctx, env);
  }

  private async loadState(): Promise<void> {
    if (this.state !== null) {
      return;
    }

    const stored = await this.ctx.storage.get<GameState>(
      "gameState",
    );

    this.state = stored ?? null;

    const sessions =
      await this.ctx.storage.get<PlayerSession[]>(
        "sessions",
      );

    if (sessions) {
      this.sessions = new Map(
        sessions.map((session) => [
          session.token,
          session,
        ]),
      );
    }
  }

  private async saveState(): Promise<void> {
    if (this.state === null) {
      return;
    }

    await this.ctx.storage.put(
      "gameState",
      this.state,
    );

    await this.ctx.storage.put(
      "sessions",
      Array.from(this.sessions.values()),
    );
  }

  private async cleanupGame(): Promise<void> {
    await this.env.towel_wrap
      .prepare(
        "DELETE FROM private_games WHERE id = ?1",
      )
      .bind(this.ctx.id.toString())
      .run();

    await this.ctx.storage.deleteAll();

    this.state = null;
    this.sessions.clear();
  }

  private async scheduleCleanup(): Promise<void> {
    await this.ctx.storage.setAlarm(
      Date.now() + GAME_TTL_MS,
    );
  }

  private broadcast(data: unknown): void {
    const message = JSON.stringify(data);

    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        // The socket may already be closed.
      }
    }
  }

  private sendState(): void {
    if (this.state === null) {
      return;
    }

    this.broadcast({
      type: "state",
      state: stateForClient(
        this.state,
        Date.now(),
      ),
    });
  }

  private finishGame(
    winner: 0 | 1 | 2,
    tie = false,
  ): void {
    if (this.state === null) {
      return;
    }

    updateClock(
      this.state,
      Date.now(),
    );

    this.state.status = "finished";
    this.state.winner = winner;
    this.state.tie = tie;
    this.state.turnStartedAt = null;

    this.sendState();

    void this.cleanupAfterDelay();
  }

  private async cleanupAfterDelay(): Promise<void> {
    await this.ctx.storage.setAlarm(
      Date.now() + 5 * 60 * 1000,
    );
  }

  private checkTimeout(): void {
    if (this.state === null) {
      return;
    }

    if (
      this.state.status !== "playing" ||
      this.state.config.timeControl !== "countdown"
    ) {
      return;
    }

    const now = Date.now();

    const remaining = getRemainingTime(
      this.state,
      this.state.currentPlayer,
      now,
    );

    if (remaining <= 0) {
      const loser = this.state.currentPlayer;
      const winner = loser === P1 ? P2 : P1;

      this.state.playerTimeMs[loser] = 0;

      this.finishGame(
        winner,
        false,
      );

      return;
    }

    this.sendState();
  }

  private async handleMove(
    player: 1 | 2,
    row: unknown,
    col: unknown,
  ): Promise<void> {
    if (this.state === null) {
      return;
    }

    if (this.state.status !== "playing") {
      return;
    }

    this.checkTimeout();

    if (this.state.status !== "playing") {
      return;
    }

    if (this.state.currentPlayer !== player) {
      return;
    }

    const r = Number(row);
    const c = Number(col);

    if (
      !Number.isInteger(r) ||
      !Number.isInteger(c)
    ) {
      return;
    }

    const orientation =
      this.state.orientations[player];

    const cells: {
      r: number;
      c: number;
    }[] = [];

    for (
      let i = 0;
      i < this.state.config.pieceLength;
      i++
    ) {
      const cellR =
        orientation === "H"
          ? r
          : r + i;

      const cellC =
        orientation === "H"
          ? c + i
          : c;

      cells.push({
        r: cellR,
        c: cellC,
      });
    }

    const inside = cells.every(
      (cell) =>
        cell.r >= 0 &&
        cell.r < this.state!.config.boardHeight &&
        cell.c >= 0 &&
        cell.c < this.state!.config.boardWidth,
    );

    if (!inside) {
      return;
    }

    const empty = cells.every(
      (cell) =>
        this.state!.board[cell.r][cell.c] ===
        EMPTY,
    );

    if (!empty) {
      return;
    }

    updateClock(
      this.state,
      Date.now(),
    );

    if (
      this.state.config.timeControl ===
        "countdown" &&
      this.state.playerTimeMs[player] <= 0
    ) {
      const winner =
        player === P1 ? P2 : P1;

      this.finishGame(
        winner,
        false,
      );

      return;
    }

    for (const cell of cells) {
      this.state.board[cell.r][cell.c] =
        player;
    }

    this.state.moveCount++;

    const now = Date.now();

    if (isBoardFull(this.state)) {
      if (
        this.state.config.fullBoard ===
        "win"
      ) {
        this.finishGame(
          player,
          false,
        );
      } else {
        this.finishGame(
          0,
          true,
        );
      }

      return;
    }

    const nextPlayer =
      player === P1 ? P2 : P1;

    this.state.currentPlayer =
      nextPlayer;

    const legalMoves = getLegalMoves(
      this.state,
      nextPlayer,
    );

    if (legalMoves.length === 0) {
      if (
        this.state.config.noMove ===
        "lose"
      ) {
        this.finishGame(
          player,
          false,
        );
      } else {
        this.finishGame(
          0,
          true,
        );
      }

      return;
    }

    this.state.turnStartedAt = now;

    await this.saveState();

    this.sendState();
  }

  private async handleMessage(
    socket: WebSocket,
    player: 1 | 2,
    message: string,
  ): Promise<void> {
    let data: ClientMessage;

    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (data.type === "move") {
      await this.handleMove(
        player,
        data.row,
        data.col,
      );

      return;
    }

    if (data.type === "pause") {
      await this.handlePause(player);

      return;
    }

    if (data.type === "resume") {
      await this.handleResume(player);

      return;
    }

    if (data.type === "ping") {
      socket.send(
        JSON.stringify({
          type: "pong",
        }),
      );
    }
  }

  private async handlePause(
    _player: 1 | 2,
  ): Promise<void> {
    if (this.state === null) {
      return;
    }

    if (this.state.status !== "playing") {
      return;
    }

    updateClock(
      this.state,
      Date.now(),
    );

    this.state.status = "paused";
    this.state.turnStartedAt = null;

    await this.saveState();

    this.sendState();
  }

  private async handleResume(
    _player: 1 | 2,
  ): Promise<void> {
    if (this.state === null) {
      return;
    }

    if (this.state.status !== "paused") {
      return;
    }

    this.state.status = "playing";
    this.state.turnStartedAt =
      Date.now();

    await this.saveState();

    this.sendState();
  }

  async fetch(
    request: Request,
  ): Promise<Response> {
    await this.loadState();

    const url = new URL(request.url);

    if (
      request.method === "POST" &&
      url.pathname === "/init"
    ) {
      const body = await request.json() as {
        config?: unknown;
      };

      if (this.state !== null) {
        return json({
          ok: true,
        });
      }

      const config = normalizeConfig(
        body.config,
      );

      this.state =
        createInitialState(config);

      await this.saveState();
      await this.scheduleCleanup();

      return json({
        ok: true,
      });
    }

    if (
      request.method === "POST" &&
      url.pathname === "/claim"
    ) {
      const body = await request.json() as {
        token?: unknown;
      };

      if (
        typeof body.token !== "string" ||
        body.token.length < 16
      ) {
        return json(
          { error: "Invalid session" },
          401,
        );
      }

      if (this.sessions.has(body.token)) {
        const session =
          this.sessions.get(body.token)!;

        return json({
          ok: true,
          player: session.player,
        });
      }

      let player: 1 | 2 | null = null;

      const existingPlayers =
        new Set(
          Array.from(
            this.sessions.values(),
          ).map(
            (session) => session.player,
          ),
        );

      if (!existingPlayers.has(P1)) {
        player = P1;
      } else if (!existingPlayers.has(P2)) {
        player = P2;
      }

      if (player === null) {
        return json(
          { error: "Game is full" },
          409,
        );
      }

      const session: PlayerSession = {
        token: body.token,
        player,
      };

      this.sessions.set(
        body.token,
        session,
      );

      if (
        this.state !== null &&
        this.state.status === "waiting" &&
        this.sessions.size >= 2
      ) {
        this.state.status = "playing";
        this.state.turnStartedAt =
          Date.now();
      }

      await this.saveState();

      this.sendState();

      return json({
        ok: true,
        player,
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/state"
    ) {
      if (this.state === null) {
        return json(
          { error: "Game not initialized" },
          404,
        );
      }

      return json({
        state: stateForClient(
          this.state,
          Date.now(),
        ),
      });
    }

    if (
      request.method === "GET" &&
      url.pathname === "/ws"
    ) {
      const token =
        url.searchParams.get("token");

      if (!token) {
        return new Response(
          "Invalid session",
          { status: 401 },
        );
      }

      const session =
        this.sessions.get(token);

      if (!session) {
        return new Response(
          "Invalid session",
          { status: 401 },
        );
      }

      if (
        request.headers.get(
          "Upgrade",
        )?.toLowerCase() !== "websocket"
      ) {
        return new Response(
          "Expected WebSocket",
          { status: 426 },
        );
      }

      const pair =
        new WebSocketPair();

      const client =
        pair[0];

      const server =
        pair[1];

      server.serializeAttachment({
        token,
        player: session.player,
      });

      this.ctx.acceptWebSocket(server);

      server.send(
        JSON.stringify({
          type: "connected",
          player: session.player,
        }),
      );

      if (this.state !== null) {
        server.send(
          JSON.stringify({
            type: "state",
            state: stateForClient(
              this.state,
              Date.now(),
            ),
          }),
        );
      }

      return new Response(
        null,
        {
          status: 101,
          webSocket: client,
        },
      );
    }

    return json({
      ok: true,
      service: "Towel Wrap Server",
    });
  }

  async webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): Promise<void> {
    const attachment =
      ws.deserializeAttachment() as
        | PlayerSession
        | null;

    if (!attachment) {
      return;
    }

    const text =
      typeof message === "string"
        ? message
        : new TextDecoder().decode(
            message,
          );

    await this.handleMessage(
      ws,
      attachment.player,
      text,
    );
  }

  async webSocketClose(
    ws: WebSocket,
  ): Promise<void> {
    try {
      ws.close();
    } catch {
      // Already closed.
    }
  }

  async webSocketError(
    _ws: WebSocket,
  ): Promise<void> {
    // Nothing required here.
  }

  async alarm(): Promise<void> {
    await this.loadState();

    if (this.state === null) {
      await this.cleanupGame();
      return;
    }

    if (
      this.state.status === "finished"
    ) {
      await this.cleanupGame();
      return;
    }

    await this.cleanupGame();
  }
}

async function createGame(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: {
    username?: unknown;
    config?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return json(
      { error: "Invalid request" },
      400,
    );
  }

  const username =
    normalizeUsername(body.username);

  if (!username) {
    return json(
      { error: "Invalid username" },
      400,
    );
  }

  const config =
    normalizeConfig(body.config);

  for (let attempt = 0; attempt < 5; attempt++) {
    const gameId =
      crypto.randomUUID();

    const password =
      randomPassword(16);

    const passwordHash =
      await sha256(password);

    const now = Date.now();

    const expiresAt =
      now + GAME_TTL_MS;

    try {
      await env.towel_wrap
        .prepare(
          `INSERT INTO private_games
          (
            id,
            username,
            password_hash,
            created_at,
            expires_at,
            config_json
          )
          VALUES
          (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(
          gameId,
          username,
          passwordHash,
          now,
          expiresAt,
          JSON.stringify(config),
        )
        .run();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      if (
        message.toLowerCase().includes(
          "unique",
        )
      ) {
        continue;
      }

      throw error;
    }

    const id =
      env.MY_DURABLE_OBJECT.idFromName(
        gameId,
      );

    const stub =
      env.MY_DURABLE_OBJECT.get(id);

    await stub.fetch(
      "https://towel-wrap.internal/init",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          config,
        }),
      },
    );

    const sessionToken =
      randomToken(32);

    const claim =
      await stub.fetch(
        "https://towel-wrap.internal/claim",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token: sessionToken,
          }),
        },
      );

    if (!claim.ok) {
      await env.towel_wrap
        .prepare(
          "DELETE FROM private_games WHERE id = ?1",
        )
        .bind(gameId)
        .run();

      return json(
        { error: "Could not create game" },
        500,
      );
    }

    return json({
      gameId,
      username,
      password,
      sessionToken,
      player: 1,
      expiresAt,
    });
  }

  return json(
    { error: "Could not create game" },
    500,
  );
}

async function joinGame(
  request: Request,
  env: Env,
): Promise<Response> {
  let body: {
    username?: unknown;
    password?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return json(
      {
        error:
          "Not correct username or password",
      },
      401,
    );
  }

  const username =
    normalizeUsername(body.username);

  const password =
    typeof body.password === "string"
      ? body.password
      : "";

  if (!username || password.length === 0) {
    return json(
      {
        error:
          "Not correct username or password",
      },
      401,
    );
  }

  const passwordHash =
    await sha256(password);

  const result =
    await env.towel_wrap
      .prepare(
        `SELECT
          id,
          username,
          password_hash,
          expires_at
        FROM private_games
        WHERE username = ?1
        AND expires_at > ?2`,
      )
      .bind(
        username,
        Date.now(),
      )
      .all<{
        id: string;
        username: string;
        password_hash: string;
        expires_at: number;
      }>();

  const game =
    result.results.find(
      (row) =>
        row.password_hash ===
        passwordHash,
    );

  if (!game) {
    return json(
      {
        error:
          "Not correct username or password",
      },
      401,
    );
  }

  const id =
    env.MY_DURABLE_OBJECT.idFromName(
      game.id,
    );

  const stub =
    env.MY_DURABLE_OBJECT.get(id);

  const sessionToken =
    randomToken(32);

  const claim =
    await stub.fetch(
      "https://towel-wrap.internal/claim",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          token: sessionToken,
        }),
      },
    );

  if (!claim.ok) {
    const claimData =
      await claim.json().catch(
        () => ({}),
      ) as {
        error?: string;
      };

    return json(
      {
        error:
          claimData.error ??
          "Game is full",
      },
      claim.status,
    );
  }

  const claimData =
    await claim.json() as {
      player: 1 | 2;
    };

  return json({
    gameId: game.id,
    username: game.username,
    sessionToken,
    player: claimData.player,
    expiresAt: game.expires_at,
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const origin =
      request.headers.get("Origin") ?? "*";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":
            origin,
          "Access-Control-Allow-Methods":
            "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type",
          "Access-Control-Max-Age":
            "86400",
        },
      });
    }

    const url = new URL(request.url);

    try {
      if (
        request.method === "POST" &&
        url.pathname === "/api/games"
      ) {
        return await createGame(
          request,
          env,
        );
      }

      if (
        request.method === "POST" &&
        url.pathname === "/api/join"
      ) {
        return await joinGame(
          request,
          env,
        );
      }

      const wsMatch =
        url.pathname.match(
          /^\/ws\/([^/]+)$/,
        );

      if (wsMatch) {
        const gameId =
          decodeURIComponent(
            wsMatch[1],
          );

        const token =
          url.searchParams.get(
            "token",
          );

        if (!token) {
          return new Response(
            "Invalid session",
            { status: 401 },
          );
        }

        const id =
          env.MY_DURABLE_OBJECT.idFromName(
            gameId,
          );

        const stub =
          env.MY_DURABLE_OBJECT.get(id);

        const target =
          new URL(
            "https://towel-wrap.internal/ws",
          );

        target.searchParams.set(
          "token",
          token,
        );

        return stub.fetch(
          new Request(
            target,
            request,
          ),
        );
      }

      return json(
        {
          service: "Towel Wrap Server",
          status: "online",
        },
        200,
        origin,
      );
    } catch (error) {
      console.error(error);

      return json(
        {
          error:
            "Internal server error",
        },
        500,
        origin,
      );
    }
  },
};