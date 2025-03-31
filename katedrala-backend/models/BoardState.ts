import { getRandomArbitrary, rotateMatrix90C } from "../utils/matrixUtils";
import BoardField from "./BoardField";
import { pieces } from "./Piece";

export default class BoardState {
	fields: BoardField[][] = new Array(10)
		.fill(null)
		.map((u) => new Array(10).fill(null).map((o) => Object.create({ pieceId: null, playerId: null })));

	constructor() {
		const randomX = getRandomArbitrary(2, 4);
		const randomY = getRandomArbitrary(2, 4);
		const rotation = getRandomArbitrary(0, 3);
		let piece = pieces[0];
		for (let i = 0; i < rotation; i++) piece = rotateMatrix90C(piece);
		for (let i = 0; i < piece.length; i++) {
			for (let j = 0; j < piece[0].length; j++) {
				if (piece[i][j] === true) {
					this.fields[i + randomY][j + randomX].pieceId = 0;
				}
			}
		}
	}
}

