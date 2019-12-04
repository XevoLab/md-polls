/**
 * @Filename:     submitPoll.js
 * @Date:         Xevolab <francesco> @ 2019-12-01 20:50:03
 * @Last edit by: francesco
 * @Last edit at: 2019-12-03 09:33:21
 * @Copyright:    (c) 2019
 */

var pollID = document.querySelector("form").attributes["id"].value;

var socket = io(window.location.origin+"?pollID="+encodeURIComponent(pollID));

var select = document.querySelectorAll('input[type="radio"]');
for (var i=0; i<select.length; i++) {
  select[i].onclick = function() {
		document.querySelector('button[type="submit"]').classList.remove("disabled");
	};
}

var form = document.querySelector('form');
form.addEventListener('submit', function (e) {
	e.preventDefault();

	document.querySelector("button[type=submit]").classList.add("loading");

	var voteData = {};

	var selection = document.querySelectorAll("input:checked[name=choice]");
	if (selection.length !== 1) {
		document.querySelector("button[type=submit]").classList.remove("loading");
		toast("error", language.toast_no_answer);
		return false;
	}

	voteData.choice = selection[0].value;

	var name = document.querySelectorAll("input[name=name]");
	if (name.length === 1) {
		if (name[0].value === "") {
			document.querySelector("button[type=submit]").classList.remove("loading");
			toast("error", language.toast_empty_name);
			return false;
		}
		else {
			voteData.name = name[0].value;
		}
	}

	var xhr = new XMLHttpRequest();
	xhr.onload = function () {
		document.querySelector("button[type=submit]").classList.remove("loading");

		if (xhr.readyState == 4 && xhr.status == 200) {
			var res = JSON.parse(xhr.response);
			if (res.result === "success") {
				sendSocketMessage();

				toast("success", language.toast_success_vote);
				setTimeout(() => {
					window.location.href = '/r/'+document.querySelector("form").attributes["id"].value;
				}, 1000);
				return true;
			}
			else if (res.result === "full") {
				toast("warning", language.toast_full_choice);
				return false;
			}
			else if (res.result === "alreadyVoted") {
				toast("warning", language.toast_already_voted);
				return false;
			}
			else {
				toast("error", language.toast_generic_error);
				return false;
			}
		}
		else {
			toast("error", language.toast_generic_error);
			return false;
		}
	}
	xhr.onerror = function () {
		document.querySelector("button[type=submit]").classList.remove("loading");
		toast("error", language.toast_generic_error);
		return false;
	}
	xhr.open('POST', '/vote/'+pollID);
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.send(JSON.stringify(voteData));

}, false);

function sendSocketMessage() {
	var pollID = document.querySelector("form").attributes["id"].value;
	var selection = document.querySelectorAll("input:checked[name=choice]")[0].value;
	var name = document.querySelectorAll("input[name=name]");
	if (name.length === 1) {
		name = name[0].value;
	}
	else {
		name = null;
	}
}

// --- ---

socket.on('vote', function(vdata){

	var number = document.querySelectorAll('.choice')[vdata.selection].querySelector(".limit .n");

	number.innerHTML = parseInt(number.innerHTML) - 1;

	if (number.innerHTML == 0) {
		document.querySelectorAll('.choice')[vdata.selection].classList.add("disabled");
	}

});
