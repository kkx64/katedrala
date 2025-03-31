import express from "express";
import { v4 } from "uuid";
import Cron from "node-cron";
import clc from "cli-color";
import os from "os";
import _ from "lodash";
import Redis from "ioredis";

import Game from "./models/Game";
import { pieces } from "./models/Piece";
import Player from "./models/Player";

import { getShortUUID } from "./utils/uuidUtils";

const router = express.Router();

// Create a Redis client using standard Redis URL
const redis = new Redis(process.env.REDIS_URL);

// Connection tracking for SSE
const activeConnections = new Map();

// Helper functions for persistence
async function getGame(id: string): Promise<Game | null> {
	try {
		const gameData = await redis.get(`game:${id}`);
		if (!gameData) return null;

		// Recreate the Game object from stored data
		const game = new Game(id);
		Object.assign(game, JSON.parse(gameData));
		game.listeners = {}; // Reset listeners as they cannot be serialized
		return game;
	} catch (error) {
		console.error(`Error fetching game ${id}:`, error);
		return null;
	}
}

async function saveGame(game: Game): Promise<void> {
	const gameCopy = _.cloneDeep(game);
	delete gameCopy.listeners; // Remove listeners before saving

	try {
		// Set expiration to 24 hours (86400 seconds)
		await redis.set(`game:${game.id}`, JSON.stringify(gameCopy), "EX", 86400);
	} catch (error) {
		console.error(`Error saving game ${game.id}:`, error);
	}
}

async function deleteGame(id: string): Promise<void> {
	try {
		await redis.del(`game:${id}`);
	} catch (error) {
		console.error(`Error deleting game ${id}:`, error);
	}
}

const playerColors = ["#ffa502", "#3742fa", "#ff4757", "#2ed573"];

const getFilteredGame = (game: Game) => {
	const gameCopy = _.cloneDeep(game);
	delete gameCopy.listeners;
	return `data: ${JSON.stringify(gameCopy)}\n\n`;
};

const transmitGameState = async (id: string) => {
	const game = await getGame(id);
	if (!game) return;

	const connections = activeConnections.get(id) || [];
	const gameData = getFilteredGame(game);

	for (const res of connections) {
		res.cork();
		res.write(gameData);
		process.nextTick(() => {
			res.uncork();
		});
	}
};

router.get("/status", (req, res) => {
	res.status(200).send({
		avgLoad: os.loadavg(),
		totalMemory: os.totalmem(),
		freeMemory: os.freemem(),
		uptime: os.uptime(),
		activeGames: activeConnections.size,
	});
});

router.get("/getId", (req, res) => {
	res.send(v4());
});

router.get("/getPieces", (req, res) => {
	res.send(pieces);
});

router.post("/startGame/:id", async (req, res) => {
	const gameId = req.params.id;
	const game = await getGame(gameId);
	if (game) {
		game.started = true;
		game.lastMoveTime = new Date().getTime() / 1000;
		game.players[Object.keys(game.players)[0]].isTurn = true;
		await saveGame(game);
		await transmitGameState(gameId);
		res.status(200).send();
	} else {
		res.status(404).send("Game Doesn't Exist");
	}
});

router.post("/createGame", async (req, res) => {
	const newGame = new Game(getShortUUID());
	newGame.creator = req.query.uid as string;

	// Check for ID collision
	let gameExists = true;
	while (gameExists) {
		const existingGame = await getGame(newGame.id);
		if (!existingGame) {
			gameExists = false;
		} else {
			newGame.id = getShortUUID();
		}
	}

	newGame.lastMoveTime = new Date().getTime() / 1000;
	newGame.createdAt = new Date().getTime() / 1000;
	newGame.lastPlayerTime = new Date().getTime() / 1000;
	newGame.listeners = {};

	await saveGame(newGame);
	console.log(`${clc.yellow(`[${newGame.id}]`)}${clc.bgGreen("[Game Created]")}`);
	res.status(200).send(newGame.id);
});

router.post("/placePiece/:id", async (req, res) => {
	const gameId = req.params.id;
	const userId = req.query.uid as string;

	const game = await getGame(gameId);
	if (game) {
		const result = game.placePiece(req.body.pieceId, req.body.position, userId, req.body.orientation);
		if (result) {
			await saveGame(game);
			await transmitGameState(gameId);
			res.status(200).send();
		} else {
			res.status(400).send("Invalid Move");
		}
	} else {
		res.status(404).send("Game Doesn't Exist");
	}
});

// ! Realtime Stream
router.get("/gameStream/:id", async (req, res) => {
	const gameId = req.params.id;
	const userId = req.query.uid as string;
	const username = req.query.usr as string;

	let game = await getGame(gameId);
	if (!game) {
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

	// Initialize connections array if needed
	if (!activeConnections.has(gameId)) {
		activeConnections.set(gameId, []);
	}

	// Add this connection
	activeConnections.get(gameId).push(res);

	// Update game with player info
	game.lastPlayerTime = new Date().getTime() / 1000;
	game.listeners[userId] = res; // Store the response object for this user

	// Handle reconnection
	if (game.players[userId]) {
		game.players[userId].connected = true;
		console.log(`${clc.yellow(`[${gameId}]`)}${clc.green("[Reconnected]")} Player ${game.players[userId].username}`);
	}
	// Handle new player
	else if (game.numPlayers < 2) {
		game.players[userId] = new Player(userId, username, playerColors[game.numPlayers]);
		console.log(
			`${clc.yellow(`[${gameId}]`)}${clc.greenBright("[Connected]")} Player ${game.players[userId].username}`
		);
		game.numPlayers++;
	} else {
		console.log(`${clc.yellow(`[${gameId}]`)}${clc.blue("[Spectator Connected]")} ${userId}`);
	}

	await saveGame(game);

	// Send initial state
	res.write(getFilteredGame(game));

	// Handle disconnection
	req.on("close", async () => {
		const connections = activeConnections.get(gameId) || [];
		const index = connections.indexOf(res);
		if (index !== -1) {
			connections.splice(index, 1);
		}

		// Update game data
		const updatedGame = await getGame(gameId);
		if (updatedGame) {
			if (updatedGame.players[userId]) {
				console.log(
					`${clc.yellow(`[${gameId}]`)}${clc.red("[Disconnected]")} Player ${updatedGame.players[userId].username}`
				);
				updatedGame.players[userId].connected = false;
			}
			await saveGame(updatedGame);
			await transmitGameState(gameId);
		}
	});
});

// Update cron job for cleanup
Cron.schedule("* * * * *", async () => {
	try {
		// Get all game IDs
		const gameIds = await redis.keys("game:*").then((keys) => keys.map((key) => key.replace("game:", "")));

		const currentTime = new Date().getTime() / 1000;

		for (const gId of gameIds) {
			const game = await getGame(gId);
			if (!game) continue;

			const gameAge = currentTime - (game.createdAt || 0);
			const hasConnectedPlayers = Object.values(game.players).some((player) => player.connected);
			const isIdle = currentTime - game.lastMoveTime >= 300;
			const playersDisconnectedTime = currentTime - (game.lastPlayerTime || 0);

			if (isIdle || (!hasConnectedPlayers && playersDisconnectedTime >= 600) || game.finished) {
				game.finished = true;
				console.log(`${clc.yellow(`[${gId}]`)}${clc.bgRedBright("[Game Terminated]")}`);
				await transmitGameState(gId);
				await deleteGame(gId);

				// Clean up connections
				if (activeConnections.has(gId)) {
					const connections = activeConnections.get(gId);
					for (const conn of connections) {
						conn.end();
					}
					activeConnections.delete(gId);
				}
			}
		}
	} catch (error) {
		console.error("Error in cleanup cron job:", error);
	}
});

module.exports = router;

