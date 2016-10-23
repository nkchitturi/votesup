var expect    = require("chai").expect;
var InMemStor = require("../lib/inMemoryStorage.js");

var numberOfSUTimesExpected = 4;
var expectedSUTimeProperties = ['value', 'color', 'highlight', 'label'];
var backend = new InMemStor();

describe("inMemoryStorage", function() {
  describe(".getChartDataValues()", function() {
    beforeEach(function() {
      this.chartData = backend.getChartDataValues();
    });

    it("has exactly " + numberOfSUTimesExpected + " items", function() {
      expect(this.chartData).to.have.length(numberOfSUTimesExpected);
    });

    it("each item has exactly " + expectedSUTimeProperties.length + " properties", function() {
      var index;
      for (index = 0; index < this.chartData.length; index++) {
        expect(Object.keys(this.chartData[index])).to.have.length(expectedSUTimeProperties.length);
      }
    });

    it("each item has properties: " + expectedSUTimeProperties, function() {
      var itemProperties;
      var itemIndex;
      var propIndex;
      for (itemIndex = 0; itemIndex < this.chartData.length; itemIndex++) {
        itemProperties = Object.keys(this.chartData[itemIndex]);
        for (propIndex = 0; propIndex < expectedSUTimeProperties.length; propIndex++) {
          expect(itemProperties).to.contain(expectedSUTimeProperties[propIndex]);
        }
      }
    });
  });

  describe(".getAllVoteCounts()", function() {
    beforeEach(function() {
      this.colorCounts = backend.getAllVoteCounts();
    });

    it("has exactly " + numberOfSUTimesExpected + " items", function() {
      expect(Object.keys(this.colorCounts)).to.have.length(numberOfSUTimesExpected);
    });

    it("each item is a number", function() {
      var color;
      for (color in this.colorCounts) {
        expect(this.colorCounts[color]).to.be.a('number');
      }
    });
  });

  describe(".incrementCount()", function() {
    beforeEach(function() {
      var color;
      for (color in this.colorCounts) {
        backend.incrementCount(color);
      }
    });

    it("increments counts by one", function() {
      var color;
      for (color in this.colorCounts) {
        expect(backend.getCount(color)).to.equal(this.colorCounts[color]+1);
      }
    });
  });

  describe(".colorExists()", function() {
    beforeEach(function() {
      this.colors = Object.keys(backend.getAllVoteCounts());
      this.badcolors = ['', 'UKNOWN', null];
    });

    it("each color exists", function() {
      var i;
      var result;
      for (i=0; i < this.colors.length; i++) {
        result = backend.colorExists(this.colors[i]);
        expect(result).to.be.true;
      }
    });

    it("bad colors do not exist", function() {
      var i;
      var result;
      for (i=0; i < this.badcolors.length; i++) {
        result = backend.colorExists(this.badcolors[i]);
        expect(result).to.be.false;
      }
    });
  });
});
