'use strict';

voteSUpChartController = function () {
  var ctx = document.getElementById('voteSUpChart').getContext('2d');
  var voteSUpDoughnutChart;
  var commitSha = 'unknown';
  var updateChart = false;
  var lastApiHtml = '\n';
  var colorCounts = {};
  var colors = [];
  var apiBaseurl = '';

  function updateLastApiMessage(message) {
    var d = new Date();

    lastApiHtml = '<li><span class="timestamp">' + d.toDateString() + ' ';
    lastApiHtml += d.toLocaleTimeString();
    lastApiHtml += '</span> <span class="timestampMsg">';
    lastApiHtml += message + '</span> </li>\n' + lastApiHtml;

    document.getElementById('lastApiResponses').innerHTML = lastApiHtml;
  }

  function refreshColorCount() {
    var w = Math.floor(12 / colors.length);
    var colorCountHtml = '';
    var divClass;
    var i;
    var color;
    for (i = 0; i < colors.length; i++) {
      color = colors[i];
      divClass = 'col-sm-' + w + ' border-right';
      if (i === colors.length - 1) {
        divClass = 'col-sm-' + w;
      }
      colorCountHtml += '<div id="' + color + 'CountDiv" class="' + divClass +
        '"><p id="' + color + 'Count" class="totnum">' +
        colorCounts[colors[i]].value + '</p><p id="' + color + 'CountLabel">' +
        colorCounts[colors[i]].label + '</p></div>\n';
    }
    document.getElementById('colorCounts').innerHTML = colorCountHtml;
  }

  function incrementColorViaColorCounts(colorToInc) {
    var incUrl = apiBaseurl+'increment?color=' + colorToInc;
    $.getJSON(incUrl, {}, function(data, status) {
      var segment;
      var segmentColor;
      var segmentIndex;

      if (status !== 'success') {
        console.log('Failed to fetch /increment?color=' + colorToInc);
      } else if (data.hasOwnProperty('error')) {
        console.log('/increment error: ' + data.error);
        updateLastApiMessage('Vote for ' + colorToInc +
            ' failed: ' + data.error);
      } else if (data.hasOwnProperty('count') && data.count > 0) {
        colorCounts[colorToInc].value = data.count;
        for (segmentIndex in voteSUpDoughnutChart.segments) {
          segment = voteSUpDoughnutChart.segments[segmentIndex];
          segmentColor = segment.label.toLowerCase();
          if (segmentColor === colorToInc) {
            voteSUpDoughnutChart.segments[segmentIndex].value = data.count;
            updateChart = true;
            updateLastApiMessage('Incremented ' + colorToInc +
                ' ... new count is ' + data.count);
          }
        }
      }
    });
  }

  function pollForUpdates() {
    if (!voteSUpDoughnutChart.hasOwnProperty('segments')) {
      return;
    }
    $.getJSON(apiBaseurl+'data?countsOnly=true', {}, function(data, status) {
      var segment;
      var segmentIndex;
      var color;
      var doUpdate = false;

      if (status !== 'success') {
        console.log('Failed to fetch /data?countsOnly=true');
        return;
      }

      for (segmentIndex in voteSUpDoughnutChart.segments) {
        segment = voteSUpDoughnutChart.segments[segmentIndex];
        color = segment.label.toLowerCase();
        if (segment.value !== data[color]) {
          console.log('Updating count for ' + color + ' to ' + data[color]);
          voteSUpDoughnutChart.segments[segmentIndex].value = data[color];
          doUpdate = true;
        }
        colorCounts[color].value = data[color];
      }
      if (doUpdate) {
        updateLastApiMessage('New vote counts received from backend');
        updateChart = true;
      }
    });
  }

  function pollForNewConfig() {
    $.getJSON('config.json', {}, function(data, status) {
      if (status !== 'success' || ! data.hasOwnProperty('version')) {
        return;
      }
      if (commitSha !== data.version) {
        updateLastApiMessage('New commit sha detected!');
        location.reload(true);
      }
    });
  }

  $.ajaxSetup({ timeout: 750 });

  $.getJSON('config.json', {}, function(data, status) {
    if (status !== 'success' || ! data.hasOwnProperty('version')) {
      return;
    }
    commitSha = data.version;
    apiBaseurl = data.apiBaseurl;
    document.getElementById('gitCommitSha').innerHTML = commitSha;
    updateLastApiMessage('Build version : ' + commitSha);

    // load data now that we have our config info
    $.getJSON(apiBaseurl+'data', {}, function(data, status) {
      var i;

      if (status !== 'success') {
        console.log('Failed to fetch /data');
        return;
      }

      var optionsDoughnut = {
        tooltipEvents: [],
        showTooltips: true,
        onAnimationComplete: function() {
            this.showTooltip(this.segments, true);
        },
        // tooltipTemplate: '<%= label %> - <%= value %>'
        tooltipTemplate: '<%= label %>'
      };

      voteSUpDoughnutChart = new Chart(ctx).Doughnut(data, optionsDoughnut);
      updateLastApiMessage('Initial Vote Count');

      for (i = 0; i < data.length; i++) {
        colors.push(data[i].label.toLowerCase());
        colorCounts[data[i].label.toLowerCase()] =
        {label: data[i].label, value: data[i].value};
      }
      refreshColorCount();
    });

    // check for updates 
    setInterval(pollForUpdates, 5000);
    setInterval(pollForNewConfig, 5000);
  });


  $('#colorCounts').click(function(evt) {
    var colorMatch = evt.target.id.match(/^([a-z]+)Count(Div|Label)?$/);
    if (colorMatch !== null) {
      incrementColorViaColorCounts(colorMatch[1]);
    }
  });

  $('#voteSUpChart').click(function(evt) {
    var activePoints = voteSUpDoughnutChart.getSegmentsAtEvent(evt);
    var colorToInc;
    var incUrl;
    if (activePoints.length < 1 || ! activePoints[0].hasOwnProperty('label')) {
      return;
    }
    colorToInc = activePoints[0].label.toLowerCase();

    incUrl = apiBaseurl+'increment?color=' + colorToInc;
    $.getJSON(incUrl, {}, function(data, status) {
      console.log('StandUp Time Vote increment : ' + status);
      if (status !== 'success') {
        console.log('Failed to fetch /increment?color=' + colorToInc);
        return;
      }
      if (data.hasOwnProperty('error')) {
        console.log('/increment error: ' + data.error);
        updateLastApiMessage('Vote for ' + colorToInc +
          ' failed: ' + data.error);
      } else if (data.hasOwnProperty('count') && data.count > 0) {
        activePoints[0].value = data.count;
        colorCounts[colorToInc].value = data.count;
        updateChart = true;
        updateLastApiMessage('Incremented ' + colorToInc +
          ' ... new count is ' + data.count);
      }
    });
  });


  setInterval(function() {
    if (updateChart) {
      voteSUpDoughnutChart.update();
      refreshColorCount();
      updateLastApiMessage('Updating chart');
      updateChart = false;
    }
  }, 100);
};

