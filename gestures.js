var Leap = require('leapjs');
//var dbus = require('node-dbus');
var dbus = require('dbus-native');
var sys = require('sys')
var exec = require('child_process').exec;
var child;



var controller = new Leap.Controller({enableGestures: true});
/*controller.on("frame", function(frame) {
  //console.log("Frame: " + frame.id + " @ " + frame.timestamp);
  if(frame.pointables && frame.pointables.length) {
		var point_threshold = 0.3;
		var previous_frame = controller.frame(1);
		var trans = frame.translation(previous_frame);
		var x_val = trans[0];
		var y_val = trans[1];

		if((x_val > point_threshold || x_val < (point_threshold * -1)) && (y_val > point_threshold || y_val < (point_threshold * -1))) {
			var x = Math.ceil(x_val);// * (1920 / 256);
			var y = Math.ceil(y_val);// * (1080 / 256);
			y = y * -1;//flip the y axis
			console.log('move', x, y, x_val, y_val, frame.fingers.length);
			console.log(frame.fingers);
			//for some weird reason it is returning one finger even when using a fist so I'm using the debounced value
			leapDbus.emit('LeapMotionPointerMove', x, y, current_fingers);

		}
  }

});*/

var fingers_count = 0;
var frameCount = 0;
//var mode = 0;

//var alt_tab_loaded = false;
var fingers_arr = [];
var fingers_index = 0;
var max_fingers = 3;

var current_fingers = 0;
var previous_fingers = 0;

controller.on('connect', function(){
	setInterval(function(){
		var frame = controller.frame();
		if(frame.hands.length) {
			if(fingers_count != frame.fingers.length) {
				index = 0;
				var old_finger_count =  fingers_count;
				fingers_count = frame.fingers.length;
			}


			fingers_arr[fingers_index] = frame.fingers.length;
			fingers_index++;
			if(fingers_index == max_fingers) {

				fingers_index = 0;
				//console.log(fingers_count + ' fingers detected');
				current_fingers = fingers_count;
				if(fingers_count != 1) {//ignore single finger
					if(previous_fingers != fingers_count) {
						console.log('fingers changed from ' + previous_fingers + ' to ' + fingers_count);
						leapDbus.emit('FingersChanged', [previous_fingers, fingers_count]);
						previous_fingers = fingers_count;
					}
				}

			}

		}
		//console.log(mode);
	}, 100);
});

var swiper = controller.gesture('swipe');
var tolerance = 50;
var last_up_swipe = new Date().getTime();
var last_down_swipe = new Date().getTime();
var last_left_swipe = new Date().getTime();
var last_right_swipe = new Date().getTime();
var debounce_ms = 1000;
var same_type_debounce_ms = 150;//this is for debouncing events of the same type that fire multiple times when using multiple fingers

swiper.stop(function(g) {
	if (Math.abs(g.translation()[0]) > tolerance || Math.abs(g.translation()[1]) > tolerance) {
		var xDir = Math.abs(g.translation()[0]) > tolerance ? (g.translation()[0] > 0 ? -1 : 1) : 0;
		var yDir = Math.abs(g.translation()[1]) > tolerance ? (g.translation()[1] < 0 ? -1 : 1) : 0;
		console.log(xDir, yDir);
		var fingers = 0;
		if(g.lastFrame.fingers) {

			console.log('fingers', g.lastFrame.fingers.length);
			fingers = g.lastFrame.fingers.length;
		}

		var direction_axis = (Math.abs(g.translation()[0]) > Math.abs(g.translation()[1])) ? 'x': 'y';

		if(direction_axis == 'y') {
			//if((last_down_swipe + same_type_debounce_ms) < new Date().getTime()) {
				var scale_y = Math.abs(g.translation()[1]);
				if(scale_y < 0) {
					scale_y *= -1;
				}
				if(yDir == 1) {
					if((last_down_swipe + same_type_debounce_ms) > new Date().getTime()) {
						console.log('debounced down swipe');
						return;
					}
					if(last_up_swipe + debounce_ms < new Date().getTime()) {
						console.log('swipe down');
						leapDbus.emit('SwipeDown', scale_y, fingers);
						last_down_swipe = new Date().getTime();
					}
					else {
						console.log('swipe down cancelled becuase there was a recent up swipe');
					}
				}
				else if(yDir == -1){
					if((last_up_swipe + same_type_debounce_ms) > new Date().getTime()) {
						console.log('debounced up swipe');
						return;
					}
					if(last_down_swipe + debounce_ms < new Date().getTime()) {
						console.log('swipe up');
						leapDbus.emit('SwipeUp', scale_y, fingers);
						last_up_swipe = new Date().getTime();
					}
					else {
						console.log('swipe up becuase there was a recent down swipe');
					}

				}
			/*}
			else {
				console.log('debounced vertical swipe');
			}*/
		}
		else {
			//if((last_left_swipe + same_type_debounce_ms) < new Date().getTime() || (last_right_swipe + same_type_debounce_ms) < new Date().getTime()) {
				/*if((last_left_swipe + same_type_debounce_ms) < new Date().getTime()) {
					console.log('debounced left swipe');
					return;
				}
				if((last_right_swipe + same_type_debounce_ms) < new Date().getTime()) {
					console.log('debounced right swipe');
					return;
				}*/
				var scale_x = Math.abs(g.translation()[0]);
				if(scale_x < 0) {
					scale_x *= -1;
				}
				if(xDir == 1) {
					if((last_right_swipe + same_type_debounce_ms) > new Date().getTime()) {
						console.log('debounced right swipe');
						return;
					}
					if(last_left_swipe + debounce_ms < new Date().getTime()) {
						console.log('swipe right');
						leapDbus.emit('SwipeRight', scale_x, fingers);

						last_right_swipe = new Date().getTime();
					}
					else {
						console.log('swipe right cancelled');
					}
				}
				else if(xDir == -1){
					if((last_left_swipe + same_type_debounce_ms) > new Date().getTime()) {
						console.log('debounced left swipe');
						return;
					}
					if(last_right_swipe + debounce_ms < new Date().getTime()) {
						console.log('swipe left');
						leapDbus.emit('SwipeLeft', scale_x, fingers);

						last_left_swipe = new Date().getTime();
					}
					else {
						console.log('swipe left cancelled');
					}

				}
			/*}
			else {
				console.log('debounced horizontal swipe');
			}*/
		}

		/*if(mode == 3) {

			if(xDir == 1) {
				sendKeys('key Tab');
				console.log('swipe left');
			}
			else if(xDir == -1){
				sendKeys('key Shift+Tab');
				console.log('swipe right');
			}
		}*/
		/*if(g.lastFrame.fingers && g.lastFrame.fingers.length == 2) {
			if(xDir == 1)
				console.log('swipe left');
			else if(xDir == -1)
				console.log('swipe right');
			//sendKeys('keydown alt key Tab; xdotool Tab; sleep .5; xdotool keyup alt');
			console.log('next window');
			mode = 0;
		}*/


	}
	else {
		console.log('below tolerance');
	}
});

var tap = controller.gesture('screenTap');
tap.stop(function(g) {
	console.log('screen tap');
	console.log(g.lastFrame.id);
	//sendKeys('keyup alt');
	//changeMode(0);
});

var key_tap = controller.gesture('keyTap');
var last_key_tap = new Date().getTime();
var key_tap_debounce = 150;
key_tap.stop(function(g) {
	//console.log(key_tap_debounce, last_key_tap, new Date().getTime());
	if((last_key_tap + key_tap_debounce) < new Date().getTime()) {
		/*console.log(g);
		if(g.frames.length > 1) {
			g.lastFrame.translation()
		}*/
		//var xDir = Math.abs(g.translation()[0]) > tolerance ? (g.translation()[0] > 0 ? -1 : 1) : 0;
		//var tolerance = 25;
		//var yDir = Math.abs(g.translation()[1]) > tolerance ? (g.translation()[1] < 0 ? -1 : 1) : 0;

		/*console.log('key tap');
		last_key_tap = new Date().getTime();
		leapDbus.emit('KeyTap', null, null);*/

		last_key_tap = new Date().getTime();

		//key taps and swipedown both trigger on the same gesture
		//so handle it in the swipe down
		setTimeout(function() {
			if(last_down_swipe + 150 < new Date().getTime()) {
				console.log('key tap');
			}
			else {
				console.log('key tap cancelled because it was part of a swipe');
			}

		}, 100);
	}
	else {
		console.log('key tap debounced');
	}
	/*for(var i in g) {
		console.log(i);
	}*/
	//console.log(g.lastGesture.id);
	//console.log(g.lastFrame.id, g.id);
	//sendKeys('keyup alt');
	//changeMode(0);
});

var circle = controller.gesture('circle');
circle.stop(function(g) {

	var gesture = g.lastGesture;
	var clockwise = false;
	var progress = gesture.progress;
	//console.log(gesture.pointableIds);
	var pointableID = gesture.pointableIds[0];
	if(pointableID && g.lastFrame.pointable(pointableID)) {

		var direction =  g.lastFrame.pointable(pointableID).direction;
		console.log(gesture.normal, direction);
		if(direction !== undefined) { //this happens when a swipe occurs during the circle gesture
			var dotProduct = Leap.vec3.dot(direction, gesture.normal);

			if (dotProduct  >  0) {
				clockwise = true;
			}
			var direction_str = (clockwise) ? 'clockwise' : 'anticlockwise';
			console.log(direction_str + ' ' + progress + ' times', clockwise);
		}
		else {
			console.log('circle direction could not be calculated');
		}

	}
});


//var connected;// = false;
var lm_connected = false;

controller.on('ready', function() {
    console.log("ready");
    lm_connected = true;
});
controller.on('connect', function() {
	//lm_connected = true;
    console.log("connect");
    leapDbus.emit('LeapMotionControllerConnected');
});
controller.on('disconnect', function() {
	lm_connected = false;
    console.log("disconnect");
    leapDbus.emit('LeapMotionControllerDisconnected');
});
controller.on('focus', function() {
    console.log("focus");
});
controller.on('blur', function() {
    console.log("blur");
});
controller.on('deviceConnected', function() {
	lm_connected = true;
    console.log("deviceConnected");
    leapDbus.emit('LeapMotionConnected');
});
controller.on('deviceDisconnected', function() {
	lm_connected = false;
    console.log("deviceDisconnected");
    leapDbus.emit('LeapMotionDisconnected');
});


//to test
//dbus-send --print-reply --type=method_call --dest='com.jamespcole.leapmotion' '/com/jamespcole/leapmotion/dbus/Events' com.jamespcole.leapmotion.dbus.Events.respondWithDouble string:'test123'

var bus = dbus.sessionBus();
var name = 'com.jamespcole.leapmotion';
bus.requestName(name, 0);

var leapmotionIface = {
    name: 'com.jamespcole.leapmotion.dbus.Events',
    methods: {
        doStuff: ['s', 's'],
        timesTwo: ['d', 'd'],
        respondWithDouble: ['s', 'd']
    },
    signals: {
        testsignal: [ 'us', 'name1', 'name2' ],
        LeapMotionHeartbeat: ['b'],
        LeapMotionConnected: [],
        LeapMotionDisconnected: [],
        LeapMotionControllerConnected: [],
        LeapMotionControllerDisconnected: [],
        LeapMotionKeyTap: ['s'],
        LeapMotionScreenTap: ['s'],
        //LeapMotionControllerDisconnected: [],
        LeapMotionPointerMove: ['iii'],
        FingersChanged: [ 'ai', 'from_and_to' ],
        SwipeDown: ['ii'],
        SwipeUp: ['ii'],
        SwipeLeft: ['ii'],
        SwipeRight: ['ii'],
        KeyTap: [],
        ScreenTap: []
    },
    properties: {
       TestProperty: 'y'
    }
};

var leapDbus = {
    respondWithDouble: function(s) {
        console.log('Received "' + s + "'");
        return 3.14159;
    },
    timesTwo: function(d) {
	console.log(d);
        return d*2;
    },
    doStuff: function(s) {
        return 'Received "' + s + '" - this is a reply';
    },
    TestProperty: 42,
    emit: function(name, param1, param2) {
        console.log('signal emit', name, param1, param2);
    }
};

bus.exportInterface(leapDbus, '/com/jamespcole/leapmotion/dbus/Events', leapmotionIface);


/*setInterval( function() {
	leapDbus.emit('testsignal', Date.now(), 'param2');
}, 60000);*/
//setInterval( function() {
	/*console.log(controller.connection.connected);
	for(var i in controller) {
		console.log(i);
	}*/
//	leapDbus.emit('LeapMotionHeartbeat', connected);
//}, 1000);





controller.connect();
console.log("\nWaiting for device to connect...");

setInterval( function() {
	//console.log(lm_connected);
	leapDbus.emit('LeapMotionHeartbeat', lm_connected);
}, 20000);