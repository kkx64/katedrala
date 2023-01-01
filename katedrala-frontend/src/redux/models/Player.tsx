import Piece from "./Piece";

export default interface Player {
	playerId: string;
	username: string;
	color: string;
	availablePieces: Piece[];
	isTurn: boolean;
	connected: boolean;
}

