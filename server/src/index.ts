import { WebSocketServer, WebSocket } from 'ws';
import { Game, User, WSMessage } from './types';
import { handleAuth } from './handlers/auth';
import { handleCreateGame } from './handlers/createGame';
import { handleJoinGame } from './handlers/joinGame';

export const users = new Map<string, User>();
export const games = new Map<string, Game>();
export const connections = new Map<WebSocket, User>();

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
});