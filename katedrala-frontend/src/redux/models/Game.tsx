import BoardState from "./BoardState";
import Player from "./Player";

export default interface Game {
	id: string;
	boardState: BoardState;
	players: { [key: string]: Player };
	lastMoveTime: number;
	numPlayers: number;
	started: boolean;
	finished: boolean;
	winner?: string;
	creator: string;
}

