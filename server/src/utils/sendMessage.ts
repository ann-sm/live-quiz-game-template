import { WebSocket } from 'ws';
import { Game, WSMessage } from '../types';
import { users } from '../index';

export const sendMessage = (game: Game, message: WSMessage) => {
  const messageString = JSON.stringify({ ...message, id: 0 });
  const host = Array.from(users.values()).find((user) => user.index === game.hostId);

  game.players.forEach(player => {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(messageString);
    }
  });

  if (host && host.ws) {
    host.ws?.send(messageString);
  }
}