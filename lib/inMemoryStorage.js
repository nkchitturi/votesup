'use strict';

function Constructor() {

  /* jshint -W106 */
  var chartData = {
    values: {
      nine_am_est: {
        label: 'Nine_AM_EST',
        value: 1,
        color:'#6F6F6F',
        highlight: '#feffff'
      },
      eleven_am_est: {
        label: 'Eleven_AM_EST',
        value: 1,
        color: '#98dafc',
        highlight: '#C9DF6E'
      },
      one_pm_est: {
        label: 'One_PM_EST',
        value: 1,
        color:'#daad86',
        highlight: '#FFB75E'
      },
      three_pm_est: {
        label: 'Three_PM_EST',
        value: 1,
        color:'#312c32',
        highlight: '#bcd5d1'
      }
    }
  };
  /* jshint +W106 */

  this.getChartDataValues = function () {
    var returnList = [];
    var k;
    for (k in chartData.values) {
      if (chartData.values.hasOwnProperty(k)) {
        returnList.push(chartData.values[k]);
      }
    }
    return returnList;
  };

  this.getAllVoteCounts = function() {
    var allCounts = {};
    var k;
    for (k in chartData.values) {
      if (chartData.values.hasOwnProperty(k)) {
        allCounts[k] = chartData.values[k].value;
      }
    }
    return allCounts;
  };

  this.getCount = function(color) {
    if (chartData.values.hasOwnProperty(color)) {
      return chartData.values[color].value;
    }
    return -1;
  };

  this.incrementCount = function(color) {
    if (chartData.values.hasOwnProperty(color)) {
      chartData.values[color].value++;
    }
  };

  this.setCounts = function(counts) {
    var k;
    for (k in counts) {
      if (counts.hasOwnProperty(k) && chartData.values.hasOwnProperty(k)) {
        chartData.values[k].value = counts[k];
      }
    }
  };

  this.colorExists = function(color) {
    return chartData.values.hasOwnProperty(color);
  };
}

module.exports = Constructor;
