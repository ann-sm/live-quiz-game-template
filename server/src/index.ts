import { WebSocketServer, WebSocket } from 'ws';
import { Game, RegData, User, WSMessage } from './types';
import { randomUUID } from "crypto";

const users = new Map<string, User>();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });


// Register / Login
const handleAuth = (ws: WebSocket, { name, password }: RegData) => {
  let user = Array.from(users.values()).find((user) => user.name === name);
  
  if (user) {
    if (user.password !== password) {
      ws.send(JSON.stringify({
        type: 'reg',
        data: {
          name: '',
          index: '',
          error: true,
          errorText: 'Invalid password'
        },
        id: 0
      }));
      return;
    }
  }

  user = {
    name,
    password,
    index: randomUUID(),
  };
  
  users.set(user.index, user);
  console.log(users);

  ws.send(JSON.stringify({
    type: 'reg',
    data: {
      name: user.name,
      index: user.index,
      error: false,
      errorText: ''
    },
    id: 0
  }));
}


wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    try {
      const parsedMessage: WSMessage = JSON.parse(message.toString());
      const { type, data } = parsedMessage;
            
      switch (type) {
        case 'reg':
          handleAuth(ws, data);
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