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
