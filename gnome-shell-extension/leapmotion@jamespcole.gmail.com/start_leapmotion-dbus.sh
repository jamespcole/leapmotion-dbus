#!/bin/bash
kill $(ps ux -u $USER -U $USER | grep '[g]estures.js' | awk '{print $2}') > /dev/null 2>&1
node ~/.local/share/leapmotion-dbus/gestures.js