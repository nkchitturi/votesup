'use strict';

var express = require('express');
var app = express();
var CS = require(__dirname + '/lib/storeInMemory.js');
var sha = require(__dirname + '/lib/hash.js');
var reqThrottle = require(__dirname + '/lib/throttleRequest.js');
var DDBP = require(__dirname + '/lib/storeDynamoDb.js');
var serverPort = 8080;
var siteChartStore = {};
var ddbLastFetch = {};

module.exports = app;

var ddbPersist = new DDBP();

if (process.env.hasOwnProperty('AUTOMATED_ACCEPTANCE_TEST')) {
    serverPort = 0;
}

/* Helper to refresh in memory store w/ data from DDB */
function updateVoteCountsFromDdb(siteName, cb) {
    var chartData = siteChartStore[siteName];

    /*jshint -W101 */
    ddbPersist.getSiteCounts(siteName, chartData.getAllVoteCounts(), function(err, data) {
        if (err) {
            cb(err);
        } else {
            chartData.setCounts(data);
            ddbLastFetch[siteName] = Date.now();
            cb(null, chartData);
        }
    });
    /*jshint +W101 */
}

/* Returns in memory store chart data store */
function getChartData(siteName, nocache, cb) {
    if (!siteChartStore.hasOwnProperty(siteName)) {
        siteChartStore[siteName] = new CS(siteName);
        ddbLastFetch[siteName] = 0;
    }

    if (nocache || (Date.now() - ddbLastFetch[siteName] > 1000)) {
        // Fetch from DDB if it's been more than a second since last refresh
        updateVoteCountsFromDdb(siteName, cb);
    } else {
        cb(null, siteChartStore[siteName]);
    }
}

/* Helper to send responses to frontend */
function sendJsonResponse(res, obj) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(JSON.stringify(obj));
}

/* helper to determine client ip */
function getClientIp(req) {
    var ip = req.ip;
    if (req.headers.hasOwnProperty('x-real-ip')) {
        ip = req.headers['x-real-ip'];
    }
    return ip;
}

/* clean up throttle map every couple of minutes */
setInterval(reqThrottle.garbageCollectMap, 2000);

/* Host static content from /public */
app.use(express.static(__dirname + '/public'));

/* GET requests to /rootPoll.json means the site is being served from /public */
app.get('/rootPoll.json', function(req, res) {
    console.log('Request /rootPoll.json from %s for ', getClientIp(req));

    sha(function(version) {
        sendJsonResponse(res, { apiBaseurl: '', version: version });
    });
});


/* GET requests to /voteData return chart data values */
app.get('/voteData', function(req, res) {
    console.log('Request for /voteData from %s ', getClientIp(req));
    var nocache = req.query.hasOwnProperty('nocache');
    getChartData(req.headers.host, nocache, function(err, data) {
        var chartData = data;
        if (err) {
            console.log(err);
            sendJsonResponse(res, { error: err });
        } else {
            if (req.query.hasOwnProperty('voteCountsOnly')) {
                sendJsonResponse(res, chartData.getAllVoteCounts());
            } else {
                sendJsonResponse(res, chartData.getChartProperties());
            }
        }
    });
});

/* GET requests to /addVote to increment counts */
app.get('/addVote', function(req, res) {
    var ip = getClientIp(req);
    if (!reqThrottle.checkIpAddress(ip)) {
        console.log('Request throttled from %s for /addVote', ip);
        sendJsonResponse(res, { error: 'Request throttled' });
        return;
    }

    if (!req.query.hasOwnProperty('color')) {
        console.log('No vote specified in params');
        sendJsonResponse(res, { count: 0 });
        return;
    }

    var nocache = req.query.hasOwnProperty('nocache');
    getChartData(req.headers.host, nocache, function(err, data) {
        console.log('Request for /addVote from %s ', ip);
        reqThrottle.logIpAddress(ip);
        if (err) {
            console.log(err);
            sendJsonResponse(res, { error: err });
            return;
        }
        if (!data.standUpTimeExists(req.query.color)) {
            console.log('Vote for unlisted StandUp time ' + req.query.color);
            sendJsonResponse(res, { error: 'Unlisted StandUp time' });
            return;
        }

        /*jshint -W101 */
        ddbPersist.addVote(req.headers.host, req.query.color, function(err) {
            console.log('Adding vote for ' + req.query.color);
            if (err) {
                console.log(err);
                sendJsonResponse(res, { error: 'Could not add vote count in the DynamoDB database' });
                return;
            }

            updateVoteCountsFromDdb(req.headers.host, function(err, data) {
                if (err) {
                    console.log(err);
                    sendJsonResponse(res, { error: 'Could not add vote count in the DynamoDB database' });
                    return;
                }
                sendJsonResponse(res, { count: data.getCount(req.query.color) });
            });
        });
        /*jshint +W101 */
    });
});

ddbPersist.init(function(err) {
    var server;
    if (err) {
        console.log('Failed to init DynamoDB persistence');
        console.log(err);
        process.exit(1);
    }

    server = app.listen(serverPort, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Listening on %s:%s', host, port);
        if (process.env.hasOwnProperty('AUTOMATED_ACCEPTANCE_TEST')) {
            require('fs').writeFileSync(__dirname + '/dev-lib/targetPort.js',
                'module.exports = ' + port + ';\n');
        }
    });
});