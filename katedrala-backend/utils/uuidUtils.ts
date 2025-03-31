import short from "short-uuid";

const shortIdGen = short("123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");

export const getShortUUID = () => {
	return shortIdGen.generate().substring(0, 6);
};

