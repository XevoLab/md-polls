/**
 * @Filename:     pdf.js
 * @Date:         Xevolab <francesco> @ 2019-12-06 11:14:12
 * @Last edit by: francesco
 * @Last edit at: 2020-03-03 13:16:11
 * @Copyright:    (c) 2019
 */


const express = require('express');
const router = express.Router();

require('dotenv').config();

const aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10', region: process.env.AWS_REGION});

const ejs = require('ejs');
const fs = require('fs');
const pdf = require('html-pdf');

router.get("/:id", async (req, res) => {

	var params = {
		TableName: process.env.AWS_TABLE_NAME,
		ConsistentRead: true,
		Limit: 1,
		KeyConditionExpression: "ID = :val",
		ExpressionAttributeValues: {
			':val': {S: req.params.id}
		}
	};

	var ddbResponse = ddb.query(params).promise();

	var pollData = await ddbResponse.then((d) => {
		if (d.Items.length === 0) {
			res.render('pages/errors', {language: req.languageData.errors, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});
			return -1;
		}
		var pollData = d.Items[0];

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
		for (var v in pollData.metadata.M.answeredByIP.L) {
			if (pollData.metadata.M.answeredByIP.L[v].S === userIP) {
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
			return -1;
		}

		var pageData = {
			id: req.params.id,
			title: pollData.title.S,
			collectNames: pollData.metadata.M.collectNames.BOOL,
			total: totalVotes,
			options: pollData.options.L,
			uri: req.get('host'),
		};

		return pageData;

	}).catch((err) => {
		console.error("DynamoDB error results.js : ", err);
		res.render('pages/errors', {language: req.languageData.errors, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 500});
	})

	if (pollData === -1)
		return

	templateString = fs.readFileSync(require('path').resolve(__dirname, '../../views/pages/pdftemplate.ejs'), 'utf-8');
  html = ejs.render(templateString, pollData);

	pdf.create(html, {
		format: 'A4',
		orientation: 'portrait',
		border: {
			top: '5mm',
			left: '5mm',
			right: '5mm'
		},
		footer: {
			height: '15mm'
		}
	}).toStream(function(err, stream){
		res.setHeader('Content-type', 'application/pdf');
		stream.pipe(res);
	});
	return

});

module.exports = router;
