import { WebSocket } from 'ws';
import { randomUUID } from "node:crypto";
import { RegData } from "../types.js";
import { connections, users } from '../store.js';

// allows user to login and proceed
export const handleAuth = (ws: WebSocket, { name, password }: RegData) => {
  let user = Array.from(users.values()).find((user) => user.name === name);
  let index;
  
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
    } else {
      index = user.index;
    }
  }

  user = {
    name,
    password,
    index: index || randomUUID(),
  };
  
  users.set(user.index, user);

  user.ws = ws;
  connections.set(ws, user);

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