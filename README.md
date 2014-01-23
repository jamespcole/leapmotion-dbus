leapmotion-dbus
===============

Provides a nodejs script that translates LeapMotion events into dbus events.

Still very much a work in progress but serves as a proof of concept.

Also includes preliminary gnome-shell integration

Installation

sudo cp com.jamespcole.leapmotion.dbus.Events.conf /etc/dbus-1/system.d/

sudo apt-get install socat

npm install dbus-native

sudo apt-get install xdotool
