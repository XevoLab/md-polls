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

router.get('/:id', require("./mid/getQuestionary.js"), (req, res) => {

	// Check for errors
	if (!req.q.ok) {
		return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 500});
	} else {
		if (req.q.length === 0) {
			return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});
		}
	}

	var pollData = req.q.data;

	var alreadyVoted = false;
	// Check if the IP or token is present
	for (var v in pollData.metadata.answeredBy) {
		if (pollData.metadata.answeredBy[v].token === req.payload.userToken.v || (pollData.metadata.answeredBy[v].IP === req.payload.userIP && pollData.metadata.enhancedPreventDoubles)) {
			alreadyVoted = true;
			break;
		}
	}

	// Check if there are more available answers
	var noMoreChoices = true;
	for (var v in pollData.options) {
		if (
			pollData.options[v].metadata.limitAnswers == 0 ||
			pollData.options[v].votes < pollData.options[v].metadata.limitAnswers
		) {
			noMoreChoices = false;
			break;
		}
	}

	var pollData = {
		id: req.params.id,
		cookies: req.cookies,
		uri: req.protocol + '://' + req.get('host') + '/v/' + req.params.id,
		pollData: req.q.pubD,
		alreadyVoted,
		noMoreChoices,
		language: req.languageData.vote
	};

	res.render('pages/vote', pollData);

});

router.post('/:id', require("./mid/getQuestionary.js"), (req, res) => {

	// Check for errors
	if (!req.q.ok) {
		return res.json({result: "error", message:"Somthing didn\'t work out quite right"});
	} else {
		if (req.q.length === 0) {
			return res.json({result: "empty"});
		}
	}

	var pollData = req.q.data;

	// Check the option exists
	if (typeof(req.body.choices) !== "object" || req.body.choices.filter(n => (n >= pollData.options.length || n < 0)) > 0) {
		res.json({result: "invalidChoice", message: "The selected choices are not valid"});
		return;
	}

	var alreadyVoted = false;
	// Check if 'prevent douplicates' mode is enabled
	if (pollData.metadata.preventDoubles) {

		// Check if the IP is present
		for (var v in pollData.metadata.answeredBy) {
			if (pollData.metadata.answeredBy[v].token === req.payload.userToken.v || (pollData.metadata.answeredBy[v].IP === req.payload.userIP && pollData.metadata.enhancedPreventDoubles)) {
				alreadyVoted = true;
				break;
			}
		}

		if (alreadyVoted) {
			return res.json({result: "alreadyVoted", message: "You have already voted on this poll"});
		}
	}

	// Check if 'collect names' mode is enabled
	if (pollData.metadata.collectNames) {
		// Check if name was provided
		if (req.body.name === undefined || req.body.name === "") {
			res.json({result: "invalidName", message: "A valid name was not provied and this poll requires one"});
			return;
		}
	}

	// Check that not too many choices have been selected
	if (req.body.choices.length > pollData.metadata.maxOptions) {
		req.body.choices = req.body.choices.slice(0, pollData.metadata.maxOptions);
	}

	// Check if answer has a limit
	for (var i in req.body.choices) {
		if (pollData.options[parseInt(req.body.choices[i])].metadata.limitAnswers != 0) {
			if ((parseInt(pollData.options[parseInt(req.body.choices[i])].votes) + 1) > parseInt(pollData.options[parseInt(req.body.choices[i])].metadata.limitAnswers)) {
				res.json({result: "full", message:"This choide is already full"});
				return;
				break;
			}
		}
	}

	var updateParams = {
		TableName: process.env.AWS_TABLE_NAME,
		Key: {
			"ID": {S: req.params.id}
		},
		UpdateExpression: `
			SET
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

	// Add selected options to query
	for (var i in req.body.choices) {
		updateParams.UpdateExpression += `,
		options[${parseInt(req.body.choices[i])}].votes = if_not_exists(
			options[${parseInt(req.body.choices[i])}].votes,
			:zero
		) + :incr`

		// If 'collect names' --> Also save the name
		if (pollData.metadata.collectNames) {
			updateParams.ExpressionAttributeValues[":name"] = {L: [{S: String(req.body.name)}]};
			updateParams.ExpressionAttributeNames = {'#names' : 'names'};

			updateParams.UpdateExpression += `,
			options[${parseInt(req.body.choices[i])}].#names =
			list_append(
				if_not_exists(
					options[${parseInt(req.body.choices[i])}].#names,
					:emptyList
				),
				:name
			)`;
		}
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
				plus: req.body.choices,
				name: (pollData.metadata.collectNames ? String(req.body.name) : "")
			}

			io.sockets.in("poll-"+msg.id).emit('vote', msg);

			res.json({result: "success", k: pollData.metadata.auth, message:"Everything went smoothly"});
		}
	});

});

module.exports = router;
