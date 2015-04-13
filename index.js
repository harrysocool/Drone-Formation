var droneFormation = exports;
var ardrone = require('ar-drone');
var autonomy = require('ardrone-autonomy');

exports.getSimpleNavdata = require('./lib/getSimpleNavdata');

var client  = client || ardrone.createClient();
var options = options || {};

exports.getData = function() {
    var control = new autonomy.control(client, options);
    var state = new droneFormation.getSimpleNavdata(client, control);
    return state;
}

exports.getMission = function() {
	var mission = new autonomy.createMission(client,options);
	return mission;
}

