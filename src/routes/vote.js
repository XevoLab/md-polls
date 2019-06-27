// vote.js
// (c) 2019 - Cescon Francesco

const express = require('express');
const router = express.Router();

var path = require('path');

const aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + './../aws_credentials.json');
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

});

module.exports = router;
