function toast(type, content) {
	var toastHTML = `
		<div class="container-fluid">
			<div class="row title-bar">
				<div class="col-auto icon"></div>
				<div class="col title"></div>
				<div class="col-auto dismiss" title="Dismiss alert" onclick="dismissToast(this)">
					<i class="fas fa-trash"></i>
				</div>
			</div>
			<div class="row content-bar">
				<div class="col content ${(type==="qr" ? "text-center" : null)}">
					${content}
				</div>
			</div>
		</div>
	`;

	var toastElement = document.createElement('div');
	toastElement.innerHTML = toastHTML;
	toastElement.classList.add("toast");
	toastElement.classList.add('toast-'+type);

	var body = document.querySelector('body');
	body.appendChild(toastElement);

	setTimeout(() => {
		toastElement.classList.add('show');
	}, 10)

	if (type != "qr") {
		setTimeout(() => {
			toastElement.classList.remove('show');

			setTimeout(() => {
				toastElement.parentElement.removeChild(toastElement);
			}, 250)
		}, 4500);
	}
}
function dismissToast(o) {
	var itemToRemove = o.parentElement.parentElement.parentElement;
	itemToRemove.classList.remove('show');

	setTimeout(() => {
		itemToRemove.parentElement.removeChild(itemToRemove);
	}, 250)
}
