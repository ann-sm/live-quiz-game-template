import { WebSocket } from 'ws';
import { Game, User } from './types.js';

export const users = new Map<string, User>();
export const games = new Map<string, Game>();
export const connections = new Map<WebSocket, User>();