/*
    Rspamd javascript control interface.
    Copyright (C) 2012-2013 Anton Simonov <untone@gmail.com>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


(function() { $(document).ready(function(){
// begin

	$.cookie.json = true;

	$('#disconnect').on('click', function(event) {
		cleanCredentials();
		connectRSPAMD();
		//window.location.reload();
		return false;
		});
	$('#refresh').on('click', function(event) {
		statWidgets();
		});

	// @supports session storage
	function supportsSessionStorage() {
		try {
			return 'sessionStorage' in window && window['sessionStorage'] !== null;
		} catch (e) {
			return false;
		}
		//return false;
	}

	// @return password
	function getPassword() {
		if (sessionState()) {
			if (!supportsSessionStorage()) {
				return password = $.cookie('rspamdpasswd');
			} else {
				return password = sessionStorage.getItem('Password');
			}
		}
	}

	// @return session state
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
			// @var scrollmem = $('body').scrollTop();
			window.location.hash = this.hash;
			$('html,body').scrollTop(0);
		});
	});

	// @detect session storate
	supportsSessionStorage();

	// @request credentials
	function requestCredentials() {
		$.ajax({
			dataType: 'json',
			type: 'GET',
			url: '/rspamd/login',
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword())
			},
			success: function(data) {
				if (data.auth === 'failed') {
					connectRSPAMD();
				}
			},
		});
	}

	// @request credentials
	function updateCredentials() {
		$.ajax({
			dataType: 'json',
			type: 'GET',
			url: '/rspamd/login',
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword())
			},
			success: function(data) {
				saveCredentials(data, password);
			},
		});
	}

	// @save credentials
	function saveCredentials(data, password) {
		if (!supportsSessionStorage()) {
			$.cookie('rspamdsession', data, { expires: 1 }, { path: '/' });
			$.cookie('rspamdpasswd', password, { expires: 1 }, { path: '/' });
		} else {
			sessionStorage.setItem('Password', password);
			sessionStorage.setItem('Credentials', JSON.stringify(data));
		}
	}

	// @update credentials
	function saveActions(data) {
		if (!supportsSessionStorage()) {
			$.cookie('rspamdactions', data);
		} else {
			sessionStorage.setItem('Actions', JSON.stringify(data));
		}
	}

	// @update credentials
	function saveMaps(data) {
		if (!supportsSessionStorage()) {
			$.cookie('rspamdmaps', data, { expires: 1 }, { path: '/' });
		} else {
			sessionStorage.setItem('Maps', JSON.stringify(data));
		}
	}

	// @clean credentials
	function cleanCredentials() {
		if (!supportsSessionStorage()) {
			$.removeCookie('rspamdlogged');
			$.removeCookie('rspamdsession');
			$.removeCookie('rspamdpasswd');
		} else {
			sessionStorage.clear();
		}
		$('#statWidgets').empty();
		$('#listMaps').empty();
		$('#historyLog tbody').remove();
		$('#modalBody').empty();
	}

	// @alert popover
	function alertMessage(alertState, alertText) {
		if ($('.alert').is(':visible')) {
			$(alert).hide().remove();
		}
		var alert = $('<div class="alert ' + alertState + '" style="display:none">' +
			'<button type="button" class="close" data-dismiss="alert" tutle="Dismiss">&times;</button>' +
			'<strong>' + alertText + '</strong>')
		.prependTo('body');
	$(alert).show();
	setTimeout(function() {
		$(alert).remove();
		}, 3600);
	}

	// @get maps id
	function getMaps() {

		var items = [];

		$('#listMaps').closest('.widget-box').hide();
		$.ajax({
			dataType: 'json',
			url: '/rspamd/maps',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Password', getPassword())
				},
			error: function() {
				alertMessage('alert-error', 'Cannot receive maps data');
			},
			success: function(data) {
				saveMaps(data);
				getMapById();
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

	// @get map by id
	function getMapById(mode) {


		if (!supportsSessionStorage()) {
			var data = $.cookie('rspamdmaps', data, { expires: 1 }, { path: '/' });
		} else {
			var data = JSON.parse(sessionStorage.getItem('Maps'));
		}
		if (mode === 'update') {
			$('#modalBody').empty();
			getSymbols();
		}

		$.each(data, function(i, item) {
			$.ajax({
				dataType: 'text',
				url: '/rspamd/getmap',
				beforeSend: function(xhr) {
					xhr.setRequestHeader('Password', getPassword()),
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
				$('<form class="form-horizontal form-map" method="post "action="/rspamd/savemap" data-type="map" id="' + item.map + '" style="display:none">' + 
				'<textarea class="list-textarea"' + disabled + '>' + text + '</textarea>' + 
				'</form').appendTo('#modalBody');
				}
			})
		});
	}

	// @ ms to date
	function msToTime(seconds){
		minutes = parseInt(seconds / 60);
		hours = parseInt( seconds / 3600);
		days = parseInt( seconds / 3600 /24);
		weeks = parseInt(seconds / 3600 / 24 /7);
		years = parseInt(seconds  / 3600 / 168 / 365);
		if (weeks > 0) {
			years = years >= 10 ? years : '0' + years;
			weeks -= years * 168;
			weeks = weeks >= 10 ? weeks : '0' + weeks;
			// Return in format X years and Y weeks
			return years + ' years ' + weeks + ' weeks';
		}
		
		seconds -= minutes * 60;
		minutes -= hours * 60;
		hours -= days * 24;
		
		days = days >= 10 ? days : '0' + days;
		hours = hours >= 10 ? hours : '0' + hours;
		minutes = minutes >= 10 ? minutes : '0' + minutes;
		seconds = seconds >= 10 ? seconds : '0' + seconds;
		if (days > 0) {
			return days + ' days, ' + hours + ':' + minutes + ':' + seconds;
		}
		else {
			return hours + ':' + minutes + ':' + seconds;
		}
	}

	// @show widgets
	function statWidgets() {

		var widgets = $('#statWidgets');

		updateCredentials();
		$(widgets).empty().hide();
			if (!supportsSessionStorage()) {
				var data = $.cookie('rspamdsession');
			} else {
				var data = JSON.parse(sessionStorage.getItem('Credentials'));
			}
			var stat_w = []
			$.each(data, function(i, item) {
				if (i == 'auth') {
					// @none
				} else if (i == 'error') {
					// @none
				} else if (i == 'version') {
					var widget = '<div class="left"><strong>' + item + '</strong>' + i + '</div>';
					$(widget).appendTo(widgets);
				} else if (i == 'uptime') {
					var widget = '<div class="right"><strong>' + msToTime(item) + '</strong>' + i + '</div>';
					$(widget).appendTo(widgets);
				} else {
					var widget = '<li class="stat-box"><div class="widget"><strong>' + item + '</strong>' + i + '</div></li>';
					if (i == 'scanned') {
						stat_w[0] = widget;
					}
					else if (i == 'clean') {
						stat_w[1] = widget;
					}
					else if (i == 'greylist') {
						stat_w[2] = widget;
					}
					else if (i == 'probable') {
						stat_w[3] = widget;
					}
					else if (i == 'reject') {
						stat_w[4] = widget;
					}
					else if (i == 'learned') {
						stat_w[5] = widget;
					}
				}
			});
			$.each(stat_w, function(i, item) {$(item).appendTo(widgets);});
		$('#statWidgets .left,#statWidgets .right').wrapAll('<li class="stat-box pull-right"><div class="widget"></div></li>');
		$(widgets).show();
		window.setTimeout(statWidgets, 10000);
	}

	// @opem modal with target form enabled
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

		return false;
	});

	//close modal without saving
	$(document).on('click', '[data-dismiss="modal"]', function(e) {
		$('#modalBody form').hide();
	});

	// @get chart
	//function getChart() {
	//	var options = {
	//		lines: {
	//			show: true,
	//			fill: true,
	//			fillColor: { colors: [ {opacity: 0.5}, {opacity: 0.5} ] }
	//		},
	//		legend: {
	//			show: false
	//		},
	//		series: {
	//			pie: {
	//				show: true,
	//				radius: 1,
	//				label: {
	//					show: true,
	//					radius: 3/4,
	//					formatter: function(label, series){
	//						return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'+label+'<br/>'+Math.round(series.percent)+'%</div>';
	//				},
	//				background: {
	//					opacity: 0.5,
	//					color: '#000'
	//				}
	//			}
	//		}
	//	}
	//};

	//var data = [];
	//var placeholder = $('#chart');
	//var alreadyFetched = {};

	//$.plot(placeholder, data, options);

	//$(placeholder).ready(function () {

	//	var dataurl = '/rspamd/pie';

	//	function onDataReceived(series) {
	//		$.plot(placeholder, series, options);
	//		$(placeholder).removeAttr('style');
	//		}
	//	$.ajax({
	//		url: dataurl,
	//		beforeSend: function(xhr) {
	//			xhr.setRequestHeader('Password', getPassword())
	//			},
	//		method: 'GET',
	//		dataType: 'json',
	//		success: onDataReceived,
	//		error: function() {
	//			$(placeholder).closest('.widget-box').addClass('unavailable');
	//			}
	//		});
	//	});
	//}

	function getChart() {
		$.ajax({
			dataType: 'json',
			type: 'GET',
			url: '/rspamd/pie',
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword())
			},
			success: function(data) {
				console.log(data);

				$(function () {
					var chart;
					$(document).ready(function() {
						chart = new Highcharts.Chart({
							chart: {
								renderTo: 'chart',
								plotBackgroundColor: null,
								plotBorderWidth: null,
								plotShadow: false
							},
							title: {
								text: null
							},
							tooltip: {
								enabled: false
							},
							plotOptions: {
								pie: {
									allowPointSelect: true,
									cursor: 'default',
									dataLabels: {
										enabled: true,
										color: '#333333',
										connectorColor: '#cbcbcb',
										formatter: function() {
											return '<b>'+ this.point.name +'</b>: '+ Highcharts.numberFormat(this.percentage, 1) +' %';
										}
									}
								}
							},
							series: [{
								type: 'pie',
								name: 'Messages',
								data: data
							}]
						});
					});
				});

			}
		});
	}

	// @get history log
	//function getChart() {
	//	//console.log(data)
	//	$.ajax({
	//		dataType: 'json',
	//		url: './pie',
	//		beforeSend: function(xhr) {
	//			xhr.setRequestHeader('Password', getPassword())
	//		},
	//		error: function() {
	//			alertMessage('alert-error', 'Cannot receive history');
	//		},
	//		success: function(data) {
	//			console.log(data);
	//		}
	//	});
	//}


	// @get history log
	function getHistory() {
		var items = [];
		$.ajax({
			dataType: 'json',
			url: '/rspamd/history',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Password', getPassword())
			},
			error: function() {
				alertMessage('alert-error', 'Cannot receive history');
			},
			success: function(data) {
				$.each(data, function(i, item) {
					if (item.action === 'clean'||'no action') {
						var action = 'label-success'
					} if (item.action === 'rewrite subject'||'add header'||'probable spam') {
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
				$('<tbody/>', {html: items.join('')}).insertAfter('#historyLog thead');
				$('#historyLog').tablesorter({sortList: [[0,1]]}).paginateTable({ rowsPerPage: 20 }, {textExtraction: function(node) { var pat=/^[0-9]+/; return pat.exec(node.innerHTML);
				}});
			}
		});
	}

	// @get symbols into modal form
	function getSymbols() {
		var items = [];
		$.ajax({
			dataType: 'json',
			type: 'GET',
			url: '/rspamd/symbols',
			beforeSend: function(xhr) {
				xhr.setRequestHeader('Password', getPassword())
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
				$('<form/>', { id: 'symbolsForm', method: 'post', action: '/rspamd/savesymbols', 'data-type': 'symbols', style: 'display:none', html: items.join('') }).appendTo('#modalBody');
				initSpinners();
			},
			error:  function(data) {
				alertMessage('alert-error', 'Cannot receive data');
			}
		 });
	}

	// @update history log
	$('#updateHistory').on('click', function() {
		$(this).addClass('loading');
		var target = '#historyLog';
		var height = $(target).height();
		$(target).parent().css('height', height);
		$(target).children('tbody').remove();
		setTimeout(function() {
			getHistory();
			$(target).fadeIn();
		}, 1200);
		$(target).parent().removeAttr('style');
	});

	// @spam upload form
	function createUploaders() {
		var spamUploader = new qq.FineUploader({
			element: $('#uploadSpamFiles')[0],
			request: {
				endpoint: '/rspamd/learnspam',
				customHeaders: {
					'Password': getPassword()
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
					'Password': getPassword()
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

		// @upload spam button
		$('#uploadSpamTrigger').on('click', function() {
			spamUploader.uploadStoredFiles();
			return false;
			});
		// @upload ham button
		$('#uploadHamTrigger').on('click', function() {
			hamUploader.uploadStoredFiles();
			return false;
			});

	}

	// @upload text
	function uploadText(data, source) {
		if (source === 'spam') {
			var url = '/rspamd/learnspam'
		} if (source === 'ham') {
			var url = '/rspamd/learnham'
		} if (source === 'scan') {
			var url = '/rspamd/scan'
		};
		$.ajax({
			data: data,
			dataType: 'json',
			type: 'POST',
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword());
			},
			success: function(data) {
				cleanTextUpload(source);
				if (data.success) {
					alertMessage('alert-success', 'Data successfully uploaded');
				}
			},
			//error: function() {
			//	alertMessage('alert-error', 'Cannot upload data');
			//},
			statusCode: {
				404: function() {
					alertMessage('alert-error', 'Cannot upload data, no server found');
				},
				503: function() {
					alertMessage('alert-error', 'Cannot tokenize message, no text data');
				}
			}
		});
	}

	// @upload text
	function scanText(data) {

		var url = '/rspamd/scan';
		var items = [];

		$.ajax({
			data: data,
			dataType: 'json',
			type: 'POST',
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword());
			},
			success: function(data) {
				if (data.action) {
					alertMessage('alert-success', 'Data successfully scanned');

					if (data.action === 'clean'||'no action') {
						var action = 'label-success'
					} if (data.action === 'rewrite subject'||'add heeader'||'probable spam') {
						var action = 'label-warning'
					} if (data.action === 'spam') {
						var action = 'label-important'
					} if (data.score <= data.required_score) {
						var score = 'label-success'
					} if (data.score >= data.required_score) {
						var score = 'label-important'
					}

					$('<tbody id="tmpBody"><tr>' +
						'<td><span class="label ' + action + '">' + data.action + '</span></td>' +
						'<td><span class="label ' + score + '">' + data.score + '/' + data.required_score + '</span></td>' +
						'</tr></tbody>')
					.insertAfter('#scanOutput thead');

					$.each(data.symbols, function(i, item) {
						items.push('<div class="cell-overflow" tabindex="1">'+ item.name + ': ' + item.weight + '</div>');
						});
					$('<td/>', { id: 'tmpSymbols', html: items.join('') }).appendTo('#scanResult');

					$('#tmpSymbols').insertAfter('#tmpBody td:last').removeAttr('id');
					$('#tmpBody').removeAttr('id');
					$('#scanResult').show();
					$('html, body').animate({
						scrollTop: $('#scanResult').offset().top
					}, 1000);
				}
				else {
					alertMessage('alert-error', 'Cannot scan data');
				}
			},
			statusCode: {
				404: function() {
					alertMessage('alert-error', 'Cannot upload data, no server found');
				},
				500: function() {
					alertMessage('alert-error', 'Cannot tokenize message: no text data');
				},
				503: function() {
					alertMessage('alert-error', 'Cannot tokenize message: no text data');
				}
			}
		});
	}

	// @close scan output
	$('#scanClean').on('click', function() {
		$('#scanTextSource').val('');
		$('#scanResult').hide();
		$('#scanOutput tbody').remove();
		$('html, body').animate({
			scrollTop: 0
		}, 1000);
	});

	// @init upload
	$('[data-upload]').on('click', function() {
		var source = $(this).data('upload');
		var data = $('#' + source + 'TextSource').val();
		if (data.length > 0) {
			if (source == 'scan') {
				scanText(data);
			} else {
				uploadText(data, source);
			}
		}
		return false;
	});

	// @empty textarea on upload complete
	function cleanTextUpload(source) {
		$('#' + source + 'TextSource').val('');
	}


	// @get acions
	function getActions() {

		var items = [];

		$.ajax({
			dataType: 'json',
			type: 'GET',
			url: '/rspamd/actions',
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword())
			},
			success: function(data) {
				// Order of sliders greylist -> probable spam -> spam
				items = []	
				$.each(data, function(i, item) {
					var idx = -1;
					if (item.action === 'add_header') {
						var label = 'Probably Spam';
						idx = 1;
					} else if (item.action === 'greylist') {
						var label = 'Greylist';
						idx = 0;
					} else if (item.action === 'reject') {
						var label = 'Spam';
						idx = 2;
					}
					if (idx >= 0) {
						items[idx] = 
							'<div class="control-group">' +
								'<label class="control-label">' + label + '</label>' +
								'<div class="controls slider-controls">' +
									'<input class="slider" type="slider" value="' + item.value + '">' +
								'</div>' +
							'</div>';
					}
				});
				$('<form/>', { id: 'actionsForm', class: 'form-horizontal', html: items.join('')}).appendTo('#actionsBody');
				initSliders();
				$('<br><div class="control-group"><div class="controls slider-controls"><button class="btn" type="submit">Save actions</button</p></div></div>').appendTo('#actionsForm');
			}
		 });
	}

	// @init spinners
	function initSpinners() {
		$('.numeric').kendoNumericTextBox({
			min: -20,
			max: 20,
			step: 0.1,
			decimals: 1
		});
	}


	// @init actions slider
	function initSliders() {
		$('.slider').each(function() {
			$(this).slider({
				from: 0,
				to: 100,
				scale: ['Not Spam', '|', '|', '|', '|', '|', '|', 'Spam'],
				step: 1,
				round: 10,
				limits: false,
				format: {
					format: '0'
				},
				skin: "round_plastic"
			});
		});
	}

	// @upload edited actions
	$(document).on('submit', '#actionsForm', function() {
		var inputs = $('#actionsForm :input[type="slider"]');
		var url = '/rspamd/saveactions';
		var values = [];
		// Rspamd order: [spam,probable_spam,greylist]
		values[0] = parseFloat(inputs[2].value)
		values[1] = parseFloat(inputs[1].value)
		values[2] = parseFloat(inputs[0].value)
		$.ajax({
			data: JSON.stringify(values),
			dataType: 'json',
			type: 'POST',
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword())
			},
			success: function() {
				alertMessage('alert-success', 'Actions successfully saved');
			}
		 });
		getMapById('update');
		return false;
	});

	// @catch changes of file upload form
	$(window).resize(function(e){
		var form = $(this).attr('id');
		var height = $(form).height();
	});

	// @watch textarea changes
	$('textarea').change( function() {
		if ($(this).val().length != '') {
			$(this).closest('form').find('button').removeAttr('disabled').removeClass('disabled');
		} else {
			$(this).closest('form').find('button').attr('disabled').addClass('disabled');
		}
	});

	// @save forms from modal
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

	// @upload map from modal
	function saveMap(action, id) {

		var data = $('#' + id).find('textarea').val();

			$.ajax({
				data: data,
				dataType: 'text',
				type: 'POST',
				url: action,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', getPassword());
					xhr.setRequestHeader('Map', id);
					xhr.setRequestHeader('Debug', true);
				},
				error: function() {
					alertMessage('alert-error', 'Cannot save map data');
				},
				success: function(data) {
					alertMessage('alert-modal alert-success', 'Map data successfully saved');
					$('#modalDialog').modal('hide');
				}
			});
	}

	// @upload symbols from modal
	function saveSymbols(action, id) {

		var inputs = $('#' + id + ' :input[data-role="numerictextbox"]');
		var url = action;
		var values = [];

		$(inputs).each(function() {
			values.push({ name: $(this).attr('id'), value: parseFloat($(this).val()) });
			});
		$.ajax({
			data: JSON.stringify(values),
			dataType: 'json',
			type: 'POST',
			url: url,
			beforeSend: function (xhr) {
				xhr.setRequestHeader('Password', getPassword())
				},
			success: function() {
				alertMessage('alert-modal alert-success', 'Symbols successfully saved');
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

	// @connect to server
	function connectRSPAMD() {

			cleanCredentials();

			var nav = $('#navBar');
			var ui = $('#mainUI');
			var dialog = $('#connectDialog');
			var backdrop = $('#backDrop');
			var disconnect = $('#navBar .pull-right');

			$(ui).hide();
			$(dialog).show();
			$('#connectHost').focus();
			$(backdrop).show();
			$(document).on('submit', '#connectForm', function(e) {
				e.preventDefault();

				var password = $('#connectPassword').val();

				$.ajax({
					global: false,
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
							$(dialog).hide();
							$(backdrop).hide();
							$(disconnect).show();
							displayUI();
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

	connectRSPAMD();

	function displayUI() {

		// @toggle login and main
		statWidgets();
		$('#mainUI').show();
		$('#progress').show();
		getActions();
		getMaps();
		createUploaders();
		getSymbols();
		getHistory();
		getChart();
		$('#progress').hide();
	}

	$(document).ajaxStart(function() {
		$('#navBar').addClass('loading');
	});

	$(document).ajaxComplete(function() {
		$('#navBar').removeClass('loading');
	});


// end
});})()
