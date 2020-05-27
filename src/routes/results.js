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

router.get('/:id', require("./mid/getQuestionary.js"), (req, res) => {

	// Blocking invalid k values
	if (typeof(req.query.k) !== "string" || req.query.k === "")
		return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});

	// Trimming
	req.query.k = req.query.k.trim();

	// Check for errors
	if (!req.q.ok) {
		return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 500});
	} else {
		if (req.q.length === 0) {
			return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});
		}
	}

	// Set up data
	var pollData = req.q.data;
	req.q.pubD.options = req.q.pubD.options.sort((a, b) => b.votes-a.votes)

	if (req.query.k !== pollData.metadata.auth)
		return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});

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
		data: req.q.pubD,
		k: req.query.k,
		cookies: req.cookies,
		uri: req.protocol + '://' + req.get('host') + '/r/' + req.params.id,
		alreadyVoted: alreadyVoted,
		language: req.languageData.results
	};

	res.render('pages/results', pageData);

});

module.exports = router;
