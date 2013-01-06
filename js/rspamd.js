(function() {
	$(document).ready(function(){

		// store session info to cookie as json
		$.cookie.json = true;
		var passwd = $.cookie('rspamdpasswd');

		// hash url nav support
		$(function(){
			var hash = window.location.hash;
			hash && $('a[href="' + hash + '"]').tab('show');
			$('a[data-toggle]').click(function (e) {
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
				//crossDomain: true,
				type: 'GET',
				dataType: 'json',
				url: url,
				beforeSend: function (xhr) {
					xhr.setRequestHeader('PASSWORD', password)
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
					$('.alert').alert();
					},
				statusCode: {
					404: function() {
						// alert
						}
					}
				 });
				return false; // avoid to execute the actual submit of the form.
			});


		// charts
		$(function () {
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
						xhr.setRequestHeader('PASSWORD', passwd)
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



		// sliders
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

		initActions();

		function initRules() {
			$('#symbolsForm .slider').each(function() {
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


		// upload
		function createUploader() {
			var uploader = new qq.FineUploader({
			element: document.getElementById('bootstrapped-fine-uploader'),
			request: {
				endpoint: '//jquery-file-upload.appspot.com/'
				},
			text: {
				uploadButton: '<i class="icon-upload icon-white"></i> Select files for upload...'
				},
			template: '<div class="qq-uploader span12">' +
						'<pre class="qq-upload-drop-area span12"><span>{dragZoneText}</span></pre>' +
						'<div class="qq-upload-button btn btn-success" style="width: auto;">{uploadButtonText}</div>' +
						'<span class="qq-drop-processing"><span>{dropProcessingText}</span><span class="qq-drop-processing-spinner"></span></span>' +
						'<ul class="qq-upload-list" style="margin-top: 10px; text-align: center;"></ul>' +
						'</div>',
			classes: {
				success: 'alert alert-success',
				fail: 'alert alert-error'
				},
				debug: true
			});
		}
		window.onload = createUploader;

			////var template = "<li><strong>@{from_user}</strong> {original_text}</li>"
			//var template = '<div class="control-group"><label class="control-label" title="{group.rules.description}">{group.rules.symbol}</label><div class="controls"><div class="span5"><input type="slider" value="{group.rules.weight}" class="slider" id="{group.rules.symbol}"></div></div></div>';
			//var container = $('#symbolsBody');
			//$.getJSON('/rspamd/symbols', function(data) {
			//	container.html("")
			//		$.each(data.results, function(i, item){
			//			container.append($.nano(template, item))
			//		});
			//	}
			//);

		// <form class="form-horizontal" action="#" method="get">


		function loadSymbols() {
			var items = [];
			$.ajax({
				//crossDomain: true,
				type: 'GET',
				dataType: 'json',
				url: '/rspamd/symbols',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('PASSWORD', passwd);
					},
				success: function(data) {
					$.each(data[0].rules, function(i, item) {
						items.push('<div class="control-group"><label class="control-label symbols-label" title="' + item.description + '">' + item.symbol + '</label><div class="controls"><div class="span5"><input type="slider" value="' + item.weight + '" class="slider" id="' + item.symbol.toLowerCase() + '"></div></div></div>');
						});
					$('<div/>', {
						html: items.join('')
						}).appendTo('#symbolsForm');
						initRules();
						setTimeout(function(){
							$('#rules .progress').hide();
							}, 600);
					},
				error:  function(data) {
					$('.alert').alert();
					},
				statusCode: {
					404: function() {
						// alert
						}
					}
				 });
			}

		$('#editRules').on('click', function(event) {
			loadSymbols();
			});






	});
})()