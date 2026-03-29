import { WebSocket } from 'ws';
import { AnswerData, User } from "../types.js";
import { games } from '../store.js';
import { validateResults } from '../services/gameService.js';

// validates answer, stores it, sends answer_accepted
export const handleAnswer = (ws: WebSocket, { gameId, questionIndex, answerIndex }: AnswerData, user: User) => {
  const game = Array.from(games.values()).find((game) => game.id === gameId);
  
  if (!game) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Game not found' },
      id: 0
    }));
    return;
  }
  
  if (game.status !== 'in_progress') {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Game is not in progress' },
      id: 0
    }));
    return;
  }
  
  if (questionIndex !== game.currentQuestion) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Invalid question index' },
      id: 0
    }));
    return;
  }
  
  const player = game.players.find(p => p.index === user.index);

  if (!player) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Player is not in the game' },
      id: 0
    }));
    return;
  }
  
  if (player.hasAnswered) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Already answered this question' },
      id: 0
    }));
    return;
  }
  
  const timestamp = Date.now();
  game.playerAnswers.set(player.index, {
    answerIndex,
    timestamp
  });

  player.hasAnswered = true;
  player.answerTime = timestamp;
  

  ws.send(JSON.stringify({
    type: 'answer_accepted',
    data: {
      questionIndex: game.currentQuestion
    },
    id: 0
  }));
  

  const allHaveAnswered = game.players.every((player) => player.hasAnswered);
  if (allHaveAnswered && game.questionTimer) {
    clearTimeout(game.questionTimer);
    validateResults(game);
  }
}