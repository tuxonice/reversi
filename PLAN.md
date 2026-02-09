# Reversi (React) — Project Plan

## 1) Goals

- Build a playable Reversi game in the browser.
- Support local play (2 players on the same device) as the baseline.
- Provide a clean UI for legal moves, turns, scoring, and end-of-game.
- Keep the codebase maintainable: clear separation between UI and game engine.

## 2) Non-Goals (initial MVP)

- Online multiplayer.
- Accounts / persistence / leaderboards.
- Advanced AI (we can start with “passive hints” or a simple bot later).

## 3) Tech Stack (proposed)

- React + TypeScript
- Vite (dev server/build)
- Styling: CSS Modules or Tailwind (pick one; CSS Modules keeps it simple)
- Testing
  - Unit tests: Vitest
  - Component tests: React Testing Library

## 4) Core Requirements (Rules)

- 8x8 board.
- Initial position: 4 discs in the center (2 black, 2 white).
- A move is legal if it flips at least one opponent disc in any of 8 directions.
- After placing a disc, flip all bracketed opponent discs in all directions.
- If the current player has no legal moves, they must pass.
- Game ends when
  - the board is full, or
  - neither player has a legal move.
- Winner is the player with more discs.

## 5) UX / UI Requirements

- Board grid with discs.
- Highlight legal moves for the current player.
- Show current player turn.
- Show score (black/white counts).
- Show “no moves available → pass” UI and/or automatic pass with a clear message.
- End-of-game modal/section with winner and “Play again”.
- Accessibility
  - Board cells keyboard-focusable.
  - Move placement possible via keyboard.
  - Sufficient contrast and clear focus rings.

## 6) Data Model (suggested)

- `Player`: `'black' | 'white'`
- `Cell`: `Player | null`
- `Board`: `Cell[][]` (8x8)
- `Move`: `{ row: number; col: number }`
- `GameState`
  - `board: Board`
  - `currentPlayer: Player`
  - `status: 'playing' | 'passed' | 'finished'`
  - `lastMove?: Move`
  - `message?: string` (optional UI message)

## 7) Architecture

### 7.1 Game engine (pure functions)

Place all game rules in a small “engine” module with no React imports.

- `createInitialBoard(): Board`
- `getLegalMoves(board: Board, player: Player): Move[]`
- `applyMove(board: Board, player: Player, move: Move): { board: Board; flipped: Move[] }`
- `countDiscs(board: Board): { black: number; white: number }`
- `getOpponent(player: Player): Player`
- `hasAnyLegalMove(board: Board, player: Player): boolean`
- `computeGameResult(board: Board): { status: 'finished'; winner: Player | 'draw'; black: number; white: number }`

Invariants

- Engine must never mutate the input `board`.
- `applyMove` must validate legality and throw or return an error result if illegal.

### 7.2 React UI

- `App`: top-level layout.
- `Game`: owns `GameState` and orchestrates turn/pass/game end.
- `BoardView`: renders 8x8 grid.
- `Square`: single cell button.
- `HUD`: current player, scores, messages, restart button.
- `GameOverDialog` (optional): end state.

State management

- Use `useReducer` for predictable state transitions.
- Keep derived state computed via selectors (e.g., legal moves) rather than duplicating.

## 8) Implementation Milestones

### Milestone A — Project scaffolding

- Create React + TS app (Vite).
- Add basic folder structure
  - `src/engine/*`
  - `src/components/*`
  - `src/styles/*`
- Add formatter/linter config (optional but recommended).

Deliverable

- App runs, shows a placeholder layout.

### Milestone B — Engine: board + move legality

- Implement
  - board initialization
  - direction scanning
  - legal move detection

Tests

- `createInitialBoard` produces correct 4-center discs.
- `getLegalMoves` on initial board returns the standard 4 legal moves for black.
- Edge cases
  - no flips => illegal
  - out-of-bounds scanning
  - lines with gaps

Deliverable

- Engine functions fully tested for legal move calculation.

### Milestone C — Engine: apply move + flipping + scoring

- Implement `applyMove` and ensure it flips discs in all valid directions.
- Implement `countDiscs`.

Tests

- Applying a known legal move flips expected discs.
- Illegal move rejected.
- Score updates correctly after a move.

Deliverable

- Complete rules for a single move cycle.

### Milestone D — UI: render board + place moves

- Render 8x8 board with clickable squares.
- On click: attempt to place disc via engine.
- Show current player.

Tests

- Render initial board discs.
- Clicking a legal move updates the UI.

Deliverable

- Basic playable board without pass/end logic.

### Milestone E — Turn management: pass + end game

- On each turn
  - compute legal moves for current player
  - if none, pass to opponent and show message
  - if neither has moves, end game

Tests

- When current player has no moves, turn passes.
- Game ends when neither has moves.

Deliverable

- Fully playable local 2-player game.

### Milestone F — UX polish + accessibility

- Highlight legal moves.
- Add keyboard navigation (arrow keys optional; at least tab/enter).
- Add “Restart game” button.
- Add end-game screen/modal.

Tests

- Legal moves highlight appears.
- Keyboard activation triggers a move.

Deliverable

- MVP with solid UX.

## 9) Optional Enhancements (post-MVP)

- Single-player vs AI
  - Start with heuristic AI (maximize immediate flips / mobility)
  - Add depth-limited minimax later
- Move history + undo/redo.
- Animations for flipping.
- Board size variants (6x6, 10x10) behind a settings toggle.
- Persistence (localStorage) for last game.

## 10) Acceptance Criteria (MVP)

- You can complete a full game following standard rules.
- Legal moves are enforced (no illegal placement).
- Pass is handled correctly.
- Game ends correctly with winner/draw shown.
- Unit tests cover engine logic for legality/flipping/end-game.
- UI has at least basic accessibility support.
