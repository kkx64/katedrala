export default class Piece {
	pieceId: number;

	constructor(id: number) {
		this.pieceId = id;
	}
}

export const pieces: Array<boolean[][]> = [
	[
		// ! Cathedral
		[false, true, false],	//	     []  
		[true, true, true],		//	  [][][]
		[false, true, false],	//     []
		[false, true, false],	//    []
	],
	[
		[false, false, false],
		[false, true, false],
		[false, false, false],
	],
	[
		[true, true, false],
		[false, true, false],
		[false, false, false],
	],
	[
		[false, true, false],
		[true, true, true],
		[false, false, false],
	],
	[
		[false, true, false],
		[false, true, false],
		[false, false, false],
	],
	[
		[true, false, false],
		[true, true, false],
		[false, true, false],
	],
	[
		[true, false, true],
		[true, true, true],
		[false, false, false],
	],
	[
		[true, true, false],
		[false, true, true],
		[false, true, false],
	],
	[
		[true, true, false],
		[true, true, false],
		[false, false, false],
	],
	[
		[false, true, false],
		[true, true, true],
		[false, true, false],
	],
	[
		[false, false, false],
		[false, true, false],
		[false, false, false],
	],
	[
		[false, true, true],
		[false, true, false],
		[true, true, false],
	],
	[
		[false, false, true],
		[false, true, true],
		[true, true, false],
	],
	[
		[false, true, true],
		[false, true, false],
		[false, false, false],
	],
];

