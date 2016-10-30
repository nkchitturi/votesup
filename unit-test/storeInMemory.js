var expect = require("chai").expect;
var InMemStor = require("../lib/storeInMemory.js");

var numberOfSUTimesExpected = 3;
var expectedSUTimeProperties = ['value', 'color', 'highlight', 'label'];
var backend = new InMemStor();

describe("storeInMemory", function() {

    describe(".addVote()", function() {
        beforeEach(function() {
            var color;
            for (color in this.colorCounts) {
                backend.addVote(color);
            }
        });

        it("adds vote counts by one", function() {
            var color;
            for (color in this.colorCounts) {
                expect(backend.getCount(color)).to.equal(this.colorCounts[color] + 1);
            }
        });
    });

    describe(".standUpTimeExists()", function() {
        beforeEach(function() {
            this.colors = Object.keys(backend.getAllVoteCounts());
            this.badcolors = ['', 'UKNOWN', null];
        });

        it("each standUpTime exists", function() {
            var i;
            var result;
            for (i = 0; i < this.colors.length; i++) {
                result = backend.standUpTimeExists(this.colors[i]);
                expect(result).to.be.true;
            }
        });

        it("unlisted standUpTime does not exist", function() {
            var i;
            var result;
            for (i = 0; i < this.badcolors.length; i++) {
                result = backend.standUpTimeExists(this.badcolors[i]);
                expect(result).to.be.false;
            }
        });
    });

    describe(".getChartProperties()", function() {
        beforeEach(function() {
            this.chartData = backend.getChartProperties();
        });

        it("has " + numberOfSUTimesExpected + " StandUp times", function() {
            expect(this.chartData).to.have.length(numberOfSUTimesExpected);
        });

        it("each vote has " + expectedSUTimeProperties.length + " properties", function() {
            var index;
            for (index = 0; index < this.chartData.length; index++) {
                expect(Object.keys(this.chartData[index])).to.have.length(expectedSUTimeProperties.length);
            }
        });

        it("each vote has these properties: " + expectedSUTimeProperties, function() {
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

        it("has exactly " + numberOfSUTimesExpected + " StandUp Times", function() {
            expect(Object.keys(this.colorCounts)).to.have.length(numberOfSUTimesExpected);
        });

        it("each standup time is a number", function() {
            var color;
            for (color in this.colorCounts) {
                expect(this.colorCounts[color]).to.be.a('number');
            }
        });
    });

});