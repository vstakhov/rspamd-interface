(function() { $(document).ready(function(){
// begin

	$.cookie.json = true;

	// supports session storage
	function supportsSessionStorage() {
		try {
			return 'sessionStorage' in window && window['sessionStorage'] !== null;
		} catch (e) {
			return false;
		}
		//return false;
	}

	// return password
	if (sessionState()) {
		if (!supportsSessionStorage()) {
			var password = $.cookie('rspamdpasswd');
		} else {
			var password = sessionStorage.getItem('Password');
		}
	}

	// return session state
	function sessionState() {
		if ( (supportsSessionStorage() && (sessionStorage.getItem('Password') !== null)) || (!supportsSessionStorage() && ($.cookie('rspamdsession')) !== null)) {
			return true
		} else {
			return false
		}
	}

	$(function(){
		var hash = window.location.hash;
		hash && $('a[href="' + hash + '"]').tab('show');
		$('a[data-toggle]').on('click',function (e) {
			$(this).tab('show');
			// var scrollmem = $('body').scrollTop();
			window.location.hash = this.hash;
			$('html,body').scrollTop(0);
		});
	});

	// detect session storate
	supportsSessionStorage();

	// request credentials
	function requestCredentials() {
		$.ajax({
			async: true,
			dataType: 'json',
			type: 'GET',
			url: '/rspamd/login',
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', password)
			},
			success: function(data) {
				if (data.auth === 'failed') {
					connectRSPAMD();
				}
			},
		});
		console.log('requestCredentials, sessionState: ' + sessionState() + ', Password: ' + password);
	}

	// save credentials
	function saveCredentials(data, password) {
		if (!supportsSessionStorage()) {
			$.cookie('rspamdsession', data, { expires: 1 }, { path: '/' });
			$.cookie('rspamdpasswd', password, { expires: 1 }, { path: '/' });
		} else {
			sessionStorage.setItem('Password', password);
			sessionStorage.setItem('Credentials', JSON.stringify(data));
			//$.each(data, function(i, item) {
			//	sessionStorage.setItem(i, item);
			//});
		}
	}

	// update credentials
	function saveMaps(data) {
		if (!supportsSessionStorage()) {
			$.cookie('rspamdmaps', data, { expires: 1 }, { path: '/' });
		} else {
			sessionStorage.setItem('Maps', JSON.stringify(data));
		}
		console.log('Maps saved');
	}

	// clean credentials
	function cleanCredentials() {
		if (!supportsSessionStorage()) {
			$.removeCookie('rspamdlogged');
			$.removeCookie('rspamdsession');
			$.removeCookie('rspamdpasswd');
		} else {
			sessionStorage.clear();
		}
	}

	// alert popover
	function alertMessage(alertState, alertText) {
		var alert = $('<div class="alert ' + alertState + '" style="display:none">' +
			'<button type="button" class="close" data-dismiss="alert" tutle="Dismiss">&times;</button>' +
			'<strong>' + alertText + '</strong>')
		.prependTo('body');
	$(alert).show();
	setTimeout(function() {
		$(alert).remove();
		}, 3600);
	}

	// connect to server
	function connectRSPAMD() {
		if (!sessionState()) {

			var dialog = $('#connectDialog');
			var backdrop = $('#backDrop');
			var ui = $('#mainUI');

			$(ui).hide();
			$(dialog).show();
			$(backdrop).show();
			$(document).on('submit', '#connectForm', function(e) {
				e.preventDefault();

				var password = $('#connectPassword').val();

				$.ajax({
					async: true,
					dataType: 'json',
					type: 'GET',
					url: '/rspamd/login',
					beforeSend: function (xhr) {
						xhr.setRequestHeader('Password', password)
					},
					success: function(data) {
						if (data.auth === 'failed') {
							$(form).each(function () {
								$('.control-group').addClass('error');
							});
						} else {
							saveCredentials(data, password);
							getMaps();
							console.log('connectRSPAMD, sessionState: ' + sessionState() + ', Password: ' + password);
							$(dialog).hide();
							$(backdrop).hide();
							$(ui).show();
						}
					},
					error:  function(data) {
						alertMessage('alert-modal alert-error', 'Oops, password is incorrect');
					},
					statusCode: {
						404: function() {
							alertMessage('alert-modal alert-error', 'Cannot login, host not found');
						}
					}
				});
			});
		}
	}


	// get maps id
	function getMaps() {


		var items = [];

		$('#listMaps').closest('.widget-box').hide();
		$.ajax({
			async: true,
			dataType: 'json',
			url: '/rspamd/maps',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Password', password)
				},
			error: function() {
				alertMessage('alert-error', 'Cannot receive maps data');
			},
			success: function(data) {
				saveMaps(data);
				$.each(data, function(i, item) {
					if ((item.editable == false)) {
						var caption = 'View';
						var label = '<span class="label">Read</span>';
					} else {
						var caption = 'Edit';
						var label = '<span class="label">Read</span>&nbsp;<span class="label label-success">Write</span>';
					}
					items.push(
						'<tr>' +
							'<td class="span2 maps-cell">' + label + '</td>' +
							'<td>' +
								'<span class="map-link" ' + 
								'data-source="#' + item.map + '" ' +
								'data-editable="' + item.editable + '" ' +
								'data-target="#modalDialog" ' +
								'data-title="' + item.description +
								'" data-toggle="modal">' + item.description + '</span>' +
							'</td>' +
						'</tr>');
				});
				$('<tbody/>', {
					html: items.join('')
				}).appendTo('#listMaps');
				$('#listMaps').closest('.widget-box').show();
			}
		});
	}

	// get map by id
	function getMapById() {

		if (!supportsSessionStorage()) {
			var data = $.cookie('rspamdmaps', data, { expires: 1 }, { path: '/' });
		} else {
			var data = JSON.parse(sessionStorage.getItem('Maps'));
		}

		$.each(data, function(i, item) {
			$.ajax({
				async: true,
				dataType: 'text',
				url: '/rspamd/getmap',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('Password', password),
					xhr.setRequestHeader('Map', item.map);
					},
				error: function() {
					alertMessage('alert-error', 'Cannot receive maps data');
				},
				success: function(text) {
					if ((item.editable == false)) {
						var disabled = 'disabled="disabled"';
					} else {
						var disabled = '';
				}
			$('<form class="form-horizontal" method="post "action="/rspamd/savemap" data-type="map" id="' + item.map + '" style="display:none">' + 
				'<textarea class="list-textarea"' + disabled + '>' + text + '</textarea>' + 
				'</form').appendTo('#modalBody');
			}})
		});
	}

	// show widgets
	function statWidgets() {

		var widgets = $('#statWidgets');

		requestCredentials();

		$(widgets).empty();
			if (!supportsSessionStorage()) {
				var data = $.cookie('rspamdsession');
			} else {
				var data = JSON.parse(sessionStorage.getItem('Credentials'));
			}

			$.each(data, function(i, item) {
				if (i == 'auth') {
					// none
				} else if (i == 'error') {
					// none
				} else if (i == 'version') {
					var widget = '<div class="left"><strong>' + item + '</strong>' + i + '</div>'
					$(widget).appendTo(widgets);
				} else if (i == 'uptime') {
					var widget = '<div class="right"><strong>' + item + '</strong>' + i + '</div>'
					$(widget).appendTo(widgets);
				} else {
					var widget = '<li class="stat-box"><div class="widget"><strong>' + item + '</strong>' + i + '</div></li>'
					$(widget).appendTo(widgets);
				}
			});
			$('#statWidgets .left,#statWidgets .right').wrapAll('<li class="stat-box pull-right"><div class="widget"></div></li>');
			$(widgets).show('slow');
		}

	// opem modal with target form enabled
	$(document).on('click', '[data-toggle="modal"]', function(e) {

		var source = $(this).data('source');
		var editable = $(this).data('editable');
		var title = $(this).data('title');
		var caption = $('#modalTitle').html(title);
		var body = $('#modalBody ' + source).show();
		var target = $(this).data('target');
		var progress = $(target + ' .progress').hide();

		$(target).modal(show=true,backdrop=true,keyboard=show);
		if (editable === false) {
			$('#modalSave').hide();
		} else {
			$('#modalSave').show();
			}

		console.log(source + ', ' + editable + ', ' + caption + ', ' + body + ', ' + target)

		return false;
	});

	//close modal without saving
	$(document).on('click', '[data-dismiss="modal"]', function(e) {
		$('#modalBody form').hide();
	});

	// get chart
	function getChart() {

		var data = (function() {
			var data = null;
			$.ajax({
				async: true,
				dataType: 'json',
				url: '/rspamd/pie',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('Password', password)
				},
				error: function() {
					alertMessage('alert-error', 'Cannot receive chart');
				},
				'success': function (data) {
					json = data;
				}
			});
			return data;
		})();

		var data = [];

		//var options = {
		//	lines: {
		//		show: true,
		//		fill: true,
		//		fillColor: { colors: [ {opacity: 0.5}, {opacity: 0.5} ] }
		//	},
		//	points: {show: true},
		//	xaxis: {
		//		mode: "time",
		//		timeformat: "%H:%M:%S"
		//	},
		//	grid: {
		//		hoverable: true,
		//		clickable: true,
		//		tickColor: "#ddd",
		//		borderWidth: 1,
		//		borderColor: "#cdcdcd",
		//		backgroundColor: { colors: ["#fff", "#eee"] }
		//	},
		//	 colors: ["#1BB2E9"]
		//};
		//var data = [];
		//var placeholder = $('#chart');
		//var alreadyFetched = {};

		//$.plot(placeholder, data, options);
		//$(placeholder).ready(function () {
		//	var dataurl = '/rspamd/graph';
		//	function onDataReceived(series) {
		//		//var firstcoordinate = '(' + series.data[0][0] + ', ' + series.data[0][1] + ')';
		//		//if (!alreadyFetched[series.label]) {
		//		//	alreadyFetched[series.label] = true;
		//		//	data.push(series);
		//		//	}
		//		$.plot(placeholder, series, options);
		//		$(placeholder).removeAttr('style');
		//	}
		//	$.ajax({
		//		url: dataurl,
		//		beforeSend: function(xhr) {
		//			xhr.setRequestHeader('Password', password)
		//		},
		//		method: 'GET',
		//		dataType: 'json',
		//		success: onDataReceived,
		//		error: function() {
		//			$(placeholder).closest('.widget-box').addClass('unavailable');
		//		}
		//	});
		//});

		$.plot($('#chart'), data, {
			series: {
				pie: { 
					show: true,
					radius: 1,
					label: {
						show: true,
						radius: 1,
						formatter: function(label, series){
							return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'+label+'<br/>'+Math.round(series.percent)+'%</div>';
						},
						background: { opacity: 0.8 }
					}
				}
			},
			legend: {
				show: false
			}
		});

	}

	// get history log
	function getHistory() {
		var items = [];
		$.ajax({
			async: true,
			dataType: 'json',
			url: '/rspamd/history',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Password', password)
			},
			error: function() {
				alertMessage('alert-error', 'Cannot receive history');
			},
			success: function(data) {
				$.each(data, function(i, item) {
					if (item.action === 'clean'||'no action') {
						var action = 'label-success'
					} if (item.action === 'rewrite subject'||'add heeader'||'probable spam') {
						var action = 'label-warning'
					} if (item.action === 'spam') {
						var action = 'label-important'
					} if (item.score <= item.required_score) {
						var score = 'label-success'
					} if (item.score >= item.required_score) {
						var score = 'label-important'
					}
					items.push(
						'<tr><td>' + item.time + '</td>' +
						'<td><div class="cell-overflow" tabindex="1" "title="' + item.id + '">' + item.id +  '</td>' +
						'<td>' + item.ip +  '</td>' +
						'<td><span class="label ' + action + '">' + item.action +  '</span></td>' +
						'<td><span class="label ' + score + '">' + item.score + ' / '+ item.required_score +  '</span></td>' +
						'<td><div class="cell-overflow" tabindex="1" title="' + item.symbols + '">' + item.symbols +  '</div></td>' +
						'<td>' + item.size +  '</td>' +
						'<td>' + item.scan_time +  '</td>' +
						'<td><div class="cell-overflow" tabindex="1" "title="' + item.user + '">' + item.user +  '</div></td></tr>');
					});
				$('<tbody/>', {
					html: items.join('')
					}).insertAfter('#historyLog thead');
					$('#historyLog').tablesorter({
						sortList: [[0,1]]
					})
					.paginateTable({ rowsPerPage: 20 }, {textExtraction: function(node) { var pat=/^[0-9]+/; return pat.exec(node.innerHTML); }});
				}
		});
	}

	// get symbols into modal form
	function getSymbols() {
		var items = [];
		$.ajax({
			async: true,
			dataType: 'json',
			type: 'GET',
			url: '/rspamd/symbols',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Password', password)
				},
			success: function(data) {
				$.each(data[0].rules, function(i, item) {
					items.push('	<div class="row-fluid row-bordered" data-slider="hover">' +
										'<label class="span5" for="' + item.symbol + '" title="' + item.description + '">' +
											'<code>' +  item.symbol + '</code><small class="symbol-description">' + item.description + '</small>' +
										'</label>' +
										'<div class="span4 spin-cell">' + 
											'<input class="numeric" autocomplete="off" "type="number" class="input-mini" min="-20" max="20" step="0.1" tabindex="1" value="' + item.weight + '" id="' + item.symbol + '">' +
										'</div>' +
									'</div>');
					});
				$('<form/>', { id: 'symbolsForm', method: 'post', action: '/rspamd/savesymbols/', 'data-type': 'symbols', style: 'display:none', html: items.join('') }).appendTo('#modalBody');
				initSpinners();
			},
			error:  function(data) {
				alertMessage('alert-error', 'Cannot receive data');
			}
		 });
	}

	// update history log
	$('[data-update]').on('click', function() {

		var table = $('#historyLog');
		var height = $(table).height();

		$(table).children('tbody').remove();
		setTimeout(function() {
			getHistory();
			$(table).fadeIn('slow');
		}, 1200);
	});

	// spam upload form
	function createUploaders() {
		var spamUploader = new qq.FineUploader({
			element: $('#uploadSpamFiles')[0],
			request: {
				endpoint: '/rspamd/learnspam',
				customHeaders: {
					'Password': password
				}
			},
			validation: {
				allowedExtensions: ['eml', 'msg', 'txt', 'html'],
				sizeLimit: 52428800
			},
			autoUpload: false,
			text: {
				uploadButton: '<i class="icon-plus icon-white"></i> Select Files'
			},
			retry: {
				enableAuto: false
			},
			template: '<div class="qq-uploader">' +
						'<pre class="qq-upload-drop-area span12"><span>{dragZoneText}</span></pre>' +
						'<div class="qq-upload-button btn btn-danger">{uploadButtonText}</div>' +
						'<span class="qq-drop-processing"><span>{dropProcessingText}</span><span class="qq-drop-processing-spinner"></span></span>' +
						'<ul class="qq-upload-list"></ul>' +
						'</div>',
			classes: {
				success: 'alert-success',
				fail: 'alert-error'
			},
			debug: true,
			callbacks: {
				onError: function(){
					alertMessage('alert-error', 'Cannot upload data');
				}
			}
		});
		var hamUploader = new qq.FineUploader({
			element: $('#uploadHamFiles')[0],
			request: {
				endpoint: '/rspamd/learnham',
				customHeaders: {
					'Password': password
				}
			},
			validation: {
				allowedExtensions: ['eml', 'msg', 'txt', 'html'],
				sizeLimit: 52428800
			},
			autoUpload: false,
			text: {
				uploadButton: '<i class="icon-plus icon-white"></i> Select Files'
			},
			retry: {
				enableAuto: true
			},
			template: '<div class="qq-uploader">' +
						'<pre class="qq-upload-drop-area span12"><span>{dragZoneText}</span></pre>' +
						'<div class="qq-upload-button btn btn-success">{uploadButtonText}</div>' +
						'<span class="qq-drop-processing"><span>{dropProcessingText}</span><span class="qq-drop-processing-spinner"></span></span>' +
						'<ul class="qq-upload-list"></ul>' +
						'</div>',
			classes: {
				success: 'alert-success',
				fail: 'alert-error'
			},
			debug: true,
			callbacks: {
				onError: function(){
					alertMessage('alert-error', 'Cannot upload data');
				}
			}
		});

		// upload spam button
		$('#uploadSpamTrigger').on('click', function() {
			spamUploader.uploadStoredFiles();
			return false;
			});
		// upload ham button
		$('#uploadHamTrigger').on('click', function() {
			hamUploader.uploadStoredFiles();
			return false;
			});

	}

	// upload text
	function uploadText(data, source, action) {
		if (source == 'spam') {
			var url = '/rspamd/learnspam'
		} if (source == 'ham') {
			var url = '/rspamd/learnham'
		};
		$.ajax({
			async: true,
			data: data,
			dataType: 'text',
			type: 'POST',
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', password);
			},
			success: function() {
				alertMessage('alert-success', 'Data successfully uploaded');
				cleanTextUpload(source);
			},
			error: function() {
				alertMessage('alert-error', 'Cannot upload data');
			}
		});
	}

	// init upload
	$('[data-upload]').on('click', function() {
		var source = $(this).data('upload');
		var data = $('#' + source + 'TextSource').val();
		if (data.length != '') {
			uploadText(data, source);
		}
	});

	// empty textarea on upload complete
	function cleanTextUpload(source) {
		$('#' + source + 'TextSource').val('');
	}

	// init spinners
	function initSpinners() {
		$('.numeric').kendoNumericTextBox({
			min: -20,
			max: 20,
			step: 0.1,
			decimals: 1
		});
	}

	// init actions slider
	$('.slider').each(function() {
		$(this).slider({
			from: 0,
			to: 100,
			scale: ['Not Spam', '|', '|', '|', '|', '|', '|', 'Spam'],
			step: 10,
			round: 10,
			limits: false,
			format: {
				format: '0'
			},
			skin: "round_plastic"
		});
	});

	// upload edited actions
	$(document).on('submit', '#actionsForm', function() {
		var inputs = $('#actionsForm :input[type="slider"]');
		var url = '/rspamd/saveactions';
		var values = [];
		$(inputs).each(function() {
			values.push(parseFloat($(this).val()));
		});
		$.ajax({
			async: true,
			data: JSON.stringify(values),
			dataType: 'application/json',
			type: 'POST',
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', password)
				},
			success: function() {
				alertMessage('alert-success', 'Data successfully saved');
				},
			error:  function() {
				alertMessage('alert-error', 'Oops, password is incorrect');
				},
			statusCode: {
				404: function() {
					alertMessage('alert-error', 'Cannot login, host not found');
					}
				}
			 });
			return false;
		});

	// catch changes of file upload form
	$(window).resize(function(e){
		//$(this).css('background', 'red');
		var form = $(this).attr('id');
		var height = $(form).height();
		console.log(height);
	});

	// watch textarea changes
	$('textarea').change( function() {
		if ($(this).val().length != '') {
			$(this).closest('form').find('button').removeAttr('disabled').removeClass('disabled');
		} else {
			$(this).closest('form').find('button').attr('disabled').addClass('disabled');
		}
	});

	// save forms from modal
	$(document).on('click', '#modalSave', function() {
		var form = $('#modalBody').children().filter(':visible');
		//var map = $(form).data('map');
		//var type = $(form).data('type');
		var action = $(form).attr('action');
		var id = $(form).attr('id');
		var type = $(form).data('type');

		if (type === 'symbols') {
			saveSymbols(action, id);
		} else if (type === 'map') {
			saveMap(action, id);
		}
	});

	// upload map from modal
	function saveMap(action, id) {

		var data = $('#' + id).find('textarea').val();

			$.ajax({
				async: true,
				data: data,
				dataType: 'text',
				type: 'POST',
				url: action,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', password);
					xhr.setRequestHeader('Map', id);
					xhr.setRequestHeader('Debug', true);
				},
				error: function() {
					alertMessage('alert-error', 'Cannot save map data');
				},
				success: function(data) {
					alertMessage('alert-modal alert-succes', 'Map data successfully saved');
					$('#modalDialog').modal(hide=true);
				}
			});
	}

	// upload symbols from modal
	function saveSymbols(action, id) {

		var inputs = $('#' + id + ' :input[type="text"]');
		var url = action; // foreign domain must be setted up as proxypass location
		var values = [];

		$(inputs).each(function() {
			values.push({ name: $(this).attr('id'), value: parseFloat($(this).val()) });
			});
		$.ajax({
			async: true,
			data: JSON.stringify(values),
			dataType: 'application/json',
			type: 'POST',
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', $.cookie('rspamdpasswd'))
				},
			success: function() {
				alertMessage('alert-modal alert-success', 'Data successfully saved');
				},
			error:  function(data) {
				alertMessage('alert-modal alert-error', 'Oops, password is incorrect');
				},
			statusCode: {
				404: function() {
					alertMessage('alert-modal alert-error', 'Cannot login, host not found');
					}
				}
			});
			$('#modalDialog').modal('hide');
			return false;
		}


	// call all by login or with full refresh

	if (!sessionState()) {
		// connect form
		connectRSPAMD();
	} else {
		//start display ui
		requestCredentials();
		statWidgets();
		getMaps();
		getChart();
		getSymbols();
		getHistory();
		getMapById();
		createUploaders();
		//watchSpinners();

		$('#disconnect').on('click', function(event) {
			cleanCredentials();
			connectRSPAMD();
			window.location.reload(); 
			return false;
			});

	//stop display ui
	}

// end
});})()