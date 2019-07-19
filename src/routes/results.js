// vote.js
// (c) 2019 - Cescon Francesco

const express = require('express');
const router = express.Router();

var path = require('path');
require('dotenv').config();

const aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10', region: 'eu-central-1'});

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
				res.sendFile(path.resolve('public/errorPages/404.html'));
				return;
			}
			else {
				var pollData = data.Items[0];

				function compare(a, b) {
				  // Use toUpperCase() to ignore character casing
				  const votesA = parseInt(a.M.votes.N);
				  const votesB = parseInt(b.M.votes.N);

				  let comparison = 0;
				  if (votesA > votesB) {
				    comparison = -1;
				  } else if (votesA < votesB) {
				    comparison = +1;
				  }
				  return comparison;
				}

				pollData.options.L = pollData.options.L.sort(compare);

				var totalVotes = pollData.options.L.reduce((ac, cv) => ac + parseInt(cv.M.votes.N), 0);
				var userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

				var alreadyVoted = false;
				// Check if the IP is present
				for (var v in pollData.metadata.M.answeredBy.L) {
					if (pollData.metadata.M.answeredBy.L[v].S === userIP) {
						alreadyVoted = true;
						break;
					}
				}

				// Check if 'hidden_results' mode is enabled
				if (pollData.metadata.M.hiddenResults.BOOL && !alreadyVoted) {
					var pageData = {
						id: req.params.id,
						language: req.languageData.hiddenResults,
						uri: req.protocol + '://' + req.get('host')
					}

					res.render('pages/hiddenResults', pageData);
					return;
				}

				var pageData = {
					id: req.params.id,
					title: pollData.title.S,
					total: totalVotes,
					options: pollData.options.L,
					uri: req.protocol + '://' + req.get('host') + '/r/' + req.params.id,
					alreadyVoted: alreadyVoted,
					collectNames: pollData.metadata.M.collectNames.BOOL,
					language: req.languageData.results
				};

				res.render('pages/results', pageData);
			}
		}
	});

});

module.exports = router;
