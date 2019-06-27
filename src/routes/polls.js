// polls.js
// (c) 2019 - CesconFrancesco

const express = require('express');
const router = express.Router();

const aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + '/./../aws_credentials.json');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10'});

router.get('/:id', (req, res) => {
	// Get polls data from ID

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
		  res.json({result: "error", message:"Somthing didn\'t work out quite right"});
		} else {
			var resultSet = []
			data.Items.forEach(function(element, index, array) {
				resultSet.push(element);
			});

			if (data.Items.length === 0) {
				res.json({result: "empty"})
			}
			else {
				res.json(data.Items[0]);
			}
		}
	});

});

router.post('/', (req, res) => {

	// Create a new poll

	// Remap data
	var d = req.body;

	const b64 = require('number-to-base64'); // Base64 econding of id
	var pollID = Math.floor((Date.now() - 946080000) / 1000) + String(Math.floor(Math.random()*1000));
	pollID = b64.ntob(pollID);

	// Item to be added into dynamoDB
	var itemData = {
		'ID': {S: pollID},
		'created': {N: String(Date.now())},
		'ownerIP': {S: req.headers['x-forwarded-for'] || req.connection.remoteAddress},
		'title': {S: d.title || pollID},
		'metadata': {M: {
			preventDoubles: {BOOL: (d.metadata.preventDoubles || false)},
			collectNames: {BOOL: (d.metadata.collectNames || false)},
			answeredBy: {L: []}
		}},
		'options': null,
	}

	// Check options quality
	for (var i = 0; i < d.options.length; i++) {
		d.options[i].ID = i;

		if (d.options[i].value == "") {
			d.options.splice(i,1);
		}
	}
	if (d.options.length < 1) {
		return {result: "error", error: "notEnoughAnswers", message:"Not enough valid options"}
	}

	// Adding the options
	var options = [];
	for (var i = 0; i < d.options.length; i++) {
		var o = d.options[i];

		// Forcing object structure
		// Hence, only allowed data will be inside the database
		var singleOption = {
			id: {N: String(i)},
			value: {S: o.value},
			metadata: {M: {
				limitAnswers: {N: String(o.metadata.limitAnswers || 0)}
			}},
			count: {N: '0'}
		}

		options.push({M: singleOption});
	}
	itemData.options = {L: options};

	var params = {
		TableName: 'polls',
		Item: itemData
	};

	var ddbResponse = ddb.putItem(params).promise();

	ddbResponse.then(function(data) {
	  res.json({result: "success", ID: pollID, message:"Request processed successfully"});
	}).catch(function(err) {
	  res.json({result: "error", message:"Somthing didn\'t work out quite right"});
	});


});

module.exports = router;
