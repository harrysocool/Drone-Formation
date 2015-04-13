var EventEmitter 		= require('events').EventEmitter,
	util         		= require('util'),
	fs    				= require('fs');
	
// Main Function
module.exports = getSimpleNavdata;
util.inherits(getSimpleNavdata, EventEmitter);
function getSimpleNavdata(client, control) {
 	EventEmitter.call(this);
//	this.setMaxListeners(50);
	
	this._client 			= client;
	this._control			= control;
  	this._state 			= {n: 0, time: 0, dt: 0, vx: 0, vy: 0, vz: 0, 
  								roll: 0, pitch: 0, yaw: 0, x: 0, y: 0, z: 0, de:0, bat: 0};
    this._delta_t 			= 0;
  	this._seq				= 0;
  	this._latestNavData 	= {time: 0};	
  	this._bind();
}

getSimpleNavdata.prototype.state = function() {
    return this._state;
}

getSimpleNavdata.prototype.client = function() {
    return this._client;
}

getSimpleNavdata.prototype.control = function() {
    return this._control;
}

// Add a handler on navdata updates
getSimpleNavdata.prototype.pushData = function() {
	var self = this;	
	this._processNavData(self._latestNavData);
}

getSimpleNavdata.prototype._bind = function() {
	var self = this;
	this._client.on('navdata', function(navdata) {
		if(navdata.time){
			self._delta_t = navdata.time - self._latestNavData.time;
		}
		self._latestNavData = navdata;
		if(self._latestNavData.altitude){
			self.pushData();
		};
	});
}

getSimpleNavdata.prototype._processNavData = function(data) {
    var pitch = data.demo.rotation.pitch.toRad()
      , roll  = data.demo.rotation.roll.toRad()
      , yaw   = normAngle(data.demo.rotation.yaw.toRad())
//      , mag   = data.magneto.heading.fusionUnwrapped.toRad()
      , vx    = data.demo.velocity.x / 1000 //We want m/s instead of mm/s
      , vy    = data.demo.velocity.y / 1000
      , vz    = data.demo.velocity.z / 1000
      , alt   = data.altitude.raw / 1000
      , dt    = this._delta_t;

//    var phi = yaw;
    
//    this._state.x = this._state.x + dt * (vx * Math.cos(phi) - vy * Math.sin(phi));
//    this._state.y = this._state.y + dt * (vx * Math.sin(phi) + vy * Math.cos(phi));
    this._state.z = alt;
    this._state.vx = vx;
    this._state.vy = vy;
    this._state.vz = vz;
    this._state.roll = roll;
    this._state.pitch = pitch;
    this._state.yaw = yaw;
    this._state.bat = data.demo.batteryPercentage;
    this._state.time = data.time;
    this._state.dt = dt;
    this._state.n = this._seq;
    this._state.de = data.visionDetect.nbDetected;
    
  	var self = this;
  	if(this._state.roll){
    	self.emit('state', self.state());
    	self._seq = self._seq + 1;
	};
}

getSimpleNavdata.prototype.log = function(path) {
    var dataStream = fs.createWriteStream(path);
    dataStream.write("n,time,dt,vx,vy,vz,roll,pitch,yaw,x,y,z,detected,battery"+"\n");
    this.on('state', function(s) {
    	var log = (s.n + "," +
        		   s.time + "," +
        		   s.dt + "," +
        		   s.vx + "," +
        		   s.vy + "," +
        		   s.vz + "," +
        		   s.roll + "," +
        		   s.pitch + "," +
        		   s.yaw + "," +
        		   s.x + "," +
        		   s.y + "," +
        		   s.z + "," +
        		   s.de + "," +
        		   s.bat + "\n");
       //log = log + "\n";
       dataStream.write(log);
    });
}

if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

function normAngle(rad) {
    while (rad >  Math.PI) { rad -= 2 * Math.PI;}
    while (rad < -Math.PI) { rad += 2 * Math.PI;}
    return rad;
}

