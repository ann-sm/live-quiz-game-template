import { WebSocketServer, WebSocket } from 'ws';
import { WSMessage } from './types.js';
import { handleAuth } from './handlers/handleAuth.js';
import { handleCreateGame } from './handlers/handleCreate.js';
import { handleJoinGame } from './handlers/handleJoin.js';
import { connections, games } from './store.js';
import { handleAnswer } from './handlers/handleAnswer.js';
import { handleStartGame } from './services/gameService.js';
import { sendMessage } from './utils/sendMessage.js';
import { updatePlayers } from './services/updatePlayers.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    try {
      const parsedMessage: WSMessage = JSON.parse(message.toString());
      const { type, data } = parsedMessage;
      
      const currentUser = connections.get(ws);
      
      switch (type) {
        case 'reg':
          handleAuth(ws, data);
          break;
          
        case 'create_game':
          if (currentUser) {
            handleCreateGame(ws, data, currentUser);
          }
          break;
        case 'join_game':
          if (currentUser) {
            handleJoinGame(ws, data, currentUser);
          }
          break;
        case 'start_game':
          if (currentUser) {
            handleStartGame(ws, data, currentUser);
          }
          break;
        case 'answer':
          if (currentUser) {
            handleAnswer(ws, data, currentUser);
          }
          break;
        default:
          ws.send(JSON.stringify({
            type: 'error',
            data: { errorText: 'Unknown command' },
            id: 0
          }));
      }
    } catch {
      console.error('Something went wrong');
      ws.send(JSON.stringify({
        type: 'error',
        data: { errorText: 'Invalid message format' },
        id: 0
      }));
    }
  });

  ws.on('close', () => {
    const user = connections.get(ws);
    if (!user) return;

    connections.delete(ws);

    user.ws = undefined;
  
    for (const game of games.values()) {
      const playerIndex = game.players.findIndex(player => player.index === user.index);
      if (playerIndex !== -1) {
        const removedPlayer = game.players[playerIndex];
        game.players.splice(playerIndex, 1);

        if (game.status === 'waiting' || game.status === 'in_progress') {
          const nonHostPlayers = game.players.filter(player => player.index !== game.hostId);

          sendMessage(game, {
            type: 'player_joined',
            data: {
              playerName: removedPlayer.name,
              playerCount: nonHostPlayers.length
            },
            id: 0
          });

          updatePlayers(game);
        }
      }
    }
  });
});