(function() {
	$(document).ready(function(){

		// store session info to cookie as json
		$.cookie.json = true;
		var passwd = $.cookie('rspamdpasswd');

		// hash url nav support
		$(function(){
			var hash = window.location.hash;
			hash && $('a[href="' + hash + '"]').tab('show');
			$('a[data-toggle]').on('click',function (e) {
				$(this).tab('show');
				var scrollmem = $('body').scrollTop();
				window.location.hash = this.hash;
				$('html,body').scrollTop(scrollmem);
			});	
		});

		// show login or show admin panes
		function loggedOrNot() {
			if ($.cookie('rspamdlogged') == null ) {
				$.removeCookie('rspamdsession');
				$.removeCookie('rspamdpasswd');
				$('html').addClass('not-logged');
				$('#loginForm').show();
				}
			else {
				$('html').removeAttr('class');
				$('#loginForm').hide();

				// receive maps id
				getMaps();
				// receive history
				getHistory();
				// init sliders on global actions pane
				initActions();

				// charts
				$(function getCharts() {
					var options = {
						lines: {
							show: true,
							fill: true,
							fillColor: { colors: [ {opacity: 0.5}, {opacity: 0.5} ] }
							},
						points: {show: true},
						xaxis: {
							mode: "time",
							timeformat: "%H:%M:%S"
							},
						grid: {
							hoverable: true,
							clickable: true,
							tickColor: "#ddd",
							borderWidth: 1,
							borderColor: "#cdcdcd",
							backgroundColor: { colors: ["#fff", "#eee"] }
							},
						 colors: ["#1BB2E9"]
						};
					var data = [];
					var placeholder = $('#chart');
					var alreadyFetched = {};

					$.plot(placeholder, data, options);

					$(placeholder).ready(function () {
						var dataurl = '/rspamd/graph';
						function onDataReceived(series) {
							//var firstcoordinate = '(' + series.data[0][0] + ', ' + series.data[0][1] + ')';
							//if (!alreadyFetched[series.label]) {
							//	alreadyFetched[series.label] = true;
							//	data.push(series);
							//	}
							$.plot(placeholder, series, options);
							$(placeholder).removeAttr('style');
							}
						$.ajax({
							url: dataurl,
							beforeSend: function(xhr) {
								xhr.setRequestHeader('Password', passwd)
								},
							method: 'GET',
							dataType: 'json',
							success: onDataReceived,
							error: function() {
								$(placeholder).closest('.widget-box').addClass('unavailable');
								}
							});
						});
					});
					// show charts tooltip
					function showTooltip(x, y, contents) {
						$('<div id="tooltip" class="tooltip in top">' + contents + '</div>').css( {
							top: y + 5,
							left: x + 5
							}).appendTo('body').fadeIn(200);
						}
					var previousPoint = null;
					$("#chart").bind("plothover", function (event, pos, item) {
						$("#x").text(pos.x.toFixed(2));
						$("#y").text(pos.y.toFixed(2));

							if (item) {
								if (previousPoint != item.dataIndex) {
									previousPoint = item.dataIndex;

									$("#tooltip").remove();
									var x = item.datapoint[0].toFixed(2),
										y = item.datapoint[1].toFixed(2);

									showTooltip(item.pageX, item.pageY,
										item.series.label + ': ' + y);
								}
							}
							else {
								$("#tooltip").remove();
								previousPoint = null;
							}
					});

				}
			}

		loggedOrNot();

		// show session info
		function serverInfo() {
			var cookie = $.cookie('rspamdsession');
			if ($.cookie('rspamdsession') != null ) {
				$('#serverInfo span:eq(0)').text(cookie.version);
				$('#serverInfo span:eq(1)').text(cookie.uptime);
				$('#serverInfo').show();
				}
			}

		// execute login
		$('#connectForm').submit(function() {
			var form = $(this);
			var password = $('#connectPassword').val();
			var url = '/rspamd/login'; // foreign domain must be setted up as proxypass location
			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: url,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', password)
					},
				success: function(data) {
					if (data.auth === 'failed') {
						$(form).each(function () {
							$('.control-group').addClass('error');
							});
						}
					else {
						$.cookie('rspamdlogged', $.now(), { expires: 1 }, { path: '/' });
						$.cookie('rspamdsession', data, { expires: 1 }, { path: '/' });
						$.cookie('rspamdpasswd', password, { expires: 1 }, { path: '/' });
						loggedOrNot();
						serverInfo();
						}
					},
				error:  function(data) {
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


		// action sliders
		function initActions() {
			$('#actionsBody .slider').each(function() {
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
			}

		// rule sliders
		function initRules() {
			$('#modalForm .slider').each(function() {
				$(this).slider({
					from: -20,
					to: 20,
					scale: ['Not Spam', '|', '|', '|', '|', '|', '|', 'Spam'],
					step: 0.1,
					round: 1,
					limits: false,
					format: {
						format: '##.0'
						},
					skin: "round_plastic"
					});
				});
			}

		// upload spam
		var spamUploader = new qq.FineUploader({
			element: $('#uploadSpamForm')[0],
			request: {
				endpoint: '/rspamd/learnspam',
				customHeaders: {
					"Password": passwd
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
				onComplete: function(){
					//clearSpamFiles()
					},
				onError: function(){
					alertMessage('alert-error', 'Cannot upload data');
					}
				}
			});

		// upload ham
		var hamUploader = new qq.FineUploader({
			element: $('#uploadHamForm')[0],
			request: {
				endpoint: '/rspamd/learnsddddham',
				customHeaders: {
					"Password": passwd
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
				onComplete: function(){
					// clearHamFiles()
					},
				onError: function(){
					alertMessage('alert-error', 'Cannot upload data');
					}
				}
			});

		// upload smap button
		$('#uploadSpamTrigger').on('click', function() {
			spamUploader.uploadStoredFiles();
			});

		// upload ham button
		$('#uploadHamTrigger').on('click', function() {
			hamUploader.uploadStoredFiles();
			});

		// clear spam files list
		function clearSpamFiles() {
			qq('.qq-upload-list').hide();
			//spamUploader.clearStoredFiles();
			}

		// clear ham files list
		function clearHamFiles() {
			hamUploader.clearStoredFiles();
			}

		// enable or disable upload button
		$('.qq-upload-list').on('resize', function(){
			var height = $(this).height();
			if (height > 0) {
				$(this).closest('.span6').find('button').removeAttr('disabled').removeClass('disabled');
				}
			else {
				$(this).closest('.span6').find('button').attr('disabled', 'disabled').addClass('disabled');
				}
			}); 


		// upload text
		function uploadText(data, source, action) {
			if (source == 'spam') {
				var url = '/rspamd/learnspam'
				}
			if (source == 'ham') {
				var url = '/rspamd/learnham'
				};
			$.ajax({
				type: 'POST',
				url: url,
				data: data,
				dataType: 'text',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', passwd);
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
			uploadText(data, source);
			});

		function cleanTextUpload(source) {
			$('#' + source + 'TextSource').val('');
			}



		function alertMessage(alertState, alertText) {
			var alert = $('<div class="alert ' + alertState + '" style="display:none">' + 
				'<button type="button" class="close" data-dismiss="alert" tutle="Dismiss">&times;</button>' +
				'<strong>' + alertText + '</strong>').prependTo('body');
			$(alert).show('fast').delay(3600).hide('fast');
			}

		$(document).on('keyup', 'textarea', function() {
			if ($(this).val().length != '') {
				$(this).siblings('p').find('button').removeAttr('disabled').removeClass('disabled');
				}
			});

		function loadSymbols() {
			// clean form
			$('#modalForm').empty();
			var items = [];
			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: '/rspamd/symbols',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', passwd);
					},
				success: function(data) {
					$('#modalDialog').modal();
					$.each(data[0].rules, function(i, item) {
						items.push('<div class="control-group">' +
							'<label class="control-label symbols-label" title="' + item.description + '">' +  item.symbol + '</label>' +
							'<div class="controls"><div class="span6"><input type="slider" value="' + item.weight + '" class="slider" id="' + item.symbol.toLowerCase() + '"></div>' +
							'</div></div>');
						});
					$('<div/>', {
						html: items.join('')
						}).appendTo('#modalForm');
						$('#modalDialog .progress').hide();
						// show 'Save' button
						$('#modalSave').show();
						initRules();
					},
				error:  function(data) {
					alertMessage('alert-error', 'Cannot receive data');
					},
				statusCode: {
					404: function() {
						alertMessage('alert-error', 'Data source not found');
						}
					}
				 });
			}

		$('#editRules').on('click', function(event) {
			var title = $(this).data('title');
			loadSymbols();
			$('#modalLabel').text(title);
			});


		function getMaps() {
			var items = [];
			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: '/rspamd/maps',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', passwd);
					},
				error: function() {
					alertMessage('alert-error', 'Cannot receive maps data');
					},
				success: function(data) {
					$.each(data, function(i, item) {
						if ((item.editable == false)) {
							var caption = 'View List';
							}
						else {
							var caption = 'Edit List';
							}
						items.push('<tr><td>' + item.description + '</td>' +
							'<td><button class="btn btn-mini btn-primary pull-right"' +
							'data-editable="' + item.editable + '" data-map="' + item.map + '" data-title="' + item.description + '">' + caption + '</button></td></tr>');
						});
					$('<tbody/>', {
						html: items.join('')
						}).appendTo('#lists');
						}
				});
			}

		$(document).on('click', 'button[data-map]', function () {
			var map = $(this).data('map');
			var editable = $(this).data('editable');
			var title = $(this).data('title');
			var textarea = $('<textarea class="list-textarea" id="modalTextarea"/>')
			$.ajax({
				type: 'GET',
				dataType: 'text',
				url: '/rspamd/getmap',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', passwd);
					xhr.setRequestHeader('Map', map);
					},
				error: function() {
					alertMessage('alert-error', 'Cannot receive list data');
					},
				success: function(data) {
					$('#modalDialog .progress').hide();
					$('#modalLabel').text(title);
					$('#modalForm').empty().append(textarea);
					$('#modalTextarea').val(data);
					// hide 'Save' button and disable textarea
					if (editable === false) {
						$('#modalTextarea').prop('disabled', true);
						$('#modalSave').hide();
						}
					$('#modalDialog').modal();
					}
				});
			});

		function getHistory() {
			var items = [];
			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: './json/rspamd.history.json',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('Password', passwd);
					},
				error: function() {
					alertMessage('alert-error', 'Cannot receive history');
					},
				success: function(data) {
					$.each(data, function(i, item) {
						if (item.action === 'clean'||'no action') {
							var action = 'label-success'
							}
						if (item.action === 'rewrite subject'||'add heeader'||'probable spam') {
							var action = 'label-warning'
							}
						if (item.action === 'spam') {
							var action = 'label-important'
							}
						if (item.score <= item.required_score) {
							var score = 'label-success'
							}
						if (item.score >= item.required_score) {
							var score = 'label-important'
							}
						items.push(
							'<tr><td>' + item.time + '</td>' +
							'<td>' + item.id +  '</td>' +
							'<td>' + item.ip +  '</td>' +
							'<td><span class="label ' + action + '">' + item.action +  '</span></td>' +
							'<td><span class="label ' + score + '">' + item.score +  '</span>' + '&nbsp;' + '<span class="label">' + item.required_score +  '</span></td>' +
							'<td>' + item.symbols +  '</td>' +
							'<td>' + item.size +  '</td>' +
							'<td>' + item.scan_time +  '</td>' +
							'<td>' + item.user +  '</td></tr>');
						});
					$('<tbody/>', {
						html: items.join('')
						}).insertAfter('#historyLog thead');
						$('#historyLog').paginateTable({ rowsPerPage: 10 })
						}
				});
			}

	$('[data-update]').on('click', function() {
		var table = $('#historyLog');
		var height = $(table).height();
		$(table).children('tbody').remove();
		setTimeout(function() {
			getHistory();
			$(table).fadeIn('slow');
			}, 1200);
		});


	});
})()