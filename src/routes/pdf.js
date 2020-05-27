/**
 * @Author: francesco
 * @Date:   2020-04-16T22:09:05+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-05-20T12:12:40+02:00
 */



const express = require('express');
const router = express.Router();

require('dotenv').config();
router.use(require("./mid/collectInfo.js"))

const aws = require('aws-sdk');
var ddb = new aws.DynamoDB({apiVersion: '2012-08-10', region: process.env.AWS_REGION});

const ejs = require('ejs');
const fs = require('fs');
const pdf = require('html-pdf');

router.get("/:id", require("./mid/getQuestionary.js"), (req, res) => {

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

	var pollData = req.q.data;

	// Check k value
	if (req.query.k !== pollData.metadata.auth)
		return res.render('pages/errors', {language: req.languageData.errors, cookies: req.cookies, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});

	var totalVotes = pollData.options.reduce((ac, cv) => ac + parseInt(cv.votes), 0);

	var alreadyVoted = false;
	// Check if the IP is present
	for (var v in pollData.metadata.answeredBy) {
		if (pollData.metadata.answeredBy[v].token === req.payload.userToken.v || pollData.metadata.answeredBy[v].IP === req.payload.userIP) {
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
		return -1;
	}

	var pageData = {
		id: req.params.id,
		data: req.q.pubD,
		collectNames: pollData.metadata.collectNames,
		total: totalVotes,
		uri: req.get('host'),
	};

	templateString = fs.readFileSync(require('path').resolve(__dirname, '../../views/pages/pdftemplate.ejs'), 'utf-8');
  html = ejs.render(templateString, pageData);

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
