var expect = require("chai").expect;
var reqThrottle = require("../lib/throttleRequest.js");

describe("throttleRequest", function() {

    describe(".checkIpAddress()", function() {
        beforeEach(function() {
            reqThrottle.clearIpMap();
            reqThrottle.logIpAddress('127.0.0.1', Date.now() + 1000);
            reqThrottle.logIpAddress('127.0.0.2', Date.now() - 1000);
        });

        it("does throttle mapped ipAddress", function() {
            expect(reqThrottle.checkIpAddress('127.0.0.1')).to.be.false;
        });

        it("does not throttle mapped ipAddress after blackoutPeriod", function() {
            expect(reqThrottle.checkIpAddress('127.0.0.2')).to.be.true;
        });

        it("does not throttle unmapped ipAddress", function() {
            expect(reqThrottle.checkIpAddress('127.0.0.3')).to.be.true;
        });
    });

    describe(".logIpAddress()", function() {
        beforeEach(function() {
            reqThrottle.clearIpMap();
            reqThrottle.logIpAddress('127.0.0.1');
        });

        it("logs ipAddress to map", function() {
            expect(reqThrottle.ipAddressIsInMap('127.0.0.1')).to.be.true;
        });
    });

    describe(".garbageCollectMap()", function() {
        beforeEach(function() {
            reqThrottle.clearIpMap();
            reqThrottle.logIpAddress('127.0.0.1', Date.now() + 1000);
            reqThrottle.logIpAddress('127.0.0.2', Date.now() - 1000);
            reqThrottle.garbageCollectMap();
        });
        it("removes expired ipAddress", function() {
            expect(reqThrottle.ipAddressIsInMap('127.0.0.2')).to.be.false;
        });
        it("does not remove unexpired ipAddress", function() {
            expect(reqThrottle.ipAddressIsInMap('127.0.0.1')).to.be.true;
        });
    });
});