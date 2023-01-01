import Piece, { pieces } from "./Piece";

export default class Player {
	playerId: string;
	username: string;
	color: string;
	availablePieces: Piece[] = new Array<Piece>(...pieces.slice(1, pieces.length).map((p, i) => new Piece(i + 1)));
	isTurn: boolean = false;
	connected: boolean = true;

	constructor(id: string, username: string, color: string) {
		this.playerId = id;
		this.username = username;
		this.color = color;
	}
}

