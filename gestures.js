var Leap = require('leapjs');
//var dbus = require('node-dbus');
var dbus = require('dbus-native');
var sys = require('sys')
var exec = require('child_process').exec;
var child;



var controller = new Leap.Controller({enableGestures: true})
//controller.on("frame", function(frame) {
  //console.log("Frame: " + frame.id + " @ " + frame.timestamp);
//});

var fingers_count = 0;
var frameCount = 0;
//var mode = 0;

//var alt_tab_loaded = false;
var fingers_arr = [];
var fingers_index = 0;
var max_fingers = 3;

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
				console.log(fingers_count + ' fingers detected');
			
				if(fingers_count != 1) {//ignore single finger
					if(previous_fingers != fingers_count) {
						
						leapDbus.emit('FingersChanged', [previous_fingers, fingers_count]);
						previous_fingers = fingers_count;
					}
				}
		
			}

		}
		//console.log(mode);
	}, 300);
});

var swiper = controller.gesture('swipe');
var tolerance = 50;
var last_up_swipe = new Date().getTime()/1000;
var last_down_swipe = new Date().getTime()/1000;
var debounce_ms = 1000;

swiper.stop(function(g) {
	if (Math.abs(g.translation()[0]) > tolerance || Math.abs(g.translation()[1]) > tolerance) {
		var xDir = Math.abs(g.translation()[0]) > tolerance ? (g.translation()[0] > 0 ? -1 : 1) : 0;
		var yDir = Math.abs(g.translation()[1]) > tolerance ? (g.translation()[1] < 0 ? -1 : 1) : 0;
		console.log(xDir, yDir);
		if(g.lastFrame.fingers) {

			console.log('fingers', g.lastFrame.fingers.length);
		}

		var scale_y = Math.abs(g.translation()[1]);
		if(scale_y < 0) {
			scale_y *= -1;
		}
		if(yDir == 1) {			
			if(last_up_swipe + debounce_ms > new Date().getTime()/1000) {
				console.log('swipe down');
				leapDbus.emit('SwipeDown', scale_y);
				last_down_swipe = new Date().getTime();
			}
			else {
				console.log('swipe down cancelled');
			}			
		}
		else if(yDir == -1){
			if(last_down_swipe + debounce_ms > new Date().getTime()/1000) {
				console.log('swipe up');
				leapDbus.emit('SwipeUp', scale_y);
				last_up_swipe = new Date().getTime();
			}
			else {
				console.log('swipe up cancelled');
			}
			
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
		console.log('below tolerance')
	}
});

var tap = controller.gesture('screenTap');
tap.stop(function(g) {
	console.log('tap');
	//sendKeys('keyup alt');
	//changeMode(0);
});



controller.on('ready', function() {
    console.log("ready");
});
controller.on('connect', function() {
    console.log("connect");
});
controller.on('disconnect', function() {
    console.log("disconnect");
});
controller.on('focus', function() {
    console.log("focus");
});
controller.on('blur', function() {
    console.log("blur");
});
controller.on('deviceConnected', function() {
    console.log("deviceConnected");
    leapDbus.emit('LeapMotionConnected');
});
controller.on('deviceDisconnected', function() {
    console.log("deviceDisconnected");
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
        LeapMotionConnected: [],
        FingersChanged: [ 'ai', 'from_and_to' ],
        SwipeDown: ['i'],
        SwipeUp: ['i']
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
}, 1000);*/


controller.connect();
console.log("\nWaiting for device to connect...");