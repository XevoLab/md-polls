/**
 * @Author: francesco
 * @Date:   2020-04-17T23:26:33+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-05-17T21:40:37+02:00
 */


const express = require('express');
const router = express.Router();

const crypto = require('crypto');
var slugid = require('slugid');

require('dotenv').config();

const aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10', region: process.env.AWS_REGION});

router.get('/:id', (req, res) => {
	// Get polls data from ID

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
		  res.json({result: "error", message:"Somthing didn\'t work out quite right"});
		} else {
			if (data.Items.length === 0) {
				res.json({result: "empty"});
			}
			else {
				res.json(aws.DynamoDB.Converter.unmarshall(data.Items[0]));
			}
		}
	});

});

router.use(require("./mid/collectInfo.js"))

router.post('/', (req, res) => {

	// Create a new poll

	// Remap data
	var d = req.body;
	var pollID = slugid.v4().replace(/[\-\_]/g, "").substr(0, 9);

	const graphTypes = ["bars", "pie"];

	// Item to be added into dynamoDB
	var itemData = {
		'ID': pollID,
		'apiV': 3,
		'created': Date.now(),
		'title': (d.title || pollID),
		'metadata': {
			preventDoubles: !(d.metadata.preventDoubles === false || d.metadata.enhancedPreventDoubles === false),
			enhancedPreventDoubles: ((d.metadata.enhancedPreventDoubles === true) || false),
			collectNames: (d.metadata.collectNames || false),
			hiddenResults: (d.metadata.hiddenResults || false),
			graphType: (graphTypes.includes(d.metadata.graphType) ? (d.metadata.graphType || "bars") : "bars"),
			minOptions: 1,
			maxOptions: 1,
			auth: slugid.nice(),
			owner: {
				IP: req.payload.userIP,
				token: req.payload.userToken.v
			},
			answeredBy: []
		},
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
		res.json({result: "error", error: "notEnoughAnswers", message:"Not enough valid options"});
		return false;
	}

	// Adding the options
	var options = [];
	for (var i = 0; i < d.options.length; i++) {
		var o = d.options[i];

		if (isNaN(parseInt(o.metadata.limitAnswers)) || o.metadata.limitAnswers < 0) {
			o.metadata.limitAnswers = 0;
		}

		// Forcing object structure
		// Hence, only allowed data will be inside the database
		var singleOption = {
			id: i,
			value: o.value,
			metadata: {
				limitAnswers: o.metadata.limitAnswers
			},
			votes: 0
		}

		if (d.metadata.collectNames) {
			singleOption.metadata["names"] = [];
		}

		options.push(singleOption);
	}
	itemData.options = options;

	var params = {
		TableName: process.env.AWS_TABLE_NAME,
		Item: aws.DynamoDB.Converter.marshall(itemData)
	};

	var ddbResponse = ddb.putItem(params).promise();

	ddbResponse.then(function(data) {
		console.log("Poll created: "+pollID);

	  res.json({result: "success", ID: pollID, message:"Request processed successfully"});
	}).catch(function(err) {
		console.error("Poll creation error: "+pollID+" | error: "+ err.message);

	  res.json({result: "error", message:"Somthing didn\'t work out quite right"});
	});


});

module.exports = router;
