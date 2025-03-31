import "reflect-metadata";
require("dotenv").config();

import express from "express";

var bodyParser = require("body-parser");
var cors = require("cors");

const app = express();

app.use(
	cors({
		allowedHeaders: "Origin,Authorization,X-Requested-With,Content-Type,Accept,Username,UserID",
		origin: "*",
		optionsSuccessStatus: 204,
	})
);

app.options(
	"*",
	cors({
		allowedHeaders: "Origin,Authorization,X-Requested-With,Content-Type,Accept,Username,UserID",
		origin: "*",
		optionsSuccessStatus: 204,
	})
);

app.use(bodyParser.json({ limit: "50mb" }));

app.use("/", require("../routes"));

app.listen(process.env.PORT || 3001, (): void => {
	console.log(`Server started on port ${process.env.PORT || 3001}`);
});

