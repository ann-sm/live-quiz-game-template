import { WebSocket } from 'ws';
import { JoinGameData, Player, User } from "../types";
import { games } from '../index';
import { sendMessage } from '../utils/sendMessage';
import { updatePlayers } from '../services/updatePlayers';

// validates code, adds player, broadcasts player_joined and update_players
export const handleJoinGame = (ws: WebSocket, { code }: JoinGameData, user: User) => {
  const game = Array.from(games.values()).find((game) => game.code === code);

  if (!game) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { errorText: 'Game not found' },
      id: 0
    }));
    return;
  }
  console.log(game.players.map(p => p.index));
  console.log(user.index);

  if (game.players.some((player) => player.index === user.index)) {
    console.log('INGAAAAAME');
    console.log(user.index);
    ws.send(JSON.stringify({
      type: 'error',
      data: { errorText: 'Player has already joined the game' },
      id: 0
    }));
    return;
  }

  const player: Player = {
    name: user.name,
    index: user.index,
    score: 0,
    ws,
    hasAnswered: false
  };
  
  game.players.push(player);

  ws.send(JSON.stringify({
    type: 'game_joined',
    data: {
      gameId: game.id
    },
    id: 0
  }));


  sendMessage(game, {
    type: 'player_joined',
    data: {
      playerName: user.name,
      playerCount: game.players.length
    },
    id: 0
  });
  
  updatePlayers(game);
}