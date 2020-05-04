/**
 * @Filename:     vote.js
 * @Date:         Xevolab <francesco> @ 2019-11-27 15:25:44
 * @Last edit by: francesco
 * @Last edit at: 2020-02-29 11:05:43
 * @Copyright:    (c) 2019
 */

// vote.js
// (c) 2019 - Cescon Francesco

const express = require('express');
const router = express.Router();

var path = require('path');
require('dotenv').config();

router.use(require("./mid/collectInfo.js"))

const aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10', region: process.env.AWS_REGION});

router.get('/:id', (req, res) => {

	var params = {
		TableName: process.env.AWS_TABLE_NAME,
		ConsistentRead: true,
		Limit: 1,
		KeyConditionExpression: "ID = :val",
		ExpressionAttributeValues: {
			':val': {S: req.params.id}
		}
	};

	var ddbResponse = ddb.query(params, function(err, data) {
		if (err) {
			console.error("DynamoDB error vote.js : ", err);
			res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 500});
		} else {

			if (data.Items.length === 0) {
				console.log("404")
				res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});
				return;
			}
			else {

				var pollData = data.Items[0];

				var alreadyVoted = false;
				// Check if the IP is present
				for (var v in pollData.metadata.M.answeredBy.L) {
					if (pollData.metadata.M.answeredBy.L[v].M.token.S === req.payload.userToken.v || (pollData.metadata.M.answeredBy.L[v].M.IP.S === req.payload.userIP && pollData.metadata.M.enhancedPreventDoubles)) {
						alreadyVoted = true;
						break;
					}
				}

				// Check if there are more available answers
				var noMoreChoices = true;
				for (var v in pollData.options.L) {
					if (
						pollData.options.L[v].M.metadata.M.limitAnswers.N == 0 ||
						pollData.options.L[v].M.votes.N < pollData.options.L[v].M.metadata.M.limitAnswers.N
					) {
						noMoreChoices = false;
						break;
					}
				}

				// Check if the user can change his/her vote
				var allowChange = pollData.metadata.M.allowChange.BOOL;
				if (allowChange && !req.payload.userToken.new) {

					for (var v in pollData.metadata.M.editTokens.L) {
						if (pollData.metadata.M.editTokens.L[v].M.v.S === req.payload.userToken.v) {
							allowChange = true;
							break;
						}
						allowChange = false;
					}
				}
				else {
					allowChange = false;
				}

				var pollData = {
					id: req.params.id,
					cookies: req.cookies,
					uri: req.protocol + '://' + req.get('host') + '/v/' + req.params.id,
					pollData: pollData,
					alreadyVoted,
					allowChange,
					noMoreChoices,
					language: req.languageData.vote
				};

				res.render('pages/vote', pollData);
			}
		}
	});

});

router.post('/:id', (req, res) => {

	var getParams = {
		TableName: process.env.AWS_TABLE_NAME,
		ConsistentRead: true,
		Limit: 1,
		KeyConditionExpression: "ID = :val",
		ExpressionAttributeValues: {
			':val': {S: req.params.id}
		}
	};

	// Get data
	ddb.query(getParams, function(err, pollData) {
		if (err) {
			console.error("DynamoDB error vote.js : ", err);
			res.json({result: "error", message:"Somthing didn\'t work out quite right"});
		} else {

			if (pollData.Items.length === 0) {
				res.json({result: "empty"});
				return;
			}
			else {
				// Poll found
				pollData = pollData.Items[0];

				// Check the option exists
				if (parseInt(req.choice) === NaN || req.body.choice > (pollData.options.L.length - 1) || req.body.choice < 0) {
					res.json({result: "invalidChoice", message: "The selected choice is not valid"});
					return;
				}

				var alreadyVoted = false;
				// Check if 'prevent douplicates' mode is enabled
				if (pollData.metadata.M.preventDoubles.BOOL) {

					// Check if the IP is present
					for (var v in pollData.metadata.M.answeredBy.L) {
						if (pollData.metadata.M.answeredBy.L[v].M.token.S === req.payload.userToken.v || (pollData.metadata.M.answeredBy.L[v].M.IP.S === req.payload.userIP && pollData.metadata.M.enhancedPreventDoubles)) {
							alreadyVoted = true;
							break;
						}
					}
				}

				var changeAnswer = null;
				if (alreadyVoted && pollData.metadata.M.allowChange.BOOL && !req.payload.userToken.new) {

					for (var v in pollData.metadata.M.editTokens.L) {
						if (pollData.metadata.M.editTokens.L[v].M.v.S === req.payload.userToken.v) {
							changeAnswer = v;
							break;
						}
					}
				}

				if ((alreadyVoted && !pollData.metadata.M.allowChange.BOOL) || (alreadyVoted && pollData.metadata.M.allowChange.BOOL && changeAnswer === null)) {
					return res.json({result: "alreadyVoted", message: "You have already voted on this poll"});
				}

				// Check if 'collect names' mode is enabled
				if (pollData.metadata.M.collectNames.BOOL) {
					// Check if name was provided
					if (req.body.name === undefined || req.body.name === "") {
						res.json({result: "invalidName", message: "A valid name was not provied and this poll requires one"});
						return;
					}
				}

				// Check if answer has a limit
				if (pollData.options.L[parseInt(req.body.choice)].M.metadata.M.limitAnswers.N != 0) {
					if ((parseInt(pollData.options.L[parseInt(req.body.choice)].M.votes.N) + 1) > parseInt(pollData.options.L[parseInt(req.body.choice)].M.metadata.M.limitAnswers.N)) {
						res.json({result: "full", message:"This choide is already full"});
						return;
					}
				}

				var updateParams = {
					TableName: process.env.AWS_TABLE_NAME,
					Key: {
						"ID": {S: req.params.id}
					},
					UpdateExpression: `
						SET
						options[${parseInt(req.body.choice)}].votes = if_not_exists(
							options[${parseInt(req.body.choice)}].votes,
							:zero
						) + :incr,
						metadata.answeredBy = list_append(
							if_not_exists(
								metadata.answeredBy,
								:emptyList
							),
							:answeredEntry)
					`,
					ExpressionAttributeValues: {
						":incr": {N: '1'},
						":zero": {N: '0'},
						":answeredEntry": {L: [{M: {IP: {S: req.payload.userIP}, token: {S: req.payload.userToken.v}}}]},
						":emptyList": {L: []}
					}
				};

				// If change requested --> Invalidate the previous token and remove vote
				if (changeAnswer !== null) {
					if (pollData.metadata.M.editTokens.L[v].M.i.N == req.body.choice)
						return res.json({result: "error", message: "Nothing has changed"})

					updateParams.UpdateExpression += `,
						options[${pollData.metadata.M.editTokens.L[v].M.i.N}].votes = options[${pollData.metadata.M.editTokens.L[v].M.i.N}].votes - :incr,
						metadata.editTokens[${v}].i = :tokenvalue
					`;
					updateParams.ExpressionAttributeValues[":tokenvalue"] = {N: String(parseInt(req.body.choice))};
				}
				else if (pollData.metadata.M.allowChange.BOOL) {
					// If 'allowChange' --> Also save token for user
					updateParams.UpdateExpression += `,
						metadata.editTokens = list_append(
							if_not_exists(
								metadata.editTokens,
								:emptyList
							),
							:token)
					`;
					updateParams.ExpressionAttributeValues[":token"] = {L: [{M: {v: {S: req.payload.userToken.v}, i: {N: String(parseInt(req.body.choice))}}}]};
				}

				// If 'collect names' --> Also save the name
				if (pollData.metadata.M.collectNames.BOOL) {
					updateParams.ExpressionAttributeValues[":name"] = {L: [{S: String(req.body.name)}]};
					updateParams.ExpressionAttributeNames = {'#names' : 'names'};

					updateParams.UpdateExpression += `,
					options[${parseInt(req.body.choice)}].metadata.#names =
					list_append(
						if_not_exists(
							options[${parseInt(req.body.choice)}].metadata.#names,
							:emptyList
						),
						:name
					)`;
				}

				ddb.updateItem(updateParams, function(err, updateData) {
					if (err) {
						console.error("Vote casting error: "+ err.message);

						res.json({result: "error", message:"Somthing didn\'t work out quite right"});
					} else {

						// Socket.io --> Send to all connected users
						// 							 that a new vote came in
						//
						// Importing data from index file
						var io = require('../../index.js').io;
						var msg = {
							id: req.params.id,
							plus: req.body.choice,
							minus: (changeAnswer !== null ? pollData.metadata.M.editTokens.L[v].M.i.N : null),
							name: (pollData.metadata.M.collectNames.BOOL ? String(req.body.name) : "")
						}

						io.sockets.in("poll-"+msg.id).emit('vote', msg);

						res.json({result: "success", message:"Everything went smoothly"});
					}
				});

			}
		}
	});

});

module.exports = router;
