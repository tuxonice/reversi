import { useEffect, useRef, useState } from 'react'
import './App.css'

import type { Move, Player } from './engine/reversi'
import {
  applyMove,
  computeGameResult,
  countDiscs,
  createInitialBoard,
  getLegalMoves,
  getOpponent,
  hasAnyLegalMove,
} from './engine/reversi'
import { chooseBotMove } from './engine/bot'

function App() {
  const [board, setBoard] = useState(createInitialBoard)
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black')
  const [status, setStatus] = useState<'playing' | 'finished'>('playing')
  const [message, setMessage] = useState<string>('')
  const [botThinking, setBotThinking] = useState(false)

  const botTimeoutRef = useRef<number | null>(null)

  const botPlayer: Player = 'white'
  const botThinkMs = 900

  const legalMoves = status === 'playing' ? getLegalMoves(board, currentPlayer) : []
  const legalKey = new Set(legalMoves.map((m) => `${m.row},${m.col}`))
  const score = countDiscs(board)

  useEffect(() => {
    return () => {
      if (botTimeoutRef.current !== null) {
        window.clearTimeout(botTimeoutRef.current)
        botTimeoutRef.current = null
      }
    }
  }, [])

  function resetGame() {
    if (botTimeoutRef.current !== null) {
      window.clearTimeout(botTimeoutRef.current)
      botTimeoutRef.current = null
    }
    setBoard(createInitialBoard())
    setCurrentPlayer('black')
    setStatus('playing')
    setMessage('')
    setBotThinking(false)
  }

  function advanceTurn(nextBoard: typeof board, nextPlayer: Player) {
    if (!hasAnyLegalMove(nextBoard, nextPlayer)) {
      const other = getOpponent(nextPlayer)
      if (!hasAnyLegalMove(nextBoard, other)) {
        const result = computeGameResult(nextBoard)
        setStatus('finished')
        setMessage(`Game over. Winner: ${result.winner}. (Black ${result.black} - White ${result.white})`)
        return
      }

      setCurrentPlayer(other)
      setMessage(`${nextPlayer} has no legal moves. Turn passes to ${other}.`)
      maybeBotMove(nextBoard, other)
      return
    }

    setCurrentPlayer(nextPlayer)
    setMessage('')
    maybeBotMove(nextBoard, nextPlayer)
  }

  function maybeBotMove(currentBoard: typeof board, playerToAct: Player) {
    if (status !== 'playing') return
    if (playerToAct !== botPlayer) return

    if (botTimeoutRef.current !== null) {
      window.clearTimeout(botTimeoutRef.current)
      botTimeoutRef.current = null
    }

    setBotThinking(true)
    setMessage('Bot is thinking...')

    const botMove = chooseBotMove(currentBoard, playerToAct, 'greedy')
    if (!botMove) {
      const other = getOpponent(playerToAct)
      setCurrentPlayer(other)
      setMessage(`${playerToAct} (bot) has no legal moves. Turn passes to ${other}.`)
      setBotThinking(false)
      return
    }

    botTimeoutRef.current = window.setTimeout(() => {
      botTimeoutRef.current = null
      setBoard((prev) => {
        const { board: next } = applyMove(prev, playerToAct, botMove)
        setBotThinking(false)
        advanceTurn(next, getOpponent(playerToAct))
        return next
      })
    }, botThinkMs)
  }

  function onCellClick(row: number, col: number) {
    if (status !== 'playing') return
    if (botThinking) return
    if (currentPlayer === botPlayer) return

    const move: Move = { row, col }
    try {
      const { board: next } = applyMove(board, currentPlayer, move)
      setBoard(next)
      advanceTurn(next, getOpponent(currentPlayer))
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Illegal move')
    }
  }

  return (
    <>
      <h1>Reversi</h1>
      <div className="card" style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>Turn: {status === 'playing' ? currentPlayer : '—'}</div>
          <div>Black: {score.black}</div>
          <div>White: {score.white}</div>
          <button onClick={resetGame}>Reset</button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 44px)',
            gridTemplateRows: 'repeat(8, 44px)',
            gap: 6,
            padding: 12,
            borderRadius: 12,
            background: '#0b5d1e',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isLegal = legalKey.has(`${r},${c}`)
              const isEmpty = cell === null
              const disabled = status !== 'playing' || botThinking || currentPlayer === botPlayer || !isLegal
              return (
                <button
                  key={`${r},${c}`}
                  onClick={() => onCellClick(r, c)}
                  disabled={disabled}
                  aria-label={`cell ${r},${c}`}
                  style={{
                    width: 44,
                    height: 44,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.4)',
                    background: 'rgba(255,255,255,0.08)',
                    position: 'relative',
                    opacity: disabled && isEmpty ? 0.55 : 1,
                    outline: isLegal ? '2px solid rgba(255, 255, 0, 0.45)' : undefined,
                  }}
                >
                  {cell && (
                    <span className={`disc ${cell}`}>
                      <span className="disc-face disc-face-black" />
                      <span className="disc-face disc-face-white" />
                    </span>
                  )}
                </button>
              )
            }),
          )}
        </div>

        <div style={{ minHeight: 24 }}>{message}</div>
      </div>
    </>
  )
}

export default App
