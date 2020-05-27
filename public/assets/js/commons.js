/**
 * @Filename:     toast.js
 * @Date:         Xevolab <francesco> @ 2019-11-27 15:25:44
 * @Last edit by: francesco
 * @Last edit at: 2019-12-04 13:38:41
 * @Copyright:    (c) 2019
 */

function toast(type, content) {
	var toastHTML = `
		<div class="wrapper">
			<div class="container-fluid">
				<div class="row title-bar">
					<div class="col-auto icon"></div>
					<div class="col title"></div>
					<div class="col-auto dismiss" title="Dismiss alert" onclick="dismissToast(this)">
						<i class="icon-cancel"></i>
					</div>
				</div>
				<div class="row content-bar">
					<div class="col content ${(type==="qr" ? "text-center" : '')}">
						${(type==="qr" ? '<div class="qr-absolute">Loading...</div>' : '')}
						${content}
					</div>
				</div>
			</div>
		</div>
	`;

	var toastElement = document.createElement('div');
	toastElement.innerHTML = toastHTML;
	toastElement.classList.add("toast");
	toastElement.classList.add('toast-'+type);

	var body = document.querySelector('.toast-container');
	body.appendChild(toastElement);

	setTimeout(() => {
		toastElement.classList.add('show');
	}, 10)

	if (type != "qr") {
		setTimeout(() => {
			toastElement.classList.remove('show');

			setTimeout(() => {
				toastElement.parentElement.removeChild(toastElement);
			}, 160)
		}, 5000);
	}
}
function dismissToast(o) {
	var itemToRemove = o.parentElement.parentElement.parentElement.parentElement;
	itemToRemove.classList.remove('show');

	setTimeout(() => {
		itemToRemove.parentElement.removeChild(itemToRemove);
	}, 160)
}

var cookies = document.cookie.split(';');
var showPopUp = true;
for (var v in cookies) {
	if (cookies[v].trim() == "cookie_consent=yes" || cookies[v].trim() == "cookie_consent=no") {
		showPopUp = false;
		break;
	}
}
if (showPopUp) {
	var toastHTML = `
		<div class="wrapper">
			<div class="container-fluid">
				<div class="row title-bar">
					<div class="col-auto icon"></div>
					<div class="col title"></div>
				</div>
				<div class="row content-bar">
					<div class="col content">
						<div>
							${language.cookie_phrase}
						</div>
						<button onclick="dismissCookieConset(this, true)">${language.cookie_button}</button>
						<button onclick="dismissCookieConset(this, false)">${language.cookie_button_functional}</button>
					</div>
				</div>
			</div>
		</div>
	`;

	var toastElement = document.createElement('div');
	toastElement.innerHTML = toastHTML;
	toastElement.classList.add("toast");
	toastElement.classList.add("toast-cookie");

	var body = document.querySelector('.toast-container');
	body.appendChild(toastElement);

	setTimeout(() => {
		toastElement.classList.add('show');
	}, 10);

	function dismissCookieConset(o, c) {
		var itemToRemove = o.parentElement.parentElement.parentElement.parentElement.parentElement;
		itemToRemove.classList.remove('show');

		var d = new Date();
	  d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
		document.cookie = "cookie_consent="+(c ? "yes" : "no")+"; expires="+d.toUTCString()+"; path=/";

		setTimeout(() => {
			itemToRemove.parentElement.removeChild(itemToRemove);
		}, 250)
	}

}

function createCards(el, tx) {
	console.log(el, tx);

	if (!RegExp(/^((?:https?:\/\/)?[^./]+(?:\.[^./]+)+(?:\/.*)?)$/gi).test(tx))
		return false;

	var xhr = new XMLHttpRequest();
	xhr.elid = el.id;
	xhr.onload = function () {
		if (xhr.readyState == 4 && xhr.status == 200) {

			try {
				cardDt = JSON.parse(xhr.response);
			} catch (e) {
				console.error("Invlid JSON");
			}

			if (!cardDt.okay) return;

			let cardEl = document.querySelector(`#${xhr.elid} .card`);

			switch (cardDt.payload.mime.type) {
				case 'html':
					cardDt = cardDt.payload.card;
					if (cardDt == null) return;

					cardEl.innerHTML = `
						${
							cardDt.image != null ? `<div class="card-image-preview"><img src="${cardDt.image}" alt="${cardDt.image_alt || cardDt.site+" image"}" /></div>` : ''
						}
						<div>
							<div class="card-title">${cardDt.title || cardDt.site}</div>
							${
								cardDt.descr != null ? `<div class="card-description">${cardDt.descr.substr(0, 100) + (cardDt.descr.length > 100 ? "..." : "")}</div>` : ''
							}
							<div class="card-origin">${cardDt.site}</div>
						</div>
					`;
					break;
				case 'image':
					cardEl.innerHTML = `<div class="card-image"><img src="${cardDt.payload.request.uri}" alt="${cardDt.site}" /></div>`;
					break;
				default:
					return
			}

			document.querySelector(`#${xhr.elid} ._card-small-text`).classList.add("card-small-text");
			cardEl.classList.remove("hidden")

			//debugger;
		}
		else {
			console.error("Whoopies daisy");
			return false;
		}
	}
	xhr.onerror = function () {
		console.error("Whoopies");
		return false;
	}
	xhr.open('GET', "http://xevo-ambassador.herokuapp.com/v1?card&u="+encodeURIComponent(tx));

	xhr.send();

}
