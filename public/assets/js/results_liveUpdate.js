
var pollID = document.querySelector("body").attributes["id"].value;

var socket = io(window.location.origin+"?pollID="+encodeURIComponent(pollID));

socket.on('vote', function(vdata){

	var numOptions = document.querySelectorAll('tr.choice').length;

	// Update number on choice
	var optionValue = document.querySelector('tr#choice_'+vdata.selection+' .result .n');
	optionValue.innerHTML = parseInt(optionValue.innerHTML) + 1;

	// Update bars

		// Total number of votes
	var total = 0;
	for (var i = 0; i < numOptions; i++) {
		total += parseInt(document.querySelector('tr#choice_'+i+' .result .n').innerHTML);
	}

	for (var i = 0; i < numOptions; i++) {
		var rowValue = parseInt(document.querySelector('tr#choice_'+i+' .result .n').innerHTML);
		document.querySelector('tr#choice_'+i+' .percental-bar').style.width = Math.floor(rowValue/total*100)+'%';
	}

});
