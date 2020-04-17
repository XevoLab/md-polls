/**
 * @Author: francesco
 * @Date:   2020-04-17T21:37:05+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-04-17T21:44:12+02:00
 */



var xhr = new XMLHttpRequest();
xhr.onload = function () {

	try {
		var res = JSON.parse(xhr.response);
	} catch (e) {
		var res = [];
	}

	if (xhr.readyState == 4 && xhr.status == 200 && res.length > 0) {
		for (var i = 0; i < res.length; i++) {
			var recHTML = `
				<a href="#test">
					<div class="rec-content">
						<div class="tit">${res[i].title}</div>
						<div class="data">17/04/2020 14:05 - ${res[i].votesCount} ${language.recommendations_votes}</div>
					</div>
				</a>
			`;

			var recElement = document.createElement('div');
			recElement.innerHTML = recHTML;
			recElement.classList.add("rec-item")

			var recContainer = document.querySelector('.recommendations .col');
			recContainer.appendChild(recElement);
		}
	}
}
xhr.onerror = function () {}
xhr.open('GET', '/rec/');
xhr.send();
