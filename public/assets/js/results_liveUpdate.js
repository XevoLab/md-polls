/**
 * @Filename:     results_liveUpdate.js
 * @Date:         Xevolab <francesco> @ 2019-11-27 15:25:44
 * @Last edit by: francesco
 * @Last edit at: 2020-03-22 21:29:17
 * @Copyright:    (c) 2019
 */

var pollID = document.querySelector("body").attributes["id"].value;

// Show result bars
function makeBars() {
	var pollData = JSON.parse(document.querySelector("data").innerText);

	var total = 0, maxVotes = 0;
	for (var i = 0; i < pollData.length; i++) {
		total += parseInt(pollData[i].M.votes.N);
		if (parseInt(pollData[i].M.votes.N) > maxVotes)
			maxVotes = parseInt(pollData[i].M.votes.N);
	}

	var barsTable = document.querySelector("table.results");
	barsTable.innerHTML = "";

	for (var i = 0; i < pollData.length; i++) {
		var r = pollData[i].M;
		var rowHtml = `
		<tr id="choice_${ r.id.N }" choiceI="${ r.id.N }" delta="${(maxVotes == 0 ? -1 : maxVotes-r.votes.N)}">
			<td class="value">
				<div class="text" style="width: ${ (total != 0 ? Math.floor((r.votes.N/total)/(maxVotes/total)*100) : 0) }%;">
					<span>${ r.value.S }</span>
				</div>

				<div class="bg" >${ r.value.S }</div>
			</td>
			<td class="votes" onclick="swapNumberPerc()" title="${ language.swap_number_percentage }">
				<span class="votes-number">
					<span class="n">${ r.votes.N }</span>
						${ (r.metadata.M.limitAnswers.N != 0) ? " / "+r.metadata.M.limitAnswers.N : "" }
				</span>
				<span class="votes-percentage">
					${ (total != 0 ? Math.floor(r.votes.N/total*100) : 0) }%
				</span>
			</td>
		</tr>`;
		barsTable.innerHTML = barsTable.innerHTML + rowHtml;
	}
}

makeBars();

// Socket.io & live updates

var socket = io(window.location.origin+"?pollID="+encodeURIComponent(pollID));

socket.on('vote', function(vdata){

	var pollData = JSON.parse(document.querySelector("data").innerText);

	for (var i = 0; i < pollData.length; i++) {
		if (pollData[i].M.id.N == vdata.plus || pollData[i].M.id.N == vdata.minus)
			pollData[i].M.votes.N = parseInt(pollData[i].M.votes.N) + (pollData[i].M.id.N == vdata.plus ? +1 : -1);
	}
	pollData.sort(function (a, b) {return b.M.votes.N - a.M.votes.N});
	document.querySelector("data").innerText = JSON.stringify(pollData)
	makeBars();

});
