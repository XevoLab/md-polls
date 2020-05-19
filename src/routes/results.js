/**
 * @Filename:     results.js
 * @Date:         Xevolab <francesco> @ 2019-11-27 15:25:44
 * @Last edit by: francesco
 * @Last edit at: 2020-03-22 21:24:17
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

	// Blocking invalid k values
	if (typeof(req.query.k) !== "string" || req.query.k === "")
		return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});

	// Trimming
	req.query.k = req.query.k.trim();

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
			console.error("DynamoDB error results.js : ", err);
			res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 500});
		} else {

			if (data.Items.length === 0) {
				return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});
			}
			else {
				var pollData = aws.DynamoDB.Converter.unmarshall(data.Items[0]);

				// Ordering function
				function compare(a, b) {
				  const votesA = parseInt(a.votes);
				  const votesB = parseInt(b.votes);

				  let comparison = 0;
				  if (votesA > votesB) {
				    comparison = -1;
				  } else if (votesA < votesB) {
				    comparison = +1;
				  }
				  return comparison;
				}

				if (req.query.k !== pollData.metadata.auth)
					return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});

				pollData.options = pollData.options.sort(compare);

				var alreadyVoted = false;
				// Check if the IP is present
				for (var v in pollData.metadata.answeredBy) {
					if (pollData.metadata.answeredBy[v].token === req.payload.userToken.v || (pollData.metadata.answeredBy[v].IP === req.payload.userIP && pollData.metadata.enhancedPreventDoubles)) {
						alreadyVoted = true;
						break;
					}
				}

				// Check if 'hidden_results' mode is enabled
				if (pollData.metadata.hiddenResults && !alreadyVoted) {
					var pageData = {
						id: req.params.id,
						language: req.languageData.hiddenResults,
						cookies: req.cookies,
						uri: req.protocol + '://' + req.get('host')
					}

					res.render('pages/hiddenResults', pageData);
					return;
				}

				var pageData = {
					id: req.params.id,
					title: pollData.title,
					options: pollData.options,
					cookies: req.cookies,
					uri: req.protocol + '://' + req.get('host') + '/r/' + req.params.id,
					alreadyVoted: alreadyVoted,
					language: req.languageData.results
				};

				res.render('pages/results', pageData);
			}
		}
	});

});

module.exports = router;
