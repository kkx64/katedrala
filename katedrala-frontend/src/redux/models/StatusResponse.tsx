export default interface StatusResponse {
	avgLoad: [number, number, number];
	totalMemory: number;
	freeMemory: number;
	uptime: number;
	activeGames: number;
}
