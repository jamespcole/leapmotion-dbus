var Leap = require('leapjs');
var dbus = require('dbus-native');

var controller = new Leap.Controller({enableGestures: true});
var lm_connected = false;


controller.on("frame", function(frame) {
  //logToConsole("Frame: " + frame.id + " @ " + frame.timestamp);
});

/*
* Utility functions
*/
var debug = true;
function logToConsole(obj1, obj2) {
	if(debug) {
		if(obj2 !== "undefined") {
			console.log(obj1, obj2);
		}
		else {
			console.log(obj1);
		}
	}
}


function getFingerCount(fingerArray) {
	var count = 0;
	for(var i = 0; i < fingerArray.length; i++) {
		var finger = fingerArray[i];
		if(finger.extended) {
			count++;
		}
	}
	return count;
}


/*
* Swipe gesture handler
* Handles left, right, up and down and also passes the number of fingers used
*/

var swiper = controller.gesture('swipe');

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
		//logToConsole(xDir, yDir);
		var fingers = 0;
		if(g.lastFrame.fingers) {

			fingers = getFingerCount(g.lastFrame.fingers);
			logToConsole('fingers', fingers);			
		}

		var direction_axis = (Math.abs(g.translation()[0]) > Math.abs(g.translation()[1])) ? 'x': 'y';

		if(direction_axis == 'y') {
		
			var scale_y = Math.abs(g.translation()[1]);
			if(scale_y < 0) {
				scale_y *= -1;
			}
			if(yDir == 1) {
				if((last_down_swipe + same_type_debounce_ms) > new Date().getTime()) {
					logToConsole('debounced down swipe');
					return;
				}
				if(last_up_swipe + debounce_ms < new Date().getTime()) {
					logToConsole('swipe down');
					leapDbus.emit('LeapMotionSwipeDown', scale_y, fingers);
					last_down_swipe = new Date().getTime();
				}
				else {
					logToConsole('swipe down cancelled becuase there was a recent up swipe');
				}
			}
			else if(yDir == -1){
				if((last_up_swipe + same_type_debounce_ms) > new Date().getTime()) {
					logToConsole('debounced up swipe');
					return;
				}
				if(last_down_swipe + debounce_ms < new Date().getTime()) {
					logToConsole('swipe up');
					leapDbus.emit('LeapMotionSwipeUp', scale_y, fingers);
					last_up_swipe = new Date().getTime();
				}
				else {
					logToConsole('swipe up becuase there was a recent down swipe');
				}

			}			
		}
		else {
			
			var scale_x = Math.abs(g.translation()[0]);
			if(scale_x < 0) {
				scale_x *= -1;
			}
			if(xDir == 1) {
				if((last_right_swipe + same_type_debounce_ms) > new Date().getTime()) {
					logToConsole('debounced right swipe');
					return;
				}
				if(last_left_swipe + debounce_ms < new Date().getTime()) {
					logToConsole('swipe right');
					leapDbus.emit('LeapMotionSwipeRight', scale_x, fingers);

					last_right_swipe = new Date().getTime();
				}
				else {
					logToConsole('swipe right cancelled');
				}
			}
			else if(xDir == -1){
				if((last_left_swipe + same_type_debounce_ms) > new Date().getTime()) {
					logToConsole('debounced left swipe');
					return;
				}
				if(last_right_swipe + debounce_ms < new Date().getTime()) {
					logToConsole('swipe left');
					leapDbus.emit('LeapMotionSwipeLeft', scale_x, fingers);

					last_left_swipe = new Date().getTime();
				}
				else {
					logToConsole('swipe left cancelled');
				}

			}
		}
	}
	else {
		logToConsole('below tolerance');
	}
});



/*
* Key tap event handling
*/


var key_tap = controller.gesture('keyTap');
var last_key_tap = new Date().getTime();
var key_tap_debounce = 150;
key_tap.stop(function(g) {
	if((last_key_tap + key_tap_debounce) < new Date().getTime()) {		

		last_key_tap = new Date().getTime();		

		//key taps and swipedown both trigger on the same gesture
		//so handle it in the swipe down
		setTimeout(function() {
			if(last_down_swipe + 150 < new Date().getTime()) {
				var fingers = 0;
				if(g.lastFrame.fingers) {
					fingers = getFingerCount(g.lastFrame.fingers);					
				}
				logToConsole('key tap', fingers);
				leapDbus.emit('LeapMotionKeyTap', fingers);
			}
			else {
				logToConsole('key tap cancelled because it was part of a swipe');
			}

		}, 100);
	}
	else {
		logToConsole('key tap debounced');
	}
});



/*
* Fingers changed events
*/

var fingers_count = 0;

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
			if(fingers_count != getFingerCount(frame.fingers)) {
				index = 0;
				var old_finger_count =  fingers_count;
				fingers_count = getFingerCount(frame.fingers);
			}


			fingers_arr[fingers_index] = getFingerCount(frame.fingers);
			fingers_index++;
			if(fingers_index == max_fingers) {

				fingers_index = 0;
				//console.log(fingers_count + ' fingers detected');
				current_fingers = fingers_count;
				if(fingers_count != 1) {//ignore single finger
					if(previous_fingers != fingers_count) {
						console.log('fingers changed from ' + previous_fingers + ' to ' + fingers_count);
						leapDbus.emit('LeapMotionFingersChanged', [previous_fingers, fingers_count]);
						previous_fingers = fingers_count;
					}
				}

			}

		}
		//console.log(mode);
	}, 100);
});

/*
* Circle gesture
*/
var last_circle = new Date().getTime();
var circle = controller.gesture('circle');
var circle_higher_debouce = 150;//for five fingers we need a higher debounce
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
			var fingers = getFingerCount(g.lastFrame.fingers);
			if (dotProduct  >  0) {
				clockwise = true;
			}
			var direction_str = (clockwise) ? 'clockwise' : 'anticlockwise';
			console.log(direction_str + ' ' + progress + ' times', clockwise);
			var debounce_time = (fingers > 2) ? circle_higher_debouce * fingers : same_type_debounce_ms;

			if((last_circle + debounce_time) < new Date().getTime()) {
				last_circle = new Date().getTime();
				if(clockwise) {
					leapDbus.emit('LeapMotionClockWise', progress, fingers);
				}
				else {
					leapDbus.emit('LeapMotionAntiClockWise', progress, fingers);
				}
			}
			else {
				logToConsole('debounced circle gesture');
			}
		}
		else {
			logToConsole('circle direction could not be calculated');
		}

	}
});


/*
* This is for moving the cursor with a single finger
*/
var last_pointer_move = new Date().getTime();
var pointer_move_debouce = 40;

controller.on("frame", function(frame) {
  
  if(frame.pointables && frame.pointables.length) {
		var point_threshold = 0.2;
		
		var fingers = getFingerCount(frame.fingers);

		if(fingers == 1) {

			var pointable = null;
			for(var i = 0; i < frame.fingers.length; i++) {
				var finger = frame.fingers[i];
				if(finger.extended) {
					pointable = finger;
					break;
				}
			}
			
			var stabilizedPosition = pointable.stabilizedTipPosition;
			var interactionBox = frame.interactionBox;
	        var normalizedPosition = interactionBox.normalizePoint(stabilizedPosition);
			
			if((normalizedPosition[0] > point_threshold || normalizedPosition[0] < (point_threshold * -1)) && (normalizedPosition[1] > point_threshold || normalizedPosition[1] < (point_threshold * -1))) {

				if((last_pointer_move + pointer_move_debouce) < new Date().getTime()) {
					last_pointer_move = new Date().getTime();					
				
					leapDbus.emit('LeapMotionPointerMove', normalizedPosition[0], normalizedPosition[1], fingers);
				}
				else {
					logToConsole('Debounced pointer move cumulative movements');
				}
			
			}
		}		
  }

});


controller.on('deviceStreaming', function() {
    console.log("deviceConnected");
    lm_connected = true;
	leapDbus.emit('LeapMotionControllerConnected');
});
controller.on('deviceStopped', function() {
	lm_connected = false;
	leapDbus.emit('LeapMotionControllerDisconnected');
	logToConsole('LeapMotion Disconnected');
});

/*
* DBUS Interface definition
*/


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
        LeapMotionKeyTap: ['i'],
        LeapMotionScreenTap: ['s'],
        //LeapMotionControllerDisconnected: [],
        LeapMotionPointerMove: ['ddi'],
        LeapMotionFingersChanged: [ 'ai', 'from_and_to' ],
        LeapMotionSwipeDown: ['ii'],
        LeapMotionSwipeUp: ['ii'],
        LeapMotionSwipeLeft: ['ii'],
        LeapMotionSwipeRight: ['ii'],
        LeapMotionClockWise: ['ii'],
        LeapMotionAntiClockWise: ['ii'],
        KeyTap: [],
        ScreenTap: []
    },
    properties: {
       TestProperty: 'y'
    }
};

var leapDbus = {
    respondWithDouble: function(s) {
        logToConsole('Received "' + s + "'");
        return 3.14159;
    },
    timesTwo: function(d) {
	logToConsole(d);
        return d*2;
    },
    doStuff: function(s) {
        return 'Received "' + s + '" - this is a reply';
    },
    TestProperty: 42,
    emit: function(name, param1, param2) {
        logToConsole('signal emit', name, param1, param2);
    }
};

bus.exportInterface(leapDbus, '/com/jamespcole/leapmotion/dbus/Events', leapmotionIface);

















controller.connect();

//Send a heartbeat dbus event for listening apps to 
//detect whether the leapmotion is still connected
setInterval( function() {
	leapDbus.emit('LeapMotionHeartbeat', lm_connected);
}, 20000);


