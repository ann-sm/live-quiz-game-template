import { WebSocket } from 'ws';
import { games } from "../store.js";
import { Game, StartGameData, User } from "../types.js";
import { sendMessage } from "../utils/sendMessage.js";
import { calculateScore } from '../utils/calculateScore.js';
import { updatePlayers } from './updatePlayers.js';


export const handleStartGame = (ws: WebSocket, { gameId }: StartGameData, user: User) => {
  const game = Array.from(games.values()).find((game) => game.id === gameId);

  if (!game) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Game not found' },
      id: 0
    }));
    return;
  }

  if (game.hostId !== user.index) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Only host can start the game' },
      id: 0
    }));
    return;
  }

  if (game.players.length < 1) {
   ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'No players in the game' },
      id: 0
    }));
    return;
  }

  game.status = 'in_progress';
  game.currentQuestion = 0;
  showQuestion(game);
}


export const showQuestion = (game: Game) => {
  const question = game.questions[game.currentQuestion];

  game.questionStartTime = Date.now();

  game.players.forEach(player => {
    player.hasAnswered = false;
    player.answerTime = undefined;
    player.answeredCorrectly = undefined;
  });

  game.playerAnswers.clear();
  
  const questionData = {
    questionNumber: game.currentQuestion + 1,
    totalQuestions: game.questions.length,
    text: question.text,
    options: question.options,
    timeLimitSec: question.timeLimitSec
  }

  sendMessage(game, {
    type: 'question',
    data: questionData,
    id: 0
  });
  
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
  }
  
  game.questionTimer = setTimeout(() => {
    validateResults(game);
  }, question.timeLimitSec * 1000);
}


export const validateResults = (game: Game) => {
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
    game.questionTimer = undefined;
  }

  const question = game.questions[game.currentQuestion];
  const timeLimit = question.timeLimitSec * 1000;

  if (!game.questionStartTime) {
    return;
  }
  const timeLimitEnd = game.questionStartTime + timeLimit;
  
  const playerResults: any[] = [];
  
  game.players.forEach(player => {
    const answer = game.playerAnswers.get(player.index);
    let pointsEarned = 0;
    let answered = false;
    let correct = false;

    if (answer && answer.timestamp <= timeLimitEnd) {
      answered = true;
      correct = answer.answerIndex === question.correctIndex;
      
      if (correct) {
        const timeRemaining = Math.max(0, timeLimitEnd - answer.timestamp);
        const timeRemainingSec = timeRemaining / 1000;
        pointsEarned = calculateScore(timeRemainingSec, question.timeLimitSec);
        player.score += pointsEarned;
      }
    }
    
    playerResults.push({
      name: player.name,
      answered: answered,
      correct: correct,
      pointsEarned: pointsEarned,
      totalScore: player.score
    });
  });
  
  
  sendMessage(game, {
    type: 'question_result',
    data: {
      questionIndex: game.currentQuestion,
      correctIndex: question.correctIndex,
      playerResults: playerResults
    },
    id: 0
  });
  
  updatePlayers(game);
  
  game.currentQuestion++;
  
  if (game.currentQuestion < game.questions.length) {
    setTimeout(() => {
      showQuestion(game);
    }, 3000);
  } else {
    if (game.questionTimer) {
      clearTimeout(game.questionTimer);
    }

    game.status = 'finished';

    const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
    const scoreboard = sortedPlayers.map((player, index) => ({
      name: player.name,
      score: player.score,
      rank: index + 1
    }));

    setTimeout(() => {
      sendMessage(game, {
        type: 'game_finished',
        data: {
          scoreboard: scoreboard
        },
        id: 0
      });
    }, 3000);
  }
} 