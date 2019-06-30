// Index.js
// (c) 2019 - Cescon Francesco

const express = require("express");
const path = require("path");

const app = express();

// LANGUAGE MIDDLEWARE
const languageSelector = (req, res, next) => {
	var lang = req.acceptsLanguages('en', 'it');
	if (!lang) {
		lang = 'en';
	}

	req.languageData = require('./src/languages/'+lang+'.json');
	next();
}
app.use(languageSelector);

// GET REQUESTS

	// PAGES

		// set the view engine to ejs
		app.set('view engine', 'ejs');

		app.get(['/', '/index.html', 'index.php'], (req, res) => {
			res.render('pages/index', {language: req.languageData.index});
		})


		// Results
		app.get(['/r/:id', '/results/:id'], (req, res) => {

			var pollData = {
				id: req.params.id,
				language: req.languageData.results
			};

			res.render('pages/results', pollData);
		})

	// RESOURCES

		app.get('/assets/js/newPoll.js', (req, res) => {
			res.render('js/newPoll', {language: req.languageData.newPolljs});
		})
		app.get('/assets/js/submitPoll.js', (req, res) => {
			res.render('js/submitPoll', {language: req.languageData.submitPolljs});
		})

		// Set a static folder
		app.use(express.static(path.join(__dirname, 'public')));

// API REQUESTS

	app.use(express.json());
	app.use('/polls', require('./src/routes/polls.js'))

// HYBRID

		// Vote
		app.use(['/v/', '/vote/'], require('./src/routes/vote.js'));

// Starting the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
