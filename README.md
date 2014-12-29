#leapmotion-dbus

Provides a nodejs script that translates LeapMotion events into dbus events.  Dbus is supported on Linux, OSX and Unix as a way to send messages between different applications.  
This has only been tested on Ubuntu 14.04 but should work on other *nix systems without modification.  It was developed using nodejs v0.10.33 but may work on other versions.

The Gnome Shell extension has only bee tested in gnome-shell 3.10.4 and will probably not work on older versions on gnome-shell.

leapmotion-dbus sends the following dbus events published to the dbus interface "com.jamespcole.leapmotion.dbus.Events":

_LeapMotionSwipeUp_
+ int scale - the size of the swipe on the y axis
+ int fingers - the number of fingers used

_LeapMotionSwipeDown_
+ int scale - the size of the swipe on the y axis
+ int fingers - the number of fingers used

_LeapMotionSwipeLeft_
+ int scale - the size of the swipe on the x axis
+ int fingers - the number of fingers used

_LeapMotionSwipeRight_
+ int scale - the size of the swipe on the x axis
+ int fingers - the number of fingers used

_LeapMotionKeyTap_
+ int fingers - the number of fingers used

_LeapMotionFingersChanged_
+ int previous fingers - the number of fingers before the change
+ int current fingers - the number of fingers after the change

_LeapMotionClockWise_
+ decimal count - the number of time around
+ int fingers - the number of fingers used

_LeapMotionAntiClockWise_
+ decimal count - the number of time around
+ int fingers - the number of fingers used

_LeapMotionPointerMove_ - only sent when a single finger is used
+ decimal x position - the normalised x position of the pointer used
+ decimal y position - the normalised y position of the pointer used
+ int fingers - the number of fingers used
+ Note: if you are using normalised positions to calculate screen postition use the following formulas: (x = normalised_x * monitor_width) and (y = monitor_height - normalised_y * monitor_height)

_LeapMotionControllerConnected_
+ sent when a leap motion device is detected 

_LeapMotionControllerDisconnected_
+ sent when a leap motion device is disconnected

_LeapMotionHeartbeat_ - sent every 20 seconds
+ bool connected - whether a leap motion device is connected


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

Better install instructions are coming soon including automated installation scripts, here are the basics for now:

`sudo cp com.jamespcole.leapmotion.dbus.Events.conf /etc/dbus-1/system.d/`

Install leap motion SDK

`npm install leapjs`

`npm install dbus-native`

For gnome shell integration

`sudo apt-get install xdotool`

Gnome Shell extension installation instuctions coming soon!

# Running It
Clone this repo and then run:

`node gestures.js`

# Deveopment Notes

To make things easier when working on the gnome shell extesntion after installing it delete the directory `~/.local/share/gnome-shell/extensions/leapmotion@jamespcole.gmail.com` and symlink the location to the extension directory in your cloned copy of the repo.

When testing changes to the Gnome Shell extension restart Gnome to see changes by running the following:

`gnome-shell --replace &`

To enable debug output for the dbus script set the variable debug to true in gestures.js.

To see debug messages for the Gnome Shell extension set the variables logToConsole and logToUI to true in extension.js.

# Future Dev

* Finish support for all leap motion gestures
* Package the gnome shell extension
* Create install scripts
* General code cleanup
* Hopefully remove the dependence on xdotool for gnome-shell alt-tab functionality
* Create upstart script so gestures.js can run as a service on Ubuntu
