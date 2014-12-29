#leapmotion-dbus

Provides a nodejs script that translates LeapMotion events into dbus events.  It sends the following dbus events:

* LeapMotionSwipeUp
** int scale - the size of the swipe on the y axis
** int fingers - the number of fingers used

* LeapMotionSwipeDown
** int scale - the size of the swipe on the y axis
** int fingers - the number of fingers used

* LeapMotionSwipeLeft
** int scale - the size of the swipe on the x axis
** int fingers - the number of fingers used

* LeapMotionSwipeRight
** int scale - the size of the swipe on the x axis
** int fingers - the number of fingers used

* LeapMotionKeyTap
** int fingers - the number of fingers used

* LeapMotionFingersChanged
** int previous fingers - the number of fingers before the change
** int current fingers - the number of fingers after the change

* LeapMotionClockWise
** decimal count - the number of time around
** int fingers - the number of fingers used

* LeapMotionAntiClockWise
** decimal count - the number of time around
** int fingers - the number of fingers used

* LeapMotionPointerMove - only sent when a single finger is used
** decimal x position - the normalised x position of the pointer used
** decimal y position - the normalised y position of the pointer used
** int fingers - the number of fingers used
** Note: if you are using normalised positions to calculate screen postition use the following formulas: (x = normalised_x * monitor_width) and (y = monitor_height - normalised_y * monitor_height)

* LeapMotionControllerConnected
** sent when a leap motion device is detected 

* LeapMotionControllerDisconnected
** sent when a leap motion device is disconnected

*LeapMotionHeartbeat - sent every 20 seconds
** bool connected - whether a leap motion device is connected


Still very much a work in progress but serves as a proof of concept.

Also includes preliminary gnome-shell integration

#Controls

The Gnome Shell extension is primarily designed to be used one handed and has the following features:
* To reveal the overview hold you closed fist over the leap and then open you hand extending all 5 fingers
* In overview mode make clockwise or anti-clockwise gestures to choose from running apps
* Change worksaces by swiping up and down
* To close the overview close your hand into a fist again
* To bring up the Alt-Tab menu hold a closed fist over the leap and then extend 4 fingers(all except your thumb)
* Swipe left and right to select apps then close your fist to select

#Installation

sudo cp com.jamespcole.leapmotion.dbus.Events.conf /etc/dbus-1/system.d/
Install leap motion SDK

npm install leapjs

npm install dbus-native

For gnome shell integration

sudo apt-get install xdotool

Gnome Shell extension installation instuctions coming soon!

# Running It
Clone this repo and then run:

node gestures.js