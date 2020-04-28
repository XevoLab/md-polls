/**
 * @Author: francesco
 * @Date:   2020-04-18T01:20:35+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-04-28T21:40:37+02:00
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

//clickedToggle

var form = document.querySelector('form');
function handleForm(e) {
	if (e != null)
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

}
form.addEventListener('submit', handleForm, false);

var keysHistory = "";
var labs_enabled = false;
function enableLabs() {
	var text = document.createElement('div');
	text.innerHTML = `<span>Labs!</span> were enabled, yay! Enjoy all of our cool experimental features <style>
		.labs span {
			display: inline;
			position: relative;
			font: 30px Helvetica, Sans-Serif;
			letter-spacing: -4px;
			color: #00249C;
			margin-right: 5px;
		}

		.labs span:after {
			content: "Labs!";
			position: absolute; left: 3px; top: 1.5px;
			color: #EE3830;
		}
	</style>`
	text.className = "col-auto labs"
	document.querySelector("nav > .row").insertBefore(text, document.querySelector("nav > .row > *:last-child"))

	var d = new Date();
  d.setTime(d.getTime() + (10*60*1000));
  var expires = "expires="+ d.toUTCString();
	document.cookie = "showRecents=yes; expires="+ d.toUTCString()+"; path=/";
}

document.onkeydown = function () {
	var evtobj = window.event? event : e
	if (evtobj.keyCode == 13 && (event.metaKey || event.ctrlKey)) {
		handleForm();
	}
	else if (evtobj.keyCode >= 65 && evtobj.keyCode <= 90 && !labs_enabled) {
		keysHistory = keysHistory + "" + evtobj.key;
		if (keysHistory.toLowerCase().includes("ilamponiacavallo")) {
			labs_enabled = true;
			enableLabs();
		}
	}
};

document.querySelectorAll(".options input").forEach(function(item) {
	item.addEventListener("change", function(e) {
		if (e.target.name === "preventDoubles" && !e.target.checked)
			document.querySelector(".options input#setting_enhancedPreventDoubles").checked = false;
		if (e.target.name === "enhancedPreventDoubles" && e.target.checked)
			document.querySelector(".options input#setting_preventDoubles").checked = true;

		if (e.target.name === "allowChange" && e.target.checked)
			document.querySelector(".options input#setting_collectNames").checked = false;
		if (e.target.name === "collectNames" && e.target.checked)
			document.querySelector(".options input#setting_allowChange").checked = false;
	})
})
