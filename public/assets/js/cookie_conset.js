var cookies = document.cookie.split(';');
var showPopUp = true;
for (var v in cookies) {
	if (cookies[v] == "cookie_conset=yes") {
		showPopUp = false;
		break;
	}
}
if (showPopUp) {
	var toastHTML = `
		<div class="container-fluid">
			<div class="row title-bar">
				<div class="col-auto icon"></div>
				<div class="col title"></div>
			</div>
			<div class="row content-bar">
				<div class="col content">
					<div>
						This website uses cookies 🍪 to enhance your browsing experience 😄.
					</div>
					<button onclick="dismissCookieConset(this)">I agree 👌</button>
				</div>
			</div>
		</div>
	`;

	var toastElement = document.createElement('div');
	toastElement.innerHTML = toastHTML;
	toastElement.classList.add("toast");
	toastElement.classList.add("toast-cookie");

	var body = document.querySelector('body');
	body.appendChild(toastElement);

	setTimeout(() => {
		toastElement.classList.add('show');
	}, 10);

	function dismissCookieConset(o) {
		var itemToRemove = o.parentElement.parentElement.parentElement.parentElement;
		itemToRemove.classList.remove('show');

		var d = new Date();
	  d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
		document.cookie = "cookie_conset=yes; expires="+d.toUTCString()+"; path=/";

		setTimeout(() => {
			itemToRemove.parentElement.removeChild(itemToRemove);
		}, 250)
	}

}
