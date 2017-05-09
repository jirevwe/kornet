let word  = '<img class="icon icons8-Microsoft-Word" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAC3UlEQVRoQ+1ZPWhTURQ+J5KIhKcIQqvQDs1krUnf4FCjoINE/EGxU1FaR42jIHYSJ4vgmrqIVCoFsSj4g8HBQauDk63opIV2sZOozST0ynfhxJvHq7yXl/bm1XcgkPuTm+875/vOhfeYYh4cc/yUELBdwaQCG7QCijeXJnPpFeUqXnFTxP2KlbtcPb+z1YSjS2jPg0x2V62XUuyyYpeYXCZVIGLHC/ZXdST6/3kODXdg8Y7jbEkXVEq5zMpVilxi7mWiTJDMriuB7KG7nSqTcjeR6lfMLhMBcI65+da7rgSc0oQKktUwe3acOhNm+9+9iubmLzl5vx+vKqG2IkBE82XHF2tCIIwmmpZQUoEwaf7H3p8vhkOd1DO+XN/fFh6wQmBvz3aaqZzUmbgx+UF/JDCPdcTWo/fq86PnCoTPj9pv6hqcqs9b84Bk7v7LL3Tx1kwdkJnRY1eq9GZ2Sa9NXTtMxwe69BjzEtYIPL9ZogP5jgZAGGNeAsRAECGV8VbMioQAaOzCPiqf3t0gFYwxL1F5/Jmu3n6vhwJ06PorevZu0bdiQdzcMhOfPZKj8ctF/Z99I9O0sFRrkIlZHdMzste6hExQovWPE4PU3ZHVnhByMDK0Dw94DQwS1jxgygK6rjz6RIvTQxpk3/BD/R1RLD+hE/u7dQfyGtg8I4h8sKdlEsJhYmQY9enbBZ1lASnVgOZBAJLzGtg6ATEyQL+e/aazLCClbWJ8MN+pO5bZVq17AABMI4MEQEqXkYtL5rEfFxgkZoZVD5hGnvv6Xd/A0mXkThAC6FJY84a1e0CAwKzbsmk9NLsM5sTIWEPvR3XajoAYGcC8XUaMjDU/A1tvowAgWvcDKUbGmp+B24JA0P692j7rHvjvCVhto1GzvyE8kFTARwbxeLDVzKPF2D/c9TVtnB6vB+46sXrBEZhVnF4xBSa1NhvDvWJaGwyRTk0IREpfC36cVKAFSYx0xB/2RspApSTuHgAAAABJRU5ErkJggg==" width="24" height="24">';
let pdf   = '<img class="icon icons8-PDF" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACgElEQVRoQ+2ZPWhTURTH/4FOFbuUQEEhwU7JVmipk04KrXZqocVFahdbal38yCB+FJeoS9rSdmroImpjp7ZCOjWlYGkHF9OpQSGiGLIoOhUify6XF0M+fPe9m5sn70AgIe+9e37n/M859yYBeNwCHvcf/z9AafRcSUuWSngSeJN77PTZDTOgBaCzCyh+A1yAMAJw8iiFtoVpVyDMAMztAcWvrkCYA6D4XYAwC+AChHkAhxCtAeAAonUAFCFaC0ABovUAKiACr3N1fTQCYGf74ANo2QvZSIGfAaUMhCLA5DPgVAeQmgN23tqI+d+XmsnAfAYInrE8uXUBKHxRgjAD8OpYOJvdB6L9wOw18V7BzACsfADaTwOfjwDKyXMAd5aB3ktWvD0HMDAOXH9gAYx1K4hH3GJGQpTPwq6QEbXPDCiaGQA6yzZ6cRj4lAViQ4rum8oA3S1vpatPgXdJJQgzGWDniW8Av38KGf36AcSuKs0CMwBSPox68KzoSJQSa4FQNqz5AIw45cNtBCcwox/fFJM5+x5YSwDhqAALR4DveVHomfWqWM0HGLkNjMxY3Ydy4ue+y/XjzmyxViqs+QByCjPajDJftaz8GmZqoscwgIx+uRvcxB2mgY/7QkKDN0RGKu1wG3hx0xAAi5STV0abhXqQBraSYj9UaayHUFTUAq2Qr7nl1ish6puOR89bLjKSi3dtd5taKtMHQOcfvhTdRhojf/+KUr9vPoCctNS4PLws3XN0+qoGoS8DstvIVXl0TCVsjKh/u1QfAAt36rkYVCxWxb1OIwx9AI1Wdul7H0DpZxWXos/H+BnwM+BQTo4l5HB97bc3/H9AuwcOF/A8wB+d9INAMLOO9wAAAABJRU5ErkJggg==" width="24" height="24">';
let csv   = '<img class="icon icons8-CSV" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAC/0lEQVRoQ+2Z/0sTcRjH3wNPuhNukoO28IzNctZmX0ArZWjkzEiEfsj/x/6F+jf6IdCyCAlBXBSisQ1USrEFGmyBgzxpwuJ57LPmNpxu9/Fm3P1yu92Xz/v13Pv9fG43F8744jrj+vH/A4y/fpGXcZfy+fzT6bGJyXqvXfUOyAA4f07Fzz0TVkDYAjDZG8GzxKIlELYAPI+MILNnWgJhGwB53woIWwGsgLAdoF6IhgCoB6JhAGqFaCiAWiAaDqAUYurRkyM12gJwkscHB0DGs5BzB4oq4GTgJHao5VgnxE6Ia/FN0TnSLLS1vYVkIg7T3OXh/IEAgleuQmlWeHt1dQVrayv8WVU1BLuCMDou4dPHD9j+sY2urm4Eg928P/VtE8ufl6CqKqLR0UPIUgDS6TRisXk0NTXB6/Mhk07DNM2CqPX1L0gmEyzI672IVGoT+/v7GB4e4WNJbFubBwMDERabSMSxsfEVfn8nwuEe+QCiijdv3OKq5n7n8ObtK650NPoACwvzyGTS6O+PwOPxFARS1Q3DwOzsOxY5Pv6Y13Nz75HN7qC37w58Xp98gFKBwjK0JlssLS/ieyoFo70DoVBPwVZCmRA8OHgPmtrC8MVAxQRSLDQ19ZLHEBUuzenu7i+uKtlGURS2RsDfWQARlgmFwtD1Vraj94IXfbfvlkXeFgBSQbZaXVsp+F/XdQwN3WeBIkMkWne3ctgJJhC4fDoAlSxEolwucDiLPxPIQmyePS4yQypnZqahKM3QNI3zQgHXtJbTARAhFqH7F+KDNkjiyD4PR8fYNsIyxa1TXOOgzZa3T0EixULCAuTvdsNAdifLVRRtUAimu6G7dQ50LpcDhdbtbj3U+2mjUvuUCiAmn0QyzpWmhUDC165zxYX/qbfTQvMF+VtMXPQdBV2000rtUzqAGIDEitm3zMB/w3zU/krnSG+j1Qa1cr+UDFgpsNq1HADn90A1j1TZ71jIsZBjIeflrpw/uo/rrLq70HEHsuu4qu9G7RJ23HHPPMAfHrQ7T7VqNrwAAAAASUVORK5CYII=" width="24" height="24">';
let excel = '<img class="icon icons8-Microsoft-Excel" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAACr0lEQVRoQ+2ZMUwTURjH/98pTQebOKIDMSGxpk2Aqy5udqyKsYsG3NSAMhlJ2Boau5nQOKGSqJNoGAQFw1g3BwGjLOqii+hIgoMxps98V+98XK+ldy28d+be0vbuvev/933/73uXO0LIB4VcPyIA1RmMMvC/ZoBSk5nefb+rJhGZgjAAkLleWjvUaeC2LZQupmP41ZUyDMMEhEkgUwD9REi4xb4vrbX9f+5r+rpgciKZ2N8V7ycyLKEEwdFNESjWSmT3FCBdTHcb1ZgpqmKABXN0IdBLRL6gZbA9BegrZEQrUfUzpyfT42e6M1dArL/MP+/zWtwwmjoBsPCl/IKn1gjAjyeCWijKgJ8oN5v77taqc3pwIW99Xzw/33CJPUebDCgFuHRyGBO5cSdahfkiXrxddH4n4gewfHMJiXhtA769PIXHr2e3RVcpACthgYcP1m5nvm5u4HR50BHIcAzJ4+P3T7gwPVRnDeVFfOLIcTy4POMIu/JwBCtfVi0ohrOHfdxNoByABd0ZnkL22ClL25vPK7j6aBSlfBHnzFo22FZsL6+h3EIsyh1tFssAPLZ+/kCufMb61BaAhV3PjuJaduSv6K2mhSuDaJEBFsQdZ27sqVPQzQpXBtCiBmwAuWV6dSUvC2kDILfMjc1vTibuVWZwt3Lf0/98UAsLya2Ui7XwbNLqTPbIlc+CobQtYnkzsyPOewODya1VS4Dt3edfy3RvcDdmx1H58KqOQWkNJLuPYm7siSPK7Xd5M+PbjIvTQ3X7gVIA2Sbscfa6PNwbHN/I8Q2dlvtAwzazwwktulBQ8dq00XYAlNZAO8LttRGARxSj50J+rBXUQoEeLYb+4a5XZEP1eL1Va4TqBUerUADC84rJB9SuTA38tmVX1AS4aAQQIGgdXRJloKPhDHCxP336lkC882iaAAAAAElFTkSuQmCC" width="24" height="24">';


function refresh(){
	$.get('http://localhost:3000/mail/r/inbox');
	$.get('http://localhost:3000/mail/r/sent');
	$.get('http://localhost:3000/mail/r/drafts');
	$.get('http://localhost:3000/mail/r/trash');
}

function getDrafts(){
	let xhr = $.get('http://localhost:3000/mail/q/drafts', function(mails){
		let div = $('#messages');
		let content = '';
		for (let i = 0;i < mails.length;i++){
			content += '<a href="/mail/edit/' + mails[i]._id +'" class="list-group-item">';
			content += '<h4 class="list-group-item-heading">' + mails[i].subject +'</h4>'
			content += '<p class="list-group-item-text">To: ' + mails[i].to.text +'</p>'
			content += '<p class="list-group-item-text">Date: ' + mails[i].date +'</p>'
			content += '</a>'
		}
		if(content == '') div.html('<h3>Nothing to see here... go away</h3>')
		else div.html(content);
		xhr.abort();
	});
}

function getTrash(){
	let xhr = $.get('http://localhost:3000/mail/q/trash', function(mails){
		let div = $('#messages');
		let content = '';
		for (let i = 0;i < mails.length;i++){
			content += '<a href="/mail/trash/' + mails[i]._id +'" class="list-group-item">';
			content += '<h4 class="list-group-item-heading">' + mails[i].subject +'</h4>'

			if(mails[i].mailbox == 'Inbox') content += '<p class="list-group-item-text">From: ' + mails[i].from.text +'</p>'
			else if(mails[i].mailbox == 'Sent') content += '<p class="list-group-item-text">To: ' + mails[i].to.text +'</p>'
			
			content += '<p class="list-group-item-text">Date: ' + mails[i].date +'</p>'
			content += '</a>'
		}

		if(content == '') div.html('<h3>Nothing to see here... go away</h3>')
		else div.html(content);
		xhr.abort();
	});
}

function getInbox(){
	let xhr = $.get('http://localhost:3000/mail/q/inbox', function(mails){
		let div = $('#messages');
		let content = '<ul class="collapsible popout" data-collapsible="accordion">';
		for (let i = 0;i < mails.length;i++){
			content += '<li>';
			content += mails[i].has_attachments ? '<div class="msg collapsible-header msg--has-attachment">' :  '<div class="msg collapsible-header">';
							content += '<div class="msg__left">'+
								'<div class="msg__avatar">'+
									'<div class="avatar avatar--sm" style="background-color: #eee; background-image: url(https://unsplash.it/50/50/?random)"></div>'+
								'</div>'+
								'<span class="msg__sender">' + mails[i].from.text +'</span>'+
								'<span class="msg__subject">' + mails[i].subject +'</span>'+
								'<span class="msg__snippet">' + mails[i].text +'</span>'+
								'<span><img class="msg__attachment-icon" src="/img/icons/inbox/attachment.svg" alt=""></span>'+
							'</div>'+
							'<div class="msg__right">'+
								'<span class="msg__select"><input type="checkbox"></span>'+
								'<span class="msg__favorite-icon"><img src="/img/icons/inbox/favorite.svg" alt=""></span>'+
							'</div>'+
						'</div>'+
						'<div class="collapsible-body"><span>' + mails[i].text +'</span></div>'+
					'</li>';
		}
		content += '</ul>';
		div.html(content);
		xhr.abort();
	});
}

function getSent(){
	let xhr = $.get('http://localhost:3000/mail/q/sent', function(mails){
		let div = $('#messages');
		let content = '';
		for (let i = 0;i < mails.length;i++){
			content += '<a href="/mail/' + mails[i]._id +'" class="list-group-item">';
			content += '<h4 class="list-group-item-heading">' + mails[i].subject +'</h4>'
			content += '<p class="list-group-item-text">To: ' + mails[i].to.text +'</p>'
			content += '<p class="list-group-item-text">Date: ' + mails[i].date +'</p>'
			content += '</a>'
		}
		if(content == '') div.html('<h3>Nothing to see here... go away</h3>')
		else div.html(content);
		xhr.abort();
	});
}

function dateFormat(date) {
	return moment(date).format('MMMM Do YYYY, h:mm:ss a');
}

function getTransaction(){
	let xhr = $.get('http://localhost:3000/wallet/t/all', function(transactions){
		let div = $('#table-body');
		let content = '';
		for (let i = 0;i < transactions.length;i++){
			content += '<tr><td>' + transactions[i].reference + '</td>'
			if (transactions[i].transaction_type == 0){
				content += '<td>Bank -> Wallet</td>';
			}
			else if (transactions[i].transaction_type == 1){
				content += '<td>Wallet -> Wallet</td>';
			}
			else if (transactions[i].transaction_type == 2){
				content += '<td>Wallet -> Bank</td>';
			}
			content += '<td>' + transactions[i].amount + '</td>';
			content += '<td>' + dateFormat(transactions[i].paid_at) + '</td></tr>';
		}
		div.html(content);
		let datatableoptions = {
			'paging': true,
			'pageLength': 10,
			'lengthChange': true,
			'searching': true,
			'ordering': true,
			'info': true,
			'autoWidth': false,
			dom: 'Bfrtip',
			buttons: [
				'copy', 'csv', 'pdf'
			]
		};
		$('#wallet-table').DataTable(datatableoptions);
		xhr.abort();
	});
}

Array.prototype.indexOf || (Array.prototype.indexOf = function(d, e) {
	var a;
	if (null == this) throw new TypeError('"this" is null or not defined');
	var c = Object(this),
		b = c.length >>> 0;
	if (0 === b) return -1;
	a = +e || 0;
	Infinity === Math.abs(a) && (a = 0);
	if (a >= b) return -1;
	for (a = Math.max(0 <= a ? a : b - Math.abs(a), 0); a < b;) {
		if (a in c && c[a] === d) return a;
		a++
	}
	return -1;
});

String.prototype.getExtension = function() {
	var basename = this.split(/[\\/]/).pop(),  // extract file name from full path ...
											// (supports `\\` and `/` separators)
		pos = basename.lastIndexOf('.');       // get last position of `.`

	if (basename === '' || pos < 1)            // if file name is empty or ...
		return '';                             //  `.` not found (-1) or comes first (0)

	return basename.slice(pos + 1);            // extract extension ignoring `.`
};