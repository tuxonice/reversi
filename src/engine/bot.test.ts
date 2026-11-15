import { afterEach, describe, expect, it, vi } from 'vitest'

import { chooseBotMove } from './bot'
import { applyMove, createInitialBoard, getLegalMoves } from './reversi'
import type { Board, Cell } from './reversi'

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array<Cell>(8).fill(null))
}

describe('chooseBotMove (greedy)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null when the player has no legal moves', () => {
    expect(chooseBotMove(emptyBoard(), 'white')).toBeNull()
  })

  it('picks the move that flips the most discs', () => {
    const board = emptyBoard()
    // White at (0,3) would flip 2 discs; white at (5,5) would flip only 1.
    board[0][0] = 'white'
    board[0][1] = 'black'
    board[0][2] = 'black'
    board[3][5] = 'white'
    board[4][5] = 'black'

    expect(getLegalMoves(board, 'white')).toHaveLength(2)

    for (const r of [0, 0.5, 0.99]) {
      vi.spyOn(Math, 'random').mockReturnValue(r)
      expect(chooseBotMove(board, 'white')).toEqual({ row: 0, col: 3 })
      vi.restoreAllMocks()
    }
  })

  it('chooses among tied best moves using randomness', () => {
    const board = createInitialBoard()
    const legal = getLegalMoves(board, 'black')
    expect(legal).toHaveLength(4)

    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(chooseBotMove(board, 'black')).toEqual(legal[0])

    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    expect(chooseBotMove(board, 'black')).toEqual(legal[3])
  })

  it('does not mutate the input board', () => {
    const board = createInitialBoard()
    const before = JSON.stringify(board)
    chooseBotMove(board, 'black')
    expect(JSON.stringify(board)).toBe(before)
  })

  it('always returns a legal move across a full bot-vs-bot game', () => {
    let board = createInitialBoard()
    let player: 'black' | 'white' = 'black'
    let passes = 0

    while (passes < 2) {
      const move = chooseBotMove(board, player)
      if (!move) {
        passes++
      } else {
        passes = 0
        const legal = getLegalMoves(board, player)
        expect(legal).toContainEqual(move)
        board = applyMove(board, player, move).board
      }
      player = player === 'black' ? 'white' : 'black'
    }
  })

  it('falls back to greedy for an unknown strategy', () => {
    const board = createInitialBoard()
    const move = chooseBotMove(board, 'black', 'unknown' as never)
    expect(getLegalMoves(board, 'black')).toContainEqual(move)
  })
})
