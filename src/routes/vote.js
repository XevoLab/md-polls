// vote.js
// (c) 2019 - Cescon Francesco

const express = require('express');
const router = express.Router();

var path = require('path');

const aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/./../aws_credentials.json');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});

router.get('/:id', (req, res) => {

	var params = {
		TableName: 'polls',
		ConsistentRead: true,
		Limit: 1,
		KeyConditionExpression: "ID = :val",
		ExpressionAttributeValues: {
			':val': {S: req.params.id}
		}
	};

	var ddbResponse = ddb.query(params, function(err, data) {
		if (err) {
			res.sendFile(path.resolve('public/errorPages/404.html'));
		} else {

			if (data.Items.length === 0) {
				console.log("404")
				res.sendFile(path.resolve('public/errorPages/404.html'));
				return;
			}
			else {
				var pollData = {
					id: req.params.id,
					uri: req.protocol + '://' + req.get('host') + '/v/' + req.params.id,
					shareButtons: {},
					pollData: data.Items[0],
					language: req.languageData.vote
				};

				res.render('pages/vote', pollData);
			}
		}
	});

});

router.post('/:id', (req, res) => {

	var getParams = {
		TableName: 'polls',
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
			res.json({result: "error", message:"Somthing didn\'t work out quite right"});
		} else {

			if (pollData.Items.length === 0) {
				res.json({result: "empty"});
				return;
			}
			else {
				// Poll found
				pollData = pollData.Items[0];

				var userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

				// Check the option exists
				if (parseInt(req.choice) === NaN || req.body.choice > (pollData.options.L.length - 1) || req.body.choice < 0) {
					res.json({result: "invalidChoice", message: "The selected choice is not valid"});
					return;
				}

				// Check if 'prevent douplicates' mode is enabled
				if (pollData.metadata.M.preventDoubles.BOOL) {

					// Check if the IP is present
					for (var v in pollData.metadata.M.answeredBy.L) {
						if (pollData.metadata.M.answeredBy.L[v].S === userIP) {
							res.json({result: "alreadyVoted", message: "You have already voted on this poll"});
							return;
						}
					}
				}

				// Check if 'collect names' mode is enabled
				if (pollData.metadata.M.collectNames.BOOL) {
					// Check if name was provided
					if (req.body.name === undefined || req.body.name === "") {
						res.json({result: "invalidName", message: "A valid name was not provied and this poll requires one"});
						return;
					}
				}

				var updateParams = {
					TableName: "polls",
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
							:IP)
					`,
					ExpressionAttributeValues: {
						":incr": {N: '1'},
						":zero": {N: '0'},
						":IP": {L: [{S: userIP}]},
						":emptyList": {L: []}
					}
				};

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
						console.error("CastVote: " + err.message)
						res.json({result: "error", message:"Somthing didn\'t work out quite right"});
					} else {
						res.json({result: "success", message:"Everything went smoothly"});
					}
				});

			}
		}
	});

});

module.exports = router;
