import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import circleauthwrapper from "@circlesystems/circleauth-wrapper";
import * as url from "url";

// const express = require("express");
// const dotenv = require("dotenv");
// const crypto = require("crypto");
// const circleauthwrapper = require("@circlesystems/circleauth-wrapper");
// const url = require("url");

const app = express();
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const hash = crypto.createHash("sha256");

dotenv.config();

// The array of allowed emails is hard-coded for this example.
// A database query should be used to check if a hash of the array
// hashedEmails matches the email hash of the database.
const allowedEmails = [
	"demo@gocircle.ai",
	"calisto@habloapp.com",
	"ishan@daimlas.com",
	"devteam@daimlas.com",
];

function initCircle() {
	circleauthwrapper.configure({
		appKey: process.env.ACCESS_APPKEY,
		readKey: process.env.ACCESS_READ_KEY,
		writeKey: process.env.ACCESS_WRITE_KEY,
	});
}
// check if the user email is inside the hashedEmails array
async function validateUserEmail(req, res, next, hashedEmails) {
	var hasValidEmail = false;
	var hashTmp = "";

	console.log(hashedEmails);

	// list hashedEmails elements
	for (var idx = 0; idx < hashedEmails.length; idx++) {
		// create a hash of the allowed email
		hashTmp = crypto
			.createHash("sha256")
			.update(allowedEmails[idx])
			.digest("hex");
		console.log(hashTmp);

		// if the email is valid, we set the flag to true
		if (hashedEmails.indexOf(hashTmp) > -1) {
			hasValidEmail = true;
			break;
		}
	}

	if (hasValidEmail) {
		// the email is valid, we can redirect the user to an allowed page
		// For this example, we will only show a message
		res
			.status(200)
			.json({ status: "ok", message: "You are allowed to access this page" });
	} else {
		// the email is not valid, we redirect the user to an error page
		res.status(401).json({
			message: "Unauthorized",
		});
	}
}

async function validateUserSession(req, res, next) {
	initCircle();
	// get the sessionId and userID from callback
	var sessionID = req.query.sessionID;
	var userID = req.query.userID;

	// check if the session is valid
	var checkSession = await circleauthwrapper.getUserSession(sessionID, userID);

	// if valid, we get the user email hashes
	if (checkSession.data.status == "active") {
		// we get the session details
		var sessionResult = await circleauthwrapper.getSession(sessionID);

		// now lets kill the current session
		// this avoid replay attacks
		await circleauthwrapper.expireUserSession(sessionID, userID);

		// we check if the user has valid emails in his profile
		validateUserEmail(req, res, next, sessionResult.data.userHashedEmails);
	} else {
		res.status(401).json({
			message: "Unauthorized",
		});
	}
}

console.log("yahan pe aaya");

app.use(function (req, res, next) {
	console.log("this is called");
	console.log("hey we are in app.use");
	if (req.query.userID) {
		try {
			console.log(req);
			console.log(req.query.userID);
			//validateUserSession(req, res, next);
		} catch (e) {
			console.log();
			console.log("error occured");
		}
	} else {
		res.sendFile(__dirname + "index.html");
	}
});

app.listen(4000);
console.log("Listening on http://localhost:4000");
