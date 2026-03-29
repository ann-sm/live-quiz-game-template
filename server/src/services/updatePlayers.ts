import { Game } from "../types.js";
import { sendMessage } from "../utils/sendMessage.js";

export const updatePlayers = (game: Game) => {
  const playersList = game.players.map(p => ({
    name: p.name,
    index: p.index,
    score: p.score
  }));
  
  sendMessage(game, {
    type: 'update_players',
    data: playersList,
    id: 0
  });
}