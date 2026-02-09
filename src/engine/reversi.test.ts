import { describe, expect, it } from 'vitest'

import { chooseBotMove } from './bot'
import {
  applyMove,
  computeGameResult,
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  hasAnyLegalMove,
} from './reversi'

describe('reversi engine', () => {
  it('initial board has 4 legal moves for black', () => {
    const board = createInitialBoard()
    const moves = getLegalMoves(board, 'black')
    expect(moves).toHaveLength(4)

    const key = new Set(moves.map((m) => `${m.row},${m.col}`))
    expect(key.has('2,3')).toBe(true)
    expect(key.has('3,2')).toBe(true)
    expect(key.has('4,5')).toBe(true)
    expect(key.has('5,4')).toBe(true)
  })

  it('applyMove flips at least one disc on a known opening move', () => {
    const board = createInitialBoard()
    const { board: next, flipped } = applyMove(board, 'black', { row: 2, col: 3 })

    expect(flipped.length).toBeGreaterThan(0)
    expect(next[2][3]).toBe('black')
    expect(next[3][3]).toBe('black')
  })

  it('applyMove does not mutate the input board', () => {
    const board = createInitialBoard()
    const before = JSON.stringify(board)

    applyMove(board, 'black', { row: 2, col: 3 })

    expect(JSON.stringify(board)).toBe(before)
  })

  it('rejects out-of-bounds moves', () => {
    const board = createInitialBoard()
    expect(() => applyMove(board, 'black', { row: -1, col: 0 })).toThrow(/out of bounds/i)
  })

  it('rejects moves on non-empty cells', () => {
    const board = createInitialBoard()
    expect(() => applyMove(board, 'black', { row: 3, col: 3 })).toThrow(/not empty/i)
  })

  it('rejects moves that flip no discs', () => {
    const board = createInitialBoard()
    expect(() => applyMove(board, 'black', { row: 0, col: 0 })).toThrow(/flip/i)
  })

  it('computeGameResult returns winner counts', () => {
    const board = createInitialBoard()
    const result = computeGameResult(board)
    expect(result.status).toBe('finished')
    expect(['black', 'white', 'draw']).toContain(result.winner)
    expect(result.black + result.white).toBe(4)
  })

  it('hasAnyLegalMove returns false on a full board', () => {
    const fullBlack = Array.from({ length: 8 }, () => Array(8).fill('black' as const))
    expect(hasAnyLegalMove(fullBlack, 'black')).toBe(false)
    expect(hasAnyLegalMove(fullBlack, 'white')).toBe(false)
    expect(countDiscs(fullBlack)).toEqual({ black: 64, white: 0 })
  })
})

describe('bot', () => {
  it('chooses a legal move when one exists', () => {
    const board = createInitialBoard()
    const legal = getLegalMoves(board, 'black')
    const move = chooseBotMove(board, 'black', 'greedy')
    expect(move).not.toBeNull()

    const key = new Set(legal.map((m) => `${m.row},${m.col}`))
    expect(key.has(`${move!.row},${move!.col}`)).toBe(true)
  })

  it('returns null when no legal moves exist', () => {
    const fullBlack = Array.from({ length: 8 }, () => Array(8).fill('black' as const))
    expect(chooseBotMove(fullBlack, 'white', 'greedy')).toBeNull()
  })
})
