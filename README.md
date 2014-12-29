#leapmotion-dbus

Provides a nodejs script that translates LeapMotion events into dbus events.

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