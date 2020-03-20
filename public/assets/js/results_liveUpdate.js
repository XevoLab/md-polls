/**
 * @Filename:     results_liveUpdate.js
 * @Date:         Xevolab <francesco> @ 2019-11-27 15:25:44
 * @Last edit by: francesco
 * @Last edit at: 2020-03-04 22:33:28
 * @Copyright:    (c) 2019
 */

var pollID = document.querySelector("body").attributes["id"].value;

var socket = io(window.location.origin+"?pollID="+encodeURIComponent(pollID));

socket.on('vote', function(vdata){

	var options = document.querySelectorAll('table.results tr');
	var numOptions = options.length;

	// Update number on choice
	var optionPlusOne = document.querySelector('tr[choiceI="'+vdata.plus+'"] .votes .n');
	optionPlusOne.innerHTML = parseInt(optionPlusOne.innerHTML) + 1;

	if (vdata.minus !== null) {
		var optionMinusOne = document.querySelector('tr[choiceI='+vdata.minus+'] .votes .n');
		optionMinusOne.innerHTML = parseInt(optionMinusOne.innerHTML) - 1;
	}

	// Update bars

		// Reconstruct votes votes
	var total = 0;
	var q = [];
	for (var i = 0; i < numOptions; i++) {
		q.push({
			t: document.querySelector('tr[choiceI="'+i+'"] .value .text').innerText,
			n: parseInt(document.querySelector('tr[choiceI="'+i+'"] .votes .n').innerHTML)
		})
		total += parseInt(document.querySelector('tr[choiceI="'+i+'"] .votes .n').innerHTML);
	}
	q.sort(function (a, b) {return b.n - a.n});

	for (var i = 0; i < numOptions; i++) {
		options[i].setAttribute("index", (q[0].n - q[i].n));
		options[i].querySelector('.value .text').innerText = q[i].t;
		options[i].querySelector('.votes .n').innerText = q[i].n;
		options[i].querySelector('.value .text').style.width = Math.floor((q[i].n/total)/(q[0].n/total)*100)+'%';
	}

});
