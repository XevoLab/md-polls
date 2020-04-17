/**
 * @Author: francesco
 * @Date:   2020-04-17T21:37:05+02:00
 * @Last modified by:   francesco
 * @Last modified time: 2020-04-17T23:15:31+02:00
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
			var d = new Date(0);
			d.setUTCMilliseconds(res[i].created);
			var recHTML = `
				<a href="/r/${res[i].id}">
					<div class="rec-content">
						<div class="tit">${res[i].title}</div>
						<div class="data">${d.getDate()} ${language.recents_months[d.getMonth()]} ${d.getFullYear()} - ${res[i].votesCount} ${language.recents_votes}</div>
					</div>
				</a>
			`;

			var recElement = document.createElement('div');
			recElement.innerHTML = recHTML;
			recElement.classList.add("rec-item");

			var recContainer = document.querySelector('.recents .col');
			recContainer.appendChild(recElement);
		}
	}
}
xhr.onerror = function () {}
xhr.open('GET', '/rec/');
xhr.send();
