import express from "express";

import floodFill from "n-dimensional-flood-fill";

import BoardState from "./BoardState";
import Player from "./Player";

import Piece, { pieces } from "./Piece";
import { rotateMatrix90C } from "../utils/matrixUtils";

const getIndexOfK = (arr: any[][], k: any): [number, number] | null => {
	for (var i = 0; i < arr.length; i++) {
		var index = arr[i].indexOf(k);
		if (index > -1) {
			return [index, i];
		}
	}
	return null;
};

const touchesThreeBorders = (indices: Array<[number, number]>, maxX: number, maxY: number) => {
	const touchesMinX = indices.some((row) => row[1] === 0);
	const touchesMinY = indices.some((row) => row[0] === 0);
	const touchesMaxX = indices.some((row) => row[1] === maxX);
	const touchesMaxY = indices.some((row) => row[0] === maxY);

	return (
		(touchesMinX && touchesMaxX && touchesMinY) ||
		(touchesMinX && touchesMaxX && touchesMaxY) ||
		(touchesMinY && touchesMaxY && touchesMinX) ||
		(touchesMinY && touchesMaxY && touchesMaxX)
	);
};

export default class Game {
	id: string;
	boardState: BoardState = new BoardState();
	players: { [key: string]: Player } = {};
	lastMoveTime: number = 0;
	numPlayers: number = 0;
	started: boolean = false;
	finished: boolean = false;
	winner?: string;
	creator: string;
	moveId: number = 0;
	listeners: { [key: string]: express.Response } = {};

	constructor(gameId: string) {
		this.id = gameId;
	}

	nextPlayer = () => {
		const allPlayers = Object.keys(this.players).map((pid) => this.players[pid]);
		const currentTurn = allPlayers.findIndex((p) => p.isTurn);
		if (currentTurn >= 0) {
			this.players[allPlayers[currentTurn].playerId].isTurn = false;
			this.players[allPlayers[(currentTurn + 1) % allPlayers.length].playerId].isTurn = true;
			this.moveId += 1;
		}
	};

	checkWinCondition = () => {
		const allPlayers = Object.keys(this.players).map((pid) => this.players[pid]);
		const currentTurn = allPlayers.find((p) => p.isTurn);

		if (currentTurn) {
			for (let pIndex = 0; pIndex < currentTurn.availablePieces.length; pIndex++) {
				for (let i = 0; i < 10; i++) {
					// all current possible moves, there's probably a better way for this
					for (let j = 0; j < 10; j++) {
						if (this.validPlacement(currentTurn.availablePieces[pIndex].pieceId, [i, j], 0, currentTurn.playerId))
							return;
						if (this.validPlacement(currentTurn.availablePieces[pIndex].pieceId, [i, j], 1, currentTurn.playerId))
							return;
						if (this.validPlacement(currentTurn.availablePieces[pIndex].pieceId, [i, j], 2, currentTurn.playerId))
							return;
						if (this.validPlacement(currentTurn.availablePieces[pIndex].pieceId, [i, j], 3, currentTurn.playerId))
							return;
					}
				}
			}
			let winner = allPlayers.reduce((prev, curr) =>
				prev.numberOfRemainingBlocks() < curr.numberOfRemainingBlocks() ? prev : curr
			);
			this.winner = winner.playerId;
			this.finished = true;
		}
	};

	validPlacement = (pieceId: number, position: [number, number], orientation: number = 0, playerId) => {
		let piece = pieces[pieceId];
		for (let i = 0; i < orientation; i++) {
			piece = rotateMatrix90C(piece);
		}
		for (let y = 0; y < piece.length; y++) {
			for (let x = 0; x < piece[0].length; x++) {
				if (piece[y][x]) {
					let yIndex = y - 1 + position[1];
					let xIndex = x - 1 + position[0];
					if (yIndex < 0 || xIndex < 0 || yIndex > 9 || xIndex > 9) return false;
					if (
						this.boardState.fields[yIndex][xIndex].pieceId !== null ||
						(this.boardState.fields[yIndex][xIndex].playerId &&
							this.boardState.fields[yIndex][xIndex].playerId !== playerId)
					)
						return false;
				}
			}
		}
		return true;
	};

	placePiece = (pieceId: number, position: [number, number], playerId: string, orientation: number = 0) => {
		if (!this.players[playerId].isTurn) return false;
		let fnd = this.players[playerId].availablePieces.find((pc: Piece) => pc.pieceId === pieceId);
		if (fnd) {
			if (this.validPlacement(pieceId, position, orientation, playerId)) {
				let piece = pieces[pieceId];
				for (let i = 0; i < orientation; i++) {
					piece = rotateMatrix90C(piece);
				}
				for (let y = 0; y < piece.length; y++) {
					for (let x = 0; x < piece[0].length; x++) {
						if (piece[y][x]) {
							// y - 1 so the piece is centered
							this.boardState.fields[y - 1 + position[1]][x - 1 + position[0]].pieceId = pieceId;
							this.boardState.fields[y - 1 + position[1]][x - 1 + position[0]].playerId = playerId;
						}
					}
				}
				this.players[playerId].availablePieces.splice(this.players[playerId].availablePieces.indexOf(fnd), 1);
				if (this.moveId >= 2) {
					// can't capture territories on the first move
					this.recalculateTerritories();
					this.checkWinCondition();
				}
				this.nextPlayer();
				this.lastMoveTime = new Date().getTime() / 1000;
				return true;
			} else return false;
		} else {
			return false;
		}
	};

	recalculateTerritories = () => {
		const allPlayers = Object.keys(this.players);
		allPlayers.forEach((player) => {
			let tempState = JSON.parse(JSON.stringify(this.boardState.fields)) as any[][];
			for (let i = 0; i < tempState.length; i++) {
				for (let j = 0; j < tempState[0].length; j++) {
					if (tempState[i][j].playerId === player) tempState[i][j] = 1;
					else tempState[i][j] = 0;
				}
			}
			let emptySpaceIndex = getIndexOfK(tempState, 0); // find the first remaining empty spot
			while (emptySpaceIndex) {
				let filledResult = floodFill({
					// flood fill the empty areas
					getter: (x, y) => tempState[y][x],
					seed: emptySpaceIndex,
					diagonals: true,
				});
				if (!touchesThreeBorders(filledResult.flooded, tempState[0].length - 1, tempState.length - 1)) {
					filledResult.flooded.forEach((item: [number, number]) => {
						// if the filled area doesn't touch three borders,
						tempState[item[1]][item[0]] = 2; // it's a territory (given that it isn't larger than 1/4th the board)
					});
				} else {
					filledResult.flooded.forEach((item: [number, number]) => {
						tempState[item[1]][item[0]] = 3;
					});
				}
				emptySpaceIndex = getIndexOfK(tempState, 0);
			}
			let piecesToReturn = new Set<number>(); // pieces to return to the opposing player

			for (let i = 0; i < tempState.length; i++) {
				for (let j = 0; j < tempState[0].length; j++) {
					if (tempState[i][j] == 2) {
						if (this.boardState.fields[i][j].playerId !== player) {
							if (this.boardState.fields[i][j].pieceId !== undefined && this.boardState.fields[i][j].pieceId !== null)
								piecesToReturn.add(this.boardState.fields[i][j].pieceId);
						}
					}
				}
			}
			// not a territory if there are more than 2 pieces inside
			if (piecesToReturn.size < 2) {
				for (let i = 0; i < tempState.length; i++) {
					for (let j = 0; j < tempState[0].length; j++) {
						if (tempState[i][j] == 2) {
							if (this.boardState.fields[i][j].playerId !== player) {
								this.boardState.fields[i][j].pieceId = null;
								this.boardState.fields[i][j].playerId = player;
							}
						}
					}
				}
				const otherPlayer = allPlayers.find((pl) => pl !== player);
				if (otherPlayer) {
					piecesToReturn.forEach((pi) => {
						this.players[otherPlayer].availablePieces.push(new Piece(pi));
					});
				}
			}
		});
	};
}

