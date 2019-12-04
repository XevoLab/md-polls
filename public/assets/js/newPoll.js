/**
 * @Filename:     newPoll.ejs
 * @Date:         Francesco Cescon <francesco> @ 2019-11-27 15:25:44
 * @Last edit by: francesco
 * @Last edit at: 2019-12-03 16:13:30
 * @Copyright:    (c) 2019
 */


function adjustSize(o) {
	o.style.height = "1px";
	o.style.height = (o.scrollHeight)+"px";
}
function choiceEdit(o) {
	adjustSize(o);

	var lastTextArea = document.querySelector(".choices .choice:last-of-type .value textarea");
	if (lastTextArea.value != "") {
		addNewOption();
	}
}
function addNewOption() {
	var choices = document.querySelectorAll(".choices .choice");
	if (choices.length >= 25) {
		return false;
	}

	var choiceBoilerplate = document.querySelector("#choiceBoilerplate .choice").cloneNode(true);
	var currentChoices = document.querySelector(".choices .col");

	currentChoices.appendChild(choiceBoilerplate);
}
function removeChoice(o) {
	var itemToRemove = o.parentElement;

	itemToRemove.parentElement.removeChild(itemToRemove);
}
function disableMaxAnswers(o) {
	if (o.value == 0) {
		o.value = "";
	}
}

//clickedToggle

var form = document.querySelector('form');

form.addEventListener('submit', function (e) {
	e.preventDefault();

	var choices = document.querySelectorAll(".choices .choice");
	var validChoicesLength = 0;
	for (var i = 0; i < choices.length; i++) {
		if (choices[i].querySelector('.value textarea').value !== "") {
			validChoicesLength ++;
		}
	}

	if (validChoicesLength == 0) {
		toast("error", language.toast_not_enough_answers);
		return false;
	}
	else if (validChoicesLength > 25) {
		toast("error", language.toast_too_many_answers);
		return false;
	}

	document.querySelector("button[type=submit]").classList.add("loading");

	var pollData = {
		title: document.querySelector("textarea.title").value,
		metadata: {},
		options: []
	};

	var pollMeta = document.querySelectorAll(".options input");
	for (var j = 0; j < pollMeta.length; j++) {
		if (pollMeta[j].attributes["type"].value == "checkbox") {
			pollData.metadata[pollMeta[j].attributes["name"].value] = pollMeta[j].checked;
		}
		else {
			pollData.metadata[pollMeta[j].attributes["name"].value] = pollMeta[j].value;
		}
	}

	for (var i = 0; i < choices.length; i++) {
		var singleOption = {
			value: choices[i].querySelector('.value textarea').value,
			metadata: {}
		}

		var choiceMeta = choices[i].querySelectorAll(".meta input");
		/*for (var j = 0; j < choiceMeta.length; j++) {
			singleOption.metadata[choiceMeta[j].attributes["name"].value] = choiceMeta[j].value;
		}*/

		pollData.options.push(singleOption);
	}

	var xhr = new XMLHttpRequest();
	xhr.onload = function () {
		document.querySelector("button[type=submit]").classList.remove("loading");

		try {
			var res = JSON.parse(xhr.response);
		} catch (e) {
			var res = {result: 'error'};
		}

		if (xhr.readyState == 4 && xhr.status == 200 && res.result === 'success') {
			toast("success", language.toast_success_poll);
			setTimeout(() => {
				window.location.href = '/v/'+res.ID;
			}, 1000)
		}
		else {
			toast("error", language.toast_generic_error);
		}
	}
	xhr.onerror = function () {
		document.querySelector("button[type=submit]").classList.remove("loading");
		toast("error", language.toast_generic_error);
	}
	xhr.open('POST', '/polls/');
	xhr.setRequestHeader('Content-type', 'application/json');

	xhr.send(JSON.stringify(pollData));

}, false);

document.onkeydown = function () {
	var evtobj = window.event? event : e
	if (evtobj.keyCode == 13 && (event.metaKey || event.ctrlKey)) {
		console.log("enter");
		form.submit();
	}
};
