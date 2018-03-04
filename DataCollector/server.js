// [START app]
'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PubSub = require('@google-cloud/pubsub');


/*
 *  Define Middleware & Utilties
 **********************************
 */
var allowCrossDomain = function (req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
    }
    res.header('Access-Control-Allow-Credentials', true);
    // send extra CORS headers when needed
    if (req.headers['access-control-request-method'] || req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', 'X-Requested-With');
        res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.header('Access-Control-Max-Age', 1728000); // 20 days
        // intercept OPTIONS method
        if (req.method == 'OPTIONS') {
            res.send(200);
        }
    } else {
        next();
    }
};

// trim string value and enclose it with double quotes if needed
var parseValue = function (value) {
    if (typeof value === "string") {
        // trim
        value = value.replace(/^\s+|\s+$/g, '');
        if (value == "") {
            value = '""';
        } else if (value.split(' ').length > 1) {
            // enclose with "" if needed
            value = '"' + value + '"';
        }
    }
    return value;
}

// decode and parse query param param
var parseDataQuery = function (req, debug) {
    if (!req.query.data) {
        if (debug) {
            console.error('No \'data\' query param defined!')
        };
        return false;
    }
    var data = {};
    try {
        data = JSON.parse(decodeURIComponent(req.query.data));
    } catch (e) {
        if (debug) {
            console.error('Failed to JSON parse \'data\' query param')
        };
        return false;
    }
    return data;
}


var createAndPublishEvent =function(data, req ){
var projectId = process.env.GCP_ProjectId;
var topicName ='test';
var pubsubClient = PubSub({projectId: projectId});
var time = (data && data.t) || new Date().toISOString(),
    event = (data && data.e) || "unknown",
    properties = (data && data.kv) || {};

// append some request headers (ip, referrer, user-agent) to list of properties
properties.ip = req.ip;
properties.origin = (req.get("Origin"))
    ? req
        .get("Origin")
        .replace(/^https?:\/\//, '')
    : "";
properties.page = req.get("Referer");
properties.useragent = req.get("User-Agent");

var payloadData = {
    'time': time,

}
// log event data in logstash friendly timestamp + key/value(s) format
var entry = time + " event=" + parseValue(event);
 payloadData.event = parseValue(event);
for (var key in properties) {
    var value = parseValue(properties[key]);
    entry += " " + key + "=" + value;
    payloadData[key]=value;
}

entry += "\n";

//const dataBuffer = Buffer.from(entry);
const dataBuffer = Buffer.from(JSON.stringify(payloadData));


// Publishes the message
return pubsubClient
    .topic(topicName)
    .publisher()
    .publish(dataBuffer)
    .then(results => {
        const messageId = results;

        // Update the counter value
       // setPublishCounterValue(parseInt(attributes.counterId, 10) + 1);

        console.log(`Message ${messageId} published.`);
fs.appendFile(path.resolve(__dirname, './events1.log'), messageId, function (err) {
        if (err) {
            console.log(err);
        } else {
            //console.log("Logged tracked data");
        }
    });
        return messageId;
    })
    .catch(err => {
        console.error('ERROR:', err);
    });


}
// create single event based on data which includes time, event & properties
var createAndLogEvent = function (data, req) {
    var time = (data && data.t) || new Date().toISOString(),
        event = (data && data.e) || "unknown",
        properties = (data && data.kv) || {};

    // append some request headers (ip, referrer, user-agent) to list of properties
    properties.ip = req.ip;
    properties.origin = (req.get("Origin"))
        ? req
            .get("Origin")
            .replace(/^https?:\/\//, '')
        : "";
    properties.page = req.get("Referer");
    properties.useragent = req.get("User-Agent");

    // log event data in logstash friendly timestamp + key/value(s) format
    var entry = time + " event=" + parseValue(event);
    for (var key in properties) {
        var value = parseValue(properties[key]);
        entry += " " + key + "=" + value;
    }
    entry += "\n";
    fs.appendFile(path.resolve(__dirname, './events.log'), entry, function (err) {
        if (err) {
            console.log(err);
        } else {
            //console.log("Logged tracked data");
        }
    });
};

app.use(allowCrossDomain);

/*
 *  Create Tracking Endpoints
 **********************************
 */
app.use('/static', express.static('public'));

// API endpoint tracking
app
    .get('/track', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        var data;
        // data query param required here
        if ((data = parseDataQuery(req, true)) === false) {
            res.send('0');
        }
        createAndPublishEvent(data, req);
        res.send('1');
    });

// IMG beacon tracking - data query optional
app.get('/t.gif', function (req, res) {
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'private, no-cache, no-cache=Set-Cookie, proxy-revalidate');
    res.setHeader('Expires', 'Sat, 01 Jan 2000 12:00:00 GMT');
    res.setHeader('Pragma', 'no-cache');
    // data query param optional here
    var data = parseDataQuery(req) || {};
    // fill in default success event if none specified
    if (!data.e) {
        data.e = "success";
    }
    createAndPublishEvent(data, req);
    res.sendfile(path.resolve(__dirname, './t.gif'));
});

app.get('/', (req, res) => {
    res
        .status(200)
        .send('Hello,--------------------------- world!')
        .end();
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});