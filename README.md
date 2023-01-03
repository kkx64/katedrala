
# KATEDRALA

The GitHub repository for [playkatedrala.com](https://playkatedrala.com)

## Contributing
Open a PR with a fix or feature, and I'll merge it ASAP.

## Reporting bugs
There's probably a bunch of them, so open an issue in this repo and I'll take a look at it.

## Helping out
I pay for hosting out of my own pocket, but you can help keep playkatedrala.com online [here](https://www.buymeacoffee.com/kirilkrsteski).
This way you're supporting my other projects, too.  
You can also host your own version/instance of this project, if you somehow have a free hosting option :)

## How to run the project

1. Clone the repository
2. Add a `.env` file in the `katedrala-frontend` folder, it should include the keys `REACT_APP_API_URL` and `REACT_APP_API_URL_DEV`, with links to the API. 
- The default running URL for the backend is `localhost:3001`
- When running with `npm start`, the app will use the `REACT_APP_API_URL_DEV` key
- When runnning `npm run build`, the app will use the `REACT_APP_API_URL` key
3. First run:
 - Run `npm install` in the `katedrala-frontend` folder
 - Run `npm install` in the `katedrala-backend` folder
4. `npm start` inside the `katedrala-backend` folder
5. `npm start` inside the `katedrala-frontend` folder
6. Done!

## How to build
### Frontend
 - `npm run build`
 This generates a static build ready for serving
### Backend
 - `tsc`
 Then to run: `node dist/index.js`

 ## API Definition

### `GET /getId | string`
Returns a `uuid` string. Used in the frontend to identify a player.
### `GET /getPieces | boolean[][][]`
Returns all pieces, so they can be indexed on the frontend by their ID instead of the whole arrays being sent on every request.
### `POST /createGame | string`
* Query parameters:
    -  `uid` **required** - The player's UUID 
Creates a new game and returns its ID.
### `POST /startGame/:id`
Start game with `id`
### `POST /placePiece/:id`
Place a piece
* Query parameters:
    -  `uid` **required** - The player's UUID
* Body:
    -  `pieceId: number` **required** - The ID of the piece to place 
    -  `position: [x:number, y:number]` **required** - Where to place the piece
    -  `orientation: number` **required** - Orientation of the piece
* Returns
    - `Status 200` Piece placed.
    - `Status 400` Invalid move.
    - `Status 404` Game not found.
### `EventSource /gameStream/:id`
Connects to a game. If there are already 2 players, or the game has started, connects as a spectator (unless the connecting player is one of the players in the game).
* Query parameters:
    -  `uid` **required** - The player's UUID
    -  `usr` **required** - The player's username
* Returns
    - `Status 200` 
        -  Sends back a `Game` object (stringified, needs to be `JSON.parse`'d) inside `message.data` when the game state is updated
    - `Status 404` Game not found.

## Models
```ts
Game {
    // Game ID
	id: string; 
    // Current state of the fields
	boardState: BoardState; 
    // Players
	players: { [key: string]: Player };
    // The timestamp of the last move in seconds since epoch
	lastMoveTime: number;
    // Number of players
	numPlayers: number;
    // Has the game started?
	started: boolean;
    // Has the game finished?
	finished: boolean;
    // If this is set, the game is over,
    // and the winner is the player with this UUID
	winner?: string;
    // The UUID of the player who created the game
	creator: string;
    // ID of the last move, needed for EventSource
	moveId: number;
    // EventSources subscribed to this game
	listeners: { [key: string]: express.Response };
}
```

```ts
Player {
	playerId: string;
	username: string;
	color: string;
    // Pieces in the player's hand
	availablePieces: Piece[];
    // Is it this player's turn?
	isTurn: boolean;
    // Is the player connected?
	connected: boolean;
}
```

```ts
BoardState {
    // The 10x10 fields of the board
	fields: BoardField[][]; 
}
```

```ts
BoardField {
    // If set, a piece lays on this field
    //
    // If this is set, and playerId is null/undefined,
    // this piece is the Cathedral
	pieceId?: number;

    // If this is set, and pieceId is not,
    // this is a territory of playerId
    //
    // If this AND pieceId are set,
    // the pieceId on this field belongs to playerId
	playerId?: string;
}
```

```ts
class Piece {
    // The ID of this piece
    //
    // In this case, the ID is the index of the piece
    // in the /getPieces array
	pieceId: number;
}
```

## License
[MIT](https://opensource.org/licenses/MIT)