import "../styles/game.scss";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useParams, Link } from "react-router-dom";
import { isMobile } from "react-device-detect";

import { useAppSelector, useAppDispatch, RootState } from "../redux/store";
import { connectToGame, disconnectFromGame, placePiece, startGame } from "../redux/slices/mainSlice";
import { rotateMatrix90C } from "../utils/matrixUtils";

const GamePage = () => {
	const { gameId } = useParams();

	const [selectedPiece, setSelectedPiece] = useState([[]] as boolean[][]);
	const [selectedPieceId, setSelectedPieceId] = useState(-1);
	const [orientation, setOrientation] = useState(0);
	const [hoveringPosition, setHoveringPosition] = useState(null as null | [number, number]);
	const [originalHoveringPosition, setOriginalHoveringPosition] = useState(null as null | [number, number]);
	const [hoverArray, setHoverArray] = useState(
		Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => false))
	);

	const boardFieldRef = useRef<HTMLDivElement>(null);
	const boardRef = useCallback((node: HTMLDivElement | null) => {
		if (node) {
			node.addEventListener(
				"touchmove",
				(e) => {
					e.preventDefault();
				},
				{ passive: false }
			);
		}
	}, []);

	const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

	const dispatch = useAppDispatch();
	const { currentGame, myUid, pieces } = useAppSelector((state: RootState) => state.main);

	useEffect(() => {
		if (gameId) {
			if (!currentGame || currentGame?.id !== gameId) dispatch(connectToGame(gameId));
		}
	}, [dispatch, gameId]);

	useEffect(() => {
		if (selectedPieceId && pieces[selectedPieceId]) {
			let pc = pieces[selectedPieceId];
			for (let i = 0; i < orientation; i++) {
				pc = rotateMatrix90C(selectedPiece);
			}
			setSelectedPiece(pc);
		}
	}, [orientation]);

	useEffect(() => {
		setHoveringPosition(Object.create(hoveringPosition));
		setOriginalHoveringPosition(Object.create(hoveringPosition));
	}, [selectedPiece]);

	const increaseOrientation = () => {
		setOrientation((orientation + 1) % 4);
	};

	useEffect(() => {
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === "r") {
				increaseOrientation();
			}
		};
		window.addEventListener("keydown", handleEsc);

		return () => {
			window.removeEventListener("keydown", handleEsc);
		};
	}, [increaseOrientation]);

	useEffect(() => {
		if (hoveringPosition && selectedPiece) {
			const newHoverArray = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => false));
			for (let y = 0; y < selectedPiece.length; y++) {
				for (let x = 0; x < selectedPiece[0].length; x++) {
					if (selectedPiece[y][x]) {
						let yIndex = y - 1 + hoveringPosition[0];
						let xIndex = x - 1 + hoveringPosition[1];
						if (yIndex >= 0 && yIndex <= 9 && xIndex >= 0 && xIndex <= 9) newHoverArray[yIndex][xIndex] = true;
					}
				}
			}
			setHoverArray(newHoverArray);
		}
	}, [hoveringPosition]);

	const onPlacePiece = () => {
		if (selectedPieceId >= 0 && hoveringPosition && gameId) {
			dispatch(
				placePiece({
					pieceId: selectedPieceId,
					position: [hoveringPosition[1], hoveringPosition[0]],
					orientation: orientation,
					gameId,
				})
			);
			setSelectedPiece([[]]);
			setSelectedPieceId(-1);
			setOrientation(0);
			setHoverArray(Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => false)));
		}
	};

	const getFieldBackgroundColor = (i: number, j: number) => {
		const field = currentGame?.boardState.fields[i][j];
		if (field && field.pieceId && field.playerId) return currentGame?.players[field.playerId].color;
		else if (field && !field.pieceId && field.playerId) return currentGame?.players[field.playerId].color + "55";
		else if (field && field.pieceId !== undefined && !field.playerId) return "white";
		return "transparent";
	};

	const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

	const moveHoveredPiece = (x: number, y: number) => {
		if (hoveringPosition && originalHoveringPosition) {
			setHoveringPosition([
				clamp(Math.floor(originalHoveringPosition[0] + y), 0, 9),
				clamp(Math.floor(originalHoveringPosition[1] + x), 0, 9),
			]);
		}
	};

	const onDragBoardMovePiece = (e: React.TouchEvent) => {
		const itemWidth = boardFieldRef.current?.getBoundingClientRect().width ?? 100;
		if (isMobile) {
			moveHoveredPiece(
				(e.touches[0].clientX - touchStart.x) / itemWidth,
				(e.touches[0].clientY - touchStart.y) / itemWidth
			);
		}
	};

	if (!currentGame)
		return (
			<div className="w-full h-[86vh] flex flex-col items-center justify-center gap-8">
				<h2 className="text-9xl">:(</h2>
				<h2>Game Not Found</h2>
				<Link to={"/"} className="bg-yellow-500 px-8 py-4 rounded-xl">
					<div>Home</div>
				</Link>
			</div>
		);

	return (
		<div className="w-full h-[100svh] p-16 flex flex-col items-center justify-evenly gap-4">
			<div className="opacity-50 text-2xl font-extrabold">Game {gameId}</div>

			<div className="flex flex-col items-center">
				<div className="flex items-center justify-center gap-4">
					{currentGame?.players &&
						Object.keys(currentGame?.players)
							.map((p) => currentGame?.players[p])
							.map((player) => {
								return (
									<div
										className={`rounded-full px-4 py-2 flex items-center gap-4`}
										style={{
											backgroundColor: player.isTurn ? player.color + "33" : "rgb(31,41,55)",
											border: player.isTurn ? `2px solid ${player.color}` : "none",
										}}
									>
										<p>{player.username}</p>
										<div className={`${player.connected ? "bg-green-500" : "bg-red-500"} h-2 w-2 rounded-full`} />
									</div>
								);
							})}
				</div>
			</div>
			{currentGame?.started && (
				<div
					onContextMenu={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					onTouchStart={(e) => {
						if (isMobile) {
							setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
						}
					}}
					onTouchEnd={(e) => {
						if (isMobile) setOriginalHoveringPosition(Object.create(hoveringPosition));
					}}
					ref={boardRef}
					onTouchMove={(e) => {
						onDragBoardMovePiece(e);
					}}
					className="board select-none border-4 border-gray-800 w-full h-auto md:h-full md:w-auto"
				>
					{currentGame?.boardState.fields.map((row, i) => (
						<div className="row">
							{row.map((field, j) => (
								<div
									key={`${i},${j}`}
									ref={boardFieldRef}
									onMouseEnter={(e) => {
										setHoveringPosition([i, j]);
										setOriginalHoveringPosition([i, j]);
									}}
									onClick={() => {
										if (!isMobile) onPlacePiece();
									}}
									style={{
										backgroundColor: hoverArray[i][j]
											? "rgb(75 85 99)"
											: field.pieceId === null && field.playerId !== null
											? currentGame.players[field.playerId as string].color + "44"
											: "unset",
									}}
									className={`relative cursor-pointer piece ${
										field.pieceId !== null && field.pieceId !== undefined && "active"
									} 
							${j > 0 && row[j - 1].pieceId === field.pieceId && row[j - 1].playerId === field.playerId && "adj-l"}
							${j < row.length - 1 && row[j + 1].pieceId === field.pieceId && row[j + 1].playerId === field.playerId && "adj-r"}
							${
								i > 0 &&
								currentGame.boardState.fields[i - 1][j].pieceId === field.pieceId &&
								currentGame.boardState.fields[i - 1][j].playerId === field.playerId &&
								"adj-t"
							}
							${
								i < currentGame.boardState.fields.length - 1 &&
								currentGame.boardState.fields[i + 1][j].pieceId === field.pieceId &&
								currentGame.boardState.fields[i + 1][j].playerId === field.playerId &&
								"adj-b"
							}

							`}
								>
									<div
										style={{
											backgroundColor: getFieldBackgroundColor(i, j),
											filter: `drop-shadow(0 0 4px ${getFieldBackgroundColor(i, j)})`,
										}}
										className={`${field.pieceId !== undefined && field.playerId === undefined && "bg-white"}`}
									/>
									<div
										className="absolute transition-none top-0 left-0 pointer-events-none w-full h-full"
										style={{
											backgroundColor: hoverArray[i][j]
												? (currentGame.boardState.fields[i][j].pieceId !== undefined &&
														currentGame.boardState.fields[i][j].pieceId !== null) ||
												  (currentGame.boardState.fields[i][j].playerId !== undefined &&
														currentGame.boardState.fields[i][j].playerId !== null &&
														currentGame.boardState.fields[i][j].playerId !== myUid)
													? "#ff000044"
													: "#ffffff22"
												: "transparent",
											zIndex: 10,
										}}
									/>
								</div>
							))}
						</div>
					))}
				</div>
			)}
			{!currentGame?.started && currentGame?.creator === localStorage.getItem("uid") && (
				<div className="w-full flex flex-col items-center">
					{currentGame.numPlayers === 2 && (
						<button
							onClick={() => {
								if (gameId) dispatch(startGame(gameId));
							}}
							className="bg-yellow-500 px-8 py-4 rounded-xl"
						>
							Start Game
						</button>
					)}
					{currentGame.numPlayers < 2 && <div>Waiting for players...</div>}
				</div>
			)}
			{currentGame?.started && (
				<div className="lg:hidden w-full flex items-center justify-evenly">
					<button
						onClick={() => {
							increaseOrientation();
						}}
						type="button"
						className="bg-blue-600 px-8 py-4 rounded-xl"
					>
						Rotate
					</button>
					<button
						onClick={() => {
							onPlacePiece();
						}}
						type="button"
						className="bg-yellow-600 px-8 py-4 rounded-xl"
					>
						Place
					</button>
				</div>
			)}
			{currentGame?.started && (
				<div className=" border-gray-800 w-full flex items-center justify-start gap-2 overflow-y-hidden overflow-x-scroll h-24 lg:h-36">
					{myUid &&
						currentGame?.players[myUid].availablePieces.map((piece) => (
							<div
								key={`availablePiece-${piece.pieceId}`}
								onClick={() => {
									setSelectedPiece(pieces[piece.pieceId]);
									setOrientation(0);
									setSelectedPieceId(piece.pieceId);
								}}
								className=" cursor-pointer aspect-square flex flex-col h-full rounded-xl hover:bg-gray-600 bg-gray-800"
							>
								{pieces[piece.pieceId] &&
									pieces[piece.pieceId].map((row, i) => (
										<div className="row flex-1 flex items-center">
											{row &&
												row.map((field, j) => (
													<div className={`${field && "bg-gray-300"} aspect-square flex-1 w-full h-full`} />
												))}
										</div>
									))}
							</div>
						))}
				</div>
			)}
			{currentGame?.winner && (
				<div className="w-full h-full fixed left-0 top-0 bg-gray-900 bg-opacity-60 flex flex-col items-center justify-center gap-8">
					<h2 className="text-4xl">
						{currentGame?.winner === myUid && "You Won! :)"}
						{currentGame?.winner !== myUid && "You Lost... :( Better luck next time!"}
					</h2>
					<Link to="/" className="bg-yellow-500 px-8 py-4 rounded-xl">
						<div>Home</div>
					</Link>
				</div>
			)}
			<div className="hidden lg:visible absolute right-12 w-fit h-fit">
				<ins
					className="adsbygoogle"
					style={{ display: "block" }}
					data-ad-client="ca-pub-7823764966313439"
					data-ad-slot="2634722459"
					data-ad-format="auto"
					data-full-width-responsive="true"
				></ins>
			</div>
		</div>
	);
};

export default GamePage;

