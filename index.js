/**
 * @Filename:     index.js
 * @Date:         Xevolab <francesco> @ 2019-12-01 20:50:03
 * @Last edit by: francesco
 * @Last edit at: 2019-12-07 00:04:30
 * @Copyright:    (c) 2019
 */

// Index.js
// (c) 2019 - Cescon Francesco

const express = require("express");
const path = require("path");

const app = express();
const http = require('http').createServer(app);

//
// --- --- --- ---
//

// Socket.io
var io = module.exports.io = require('socket.io')(http)

io.on('connection', (socket) => {

	var pollID = socket.handshake.query.pollID;

	// Close connection with invalid ID
	if (pollID === undefined) {
		socket.disconnect(0);
		return;
	}

	socket.join("poll-"+pollID);

	socket.on('disconnect', function(){});
})

//
// --- --- --- ---
//

// LANGUAGE MIDDLEWARE
const languageSelector = (req, res, next) => {
	var lang = req.acceptsLanguages('en', 'it');
	if (!lang) {
		lang = 'en';
	}
	req.lang = lang;
	req.lang = "en";

	req.languageData = require('./src/languages/'+lang+'.json');

	// Adding the language code to every page element
	// add the commons
	for (var v in req.languageData) {
		req.languageData[v].languageCode = lang;
		req.languageData[v] = {...req.languageData.commons, ...req.languageData[v]}
	}
	next();
}
app.use(languageSelector);

// GET REQUESTS

	// PAGES

		// set the view engine to ejs
		app.set('view engine', 'ejs');

		// Index
		app.get(['/', '/index.html', 'index.php'], (req, res) => {
			res.render('pages/index', {language: req.languageData.index, uri: req.protocol + '://' + req.get('host') + '/'});
		});

		// Results
		app.use(['/r/', '/result/', '/results/'], require('./src/routes/results.js'));

		// Translate
		app.use('/translate', (req, res) => {
			res.render('pages/translate', {language: req.languageData.translate, uri: req.protocol + '://' + req.get('host') + '/'});
		});
		app.use('/how-it-works', (req, res) => {
			res.render('pages/howItWorks', {language: req.languageData.howItWorks, uri: req.protocol + '://' + req.get('host') + '/'});
		});

	// RESOURCES

		// Set a static folder
		app.use(express.static(path.join(__dirname, 'public')));

// API REQUESTS

	app.use('/qr/:str', (req, res) => {
		res.set('Cache-Control', 'public, max-age=7776000'); // 90 days

		var qr = require('qr-image');
	  var code = qr.image(req.params.str, { type: 'png', margin: 0, size: 7, ec_level: 'Q'});
	  code.pipe(res);
	});

	app.use('/pdf/', require('./src/routes/pdf.js'));

	app.use(express.json());
	app.use('/polls', require('./src/routes/polls.js'))

// HYBRID

		// Vote
		app.use(['/v/', '/vote/'], require('./src/routes/vote.js'));

	// Assuming nothing else responded --> 404
	app.use((req, res) => {
		res.render('pages/errors', {language: req.languageData.errors, uri: req.protocol + '://' + req.get('host') + '/', errorCode: 404});
	});


// Starting the server
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => console.log(`Server started on port ${PORT}`));
