import { WebSocket } from 'ws';
import { randomUUID } from "node:crypto";
import { CreateGameData, Game, User } from "../types.js";
import { games } from '../store.js';

// validates questions, generates 6-character code, stores game
export const handleCreateGame = (ws: WebSocket, { questions }: CreateGameData, user: User) => {
  if (!questions || questions.length === 0) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'No questions added' },
      id: 0
    }));
    return;
  }

  questions.forEach((question) => {
    if (question.options.length !== 4 || question.correctIndex < 0 || question.correctIndex > 3) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid question data' },
        id: 0
      }));
      return;
    }
  })
    
  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
  const game: Game = {
    id: randomUUID(),
    code: roomCode,
    hostId: user.index,
    questions,
    players: [],
    currentQuestion: -1,
    status: 'waiting',
    playerAnswers: new Map()
  }

  games.set(game.id, game);
  
  ws.send(JSON.stringify({
    type: 'game_created',
    data: {
      gameId: game.id,
      code: game.code
    },
    id: 0
  }));
}