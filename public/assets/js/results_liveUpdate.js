/**
 * @Filename:     results_liveUpdate.js
 * @Date:         Xevolab <francesco> @ 2019-11-27 15:25:44
 * @Last edit by: francesco
 * @Last edit at: 2019-12-04 21:11:37
 * @Copyright:    (c) 2019
 */

var pollID = document.querySelector("body").attributes["id"].value;

var socket = io(window.location.origin+"?pollID="+encodeURIComponent(pollID));

socket.on('vote', function(vdata){

	var numOptions = document.querySelectorAll('table.results tr').length;

	// Update number on choice
	var optionValue = document.querySelector('tr#choice_'+vdata.selection+' .votes .n');
	optionValue.innerHTML = parseInt(optionValue.innerHTML) + 1;

	// Update bars

		// Total number of votes
	var total = 0;
	for (var i = 0; i < numOptions; i++) {
		total += parseInt(document.querySelector('tr#choice_'+i+' .votes .n').innerHTML);
	}

	for (var i = 0; i < numOptions; i++) {
		var rowValue = parseInt(document.querySelector('tr#choice_'+i+' .votes .n').innerHTML);
		document.querySelector('tr#choice_'+i+' .value .text').style.width = Math.floor(rowValue/total*100)+'%';
	}

});
