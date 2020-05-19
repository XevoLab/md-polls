/**
 * @Author: francesco
 * @Date:   2020-05-19T21:33:58+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-05-19T23:25:50+02:00
 */

var pollData = JSON.parse(document.querySelector("script#data").innerHTML);
var pollID = pollData.ID;

// Enable submit and check number of answers
var choices = document.querySelectorAll('input[name="choice"]');
var selHist = [];
document.querySelectorAll("input:checked[name=choice]").forEach((item, i) => selHist.push(item));

for (var i=0; i<choices.length; i++) {
  choices[i].onclick = function(e) {
    if (e.target.checked) {
      selHist.push(e.target);

      if (pollData.metadata.maxOptions === 1 && selHist.length > 1) {
        selHist[0].checked = false;
        selHist.shift();
      }
      else if (selHist.length > pollData.metadata.maxOptions) {
        selHist.pop();
        e.target.checked = false;
      }
    }
    else {
      selHist = [];
      document.querySelectorAll("input:checked[name=choice]").forEach((item, i) => selHist.push(item));
    }

    if (selHist.length >= pollData.metadata.minOptions)
      document.querySelector('button[type="submit"]').classList.remove("disabled");
    else
      document.querySelector('button[type="submit"]').classList.add("disabled");
	};
}


var form = document.querySelector('form');
form.addEventListener('submit', function (e) {
	e.preventDefault();

	document.querySelector("button[type=submit]").classList.add("loading");

	var voteData = {};

	var selection = document.querySelectorAll("input:checked[name=choice]");
	if (selection.length === 0) {
		document.querySelector("button[type=submit]").classList.remove("loading");
		toast("error", language.toast_no_answer);
		return false;
	}

	voteData.choices = [];
  selection.forEach((e, i) => voteData.choices.push(e.value))

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
					window.location.href = `/r/${pollID}?k=${res.k}`;
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

var socket = io(window.location.origin+"?pollID="+encodeURIComponent(pollID));
socket.on('vote', function(vdata){

  for (var i in vdata.plus) {
    var number = document.querySelectorAll('.choice')[vdata.plus[i]].querySelector(".limit .n");
  	number.innerHTML = parseInt(number.innerHTML) - 1;

  	if (number.innerHTML == 0)
  		document.querySelectorAll('.choice')[vdata.plus[i]].classList.add("disabled");
  }

});
