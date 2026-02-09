import type { Board, Move, Player } from './reversi'
import { applyMove, getLegalMoves } from './reversi'

export type BotStrategy = 'greedy'

export function chooseBotMove(board: Board, player: Player, strategy: BotStrategy = 'greedy'): Move | null {
  const legal = getLegalMoves(board, player)
  if (legal.length === 0) return null

  switch (strategy) {
    case 'greedy':
    default:
      return chooseGreedy(board, player, legal)
  }
}

function chooseGreedy(board: Board, player: Player, legal: Move[]): Move {
  let bestMoves: Move[] = []
  let bestScore = -1

  for (const m of legal) {
    const result = applyMove(board, player, m)
    const score = result.flipped.length

    if (score > bestScore) {
      bestScore = score
      bestMoves = [m]
    } else if (score === bestScore) {
      bestMoves.push(m)
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}
