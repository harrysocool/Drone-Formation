var arDroneConstants 	= require('ar-drone/lib/constants'),
    droneFormation		= require('../../'),
    state				= droneFormation.getData(),
    mission  			= droneFormation.getMission(),
    df 					= require('dateformat');

function navdata_option_mask(c) {
  return 1 << c;
}

// From the SDK.
var navdata_options = (
    navdata_option_mask(arDroneConstants.options.DEMO) 
  | navdata_option_mask(arDroneConstants.options.VISION_DETECT)
  | navdata_option_mask(arDroneConstants.options.MAGNETO)
  | navdata_option_mask(arDroneConstants.options.WIFI)
  | navdata_option_mask(arDroneConstants.options.ALTITUDE)
  | navdata_option_mask(arDroneConstants.options.TIME)
);

// Connect and configure the drone
state.client().config('general:navdata_demo', true);
state.client().config('general:navdata_options', navdata_options);
state.client().config('video:video_channel', 1);
state.client().config('detect:detect_type', 12);
state.client().config('control:control_vz_max', 1000);
state.client().config('control:flight_without_shell', 'FALSE');
state.client().config('control:altitude_max', 3000);

state.log("simpleNavdata-" + df(new Date(), "yyyy-mm-dd_hh-MM-ss") + ".txt");
mission.log("missionLog-" + df(new Date(), "yyyy-mm-dd_hh-MM-ss") + ".txt");

state.client().on('navdata', function (d) {
    if (d.visionDetect && d.demo && d.time) {
        console.log("Detected: %j", d.visionDetect.nbDetected);
        console.log(d.demo.batteryPercentage);
    }
});

//state.client().disableEmergency();
state.client().ftrim();
mission.takeoff()
	   .wait(1000)
	   .altitude(1.5)
	   .wait(1000)
	   .forward(1.5)
       .wait(1000)
	   .right(0.5)
       .wait(1000)
	   .backward(1.5)
	   .wait(1000)
	   .left(0.5)
	   .wait(1000)
       .land();

// Land on ctrl-c
var exiting = false;
process.on('SIGINT', function() {
    if (exiting) {
        process.exit(0);
    } else {
        console.log('Got SIGINT. Landing, press Control-C again to force exit.');
        exiting = true;
        mission.control().disable();
        mission.client().land(function() {
            process.exit(0);
        });
    }
});

mission.run(function (err, result) {
    if (err) {
        console.trace("Oops, something bad happened: %s", err.message);
        mission.client().stop();
        mission.client().land();
    } else {
        console.log("We are done!");
        process.exit(0);
    }
});
