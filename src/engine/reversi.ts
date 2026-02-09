export type Player = 'black' | 'white'
export type Cell = Player | null
export type Board = Cell[][]

export type Move = {
  row: number
  col: number
}

export type GameStatus = 'playing' | 'finished'

const BOARD_SIZE = 8

export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black'
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => Array<Cell>(BOARD_SIZE).fill(null))

  board[3][3] = 'white'
  board[3][4] = 'black'
  board[4][3] = 'black'
  board[4][4] = 'white'

  return board
}

export function countDiscs(board: Board): { black: number; white: number } {
  let black = 0
  let white = 0

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === 'black') black++
      if (board[r][c] === 'white') white++
    }
  }

  return { black, white }
}

export function hasAnyLegalMove(board: Board, player: Player): boolean {
  return getLegalMoves(board, player).length > 0
}

export function getLegalMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) continue
      const flips = getFlipsForMove(board, player, { row: r, col: c })
      if (flips.length > 0) moves.push({ row: r, col: c })
    }
  }

  return moves
}

export function applyMove(board: Board, player: Player, move: Move): { board: Board; flipped: Move[] } {
  assertInBounds(move)
  if (board[move.row][move.col] !== null) {
    throw new Error('Illegal move: cell not empty')
  }

  const flipped = getFlipsForMove(board, player, move)
  if (flipped.length === 0) {
    throw new Error('Illegal move: must flip at least one disc')
  }

  const next = cloneBoard(board)
  next[move.row][move.col] = player
  for (const f of flipped) next[f.row][f.col] = player

  return { board: next, flipped }
}

export function computeGameResult(board: Board): {
  status: 'finished'
  winner: Player | 'draw'
  black: number
  white: number
} {
  const { black, white } = countDiscs(board)

  if (black > white) return { status: 'finished', winner: 'black', black, white }
  if (white > black) return { status: 'finished', winner: 'white', black, white }
  return { status: 'finished', winner: 'draw', black, white }
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice())
}

function assertInBounds(move: Move): void {
  if (move.row < 0 || move.row >= BOARD_SIZE || move.col < 0 || move.col >= BOARD_SIZE) {
    throw new Error('Move out of bounds')
  }
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function getFlipsForMove(board: Board, player: Player, move: Move): Move[] {
  if (!inBounds(move.row, move.col)) return []
  if (board[move.row][move.col] !== null) return []

  const opponent = getOpponent(player)
  const directions: Array<[number, number]> = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ]

  const flips: Move[] = []

  for (const [dr, dc] of directions) {
    const line: Move[] = []
    let r = move.row + dr
    let c = move.col + dc

    while (inBounds(r, c) && board[r][c] === opponent) {
      line.push({ row: r, col: c })
      r += dr
      c += dc
    }

    if (line.length === 0) continue
    if (!inBounds(r, c)) continue
    if (board[r][c] !== player) continue

    flips.push(...line)
  }

  return flips
}
