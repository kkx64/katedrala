import express from "express";

import { v4 } from "uuid";
import Cron from "node-cron";
import clc from "cli-color";
import os from "os";

import _ from "lodash";

import Game from "./models/Game";
import { pieces } from "./models/Piece";
import Player from "./models/Player";

import { getShortUUID } from "./utils/uuidUtils";

const router = express.Router();

export let games = {} as { [key: string]: Game };

const playerColors = ["#ffa502", "#3742fa", "#ff4757", "#2ed573"];

const getFilteredGame = (id: string) => {
	const game = _.cloneDeep(games[id]);
	delete game.listeners;
	return `data: ${JSON.stringify(game)}\n\n`;
};

const transmitGameState = (id: string) => {
	if (games[id]) {
		for (const listener in games[id].listeners) {
			games[id].listeners[listener].cork();
			games[id].listeners[listener].write(getFilteredGame(id));
			process.nextTick(() => {
				if (games[id]) games[id].listeners[listener].uncork();
			});
		}
	}
};

router.get("/status", (req, res) => {
	res.status(200).send({
		avgLoad: os.loadavg(),
		totalMemory: os.totalmem(),
		freeMemory: os.freemem(),
		uptime: os.uptime(),
		activeGames: Object.keys(games).length,
	});
});

router.get("/getId", (req, res) => {
	res.send(v4());
});

router.get("/getPieces", (req, res) => {
	res.send(pieces);
});

router.get("/currentGames", (req, res) => {
	const currentGames = Object.keys(games).map((gameId) => {
		const game = games[gameId];
		return {
			id: game.id,
			creator: game.creator,
			numPlayers: game.numPlayers,
			createdAt: game.createdAt,
			lastMoveTime: game.lastMoveTime,
			lastPlayerTime: game.lastPlayerTime,
			finished: game.finished,
		};
	});
	res.status(200).send(currentGames);
});

router.post("/startGame/:id", (req, res) => {
	const gameId = req.params.id;
	games[gameId].started = true;
	games[gameId].lastMoveTime = new Date().getTime() / 1000;
	games[gameId].players[Object.keys(games[gameId].players)[0]].isTurn = true;
	transmitGameState(gameId);
	res.status(200).send();
});

router.post("/createGame", (req, res) => {
	const newGame = new Game(getShortUUID());
	newGame.creator = req.query.uid as string;
	while (games[newGame.id]) newGame.id = getShortUUID(); // prevent duplicates
	games[newGame.id] = newGame;
	games[newGame.id].lastMoveTime = new Date().getTime() / 1000;
	games[newGame.id].createdAt = new Date().getTime() / 1000;
	games[newGame.id].lastPlayerTime = new Date().getTime() / 1000; // Track when last player was active
	console.log(`${clc.yellow(`[${newGame.id}]`)}${clc.bgGreen("[Game Created]")}`);
	res.status(200).send(newGame.id);
});

router.post("/placePiece/:id", (req, res) => {
	const gameId = req.params.id;
	const userId = req.query.uid as string;
	if (games[gameId]) {
		const result = games[gameId].placePiece(req.body.pieceId, req.body.position, userId, req.body.orientation);
		if (result) {
			transmitGameState(gameId);
			res.status(200).send();
		} else {
			res.status(400).send("Invalid Move");
		}
	} else {
		res.status(404).send("Game Doesn't Exist");
	}
});

// ! Realtime Stream
router.get("/gameStream/:id", (req, res) => {
	const gameId = req.params.id;
	const userId = req.query.uid as string;
	const username = req.query.usr as string;

	if (!games[gameId]) {
		res.writeHead(404, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		});
		res.end();
		return;
	}

	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive",
	});

	// Update last player time whenever someone connects
	games[gameId].lastPlayerTime = new Date().getTime() / 1000;
	games[gameId].listeners[userId] = res;

	// ! Reconnected
	if (games[gameId].players[userId]) {
		games[gameId].players[userId].connected = true;
		console.log(
			`${clc.yellow(`[${gameId}]`)}${clc.green("[Reconnected]")} Player ${games[gameId].players[userId].username}`
		);
	}

	// ! Player connected to game
	else if (games[gameId].numPlayers < 2) {
		games[gameId].players[userId] = new Player(userId, username, playerColors[games[gameId].numPlayers]);
		console.log(
			`${clc.yellow(`[${gameId}]`)}${clc.greenBright("[Connected]")} Player ${games[gameId].players[userId].username}`
		);
		games[gameId].numPlayers++;
		req.on("close", () => {
			if (games[gameId]) {
				console.log(
					`${clc.yellow(`[${gameId}]`)}${clc.red("[Disconnected]")} Player ${games[gameId].players[userId].username}`
				);
				delete games[gameId].listeners[userId];
				games[gameId].players[userId].connected = false;
				// Don't delete the player data, just mark them as disconnected
				transmitGameState(gameId);
			}
		});
	} else {
		console.log(`${clc.yellow(`[${gameId}]`)}${clc.blue("[Spectator Connected]")} ${userId}`);
		// ! Just a spectator
		req.on("close", () => {
			if (games[gameId]) {
				delete games[gameId].listeners[userId];
			}
		});
	}
	transmitGameState(gameId);
});

Cron.schedule("* * * * *", () => {
	const currentTime = new Date().getTime() / 1000;
	for (const gId in games) {
		const gameAge = currentTime - (games[gId].createdAt || 0);
		const hasConnectedPlayers = Object.values(games[gId].players).some((player) => player.connected);
		const isIdle = currentTime - games[gId].lastMoveTime >= 300;
		const playersDisconnectedTime = currentTime - (games[gId].lastPlayerTime || 0);

		// Only delete if:
		// 1. Game is idle for 5 minutes, OR
		// 2. No connected players for at least 10 minutes (increased from 5), OR
		// 3. Game is marked as finished
		if (isIdle || (!hasConnectedPlayers && playersDisconnectedTime >= 600) || games[gId].finished) {
			games[gId].finished = true;
			console.log(`${clc.yellow(`[${gId}]`)}${clc.bgRedBright("[Game Terminated]")}`);
			transmitGameState(gId);
			delete games[gId]; // delete finished games and games idle for too long
		}
	}
});

module.exports = router;

