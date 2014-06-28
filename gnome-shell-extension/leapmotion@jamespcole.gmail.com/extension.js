//require('leapjs/template/entry');
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const AltTab = imports.ui.altTab;
//const PanelMenu = imports.ui.panelMenu;
//const PopupMenu = imports.ui.popupMenu;

//const Main = imports.ui.main;
//const Tweener = imports.tweener.tweener;
const Workspace = imports.ui.workspace;
const Overview = imports.ui.overview;
//const WebKit = imports.gi.WebKit;
//const Soup = imports.gi.Soup;

const Gio = imports.gi.Gio;

const Signals = imports.signals;

let altTabExtension = null;

let lm_connected = false;


let ExtensionImports;
ExtensionImports = imports.misc.extensionUtils.getCurrentExtension().imports;


let wsWinOverInjections, createdActors;
function resetState() {
      wsWinOverInjections = { };
      createdActors = [ ];
}

let text, button;

function _hideHello() {
    Main.uiGroup.remove_actor(text);
    text = null;
}
var monitor_height = 1080;
var monitor_width = 1920;
function _showHello() {
    if (!text) {
        text = new St.Label({ style_class: 'helloworld-label', text: "Hello, world!" });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
                      Math.floor(monitor.height / 2 - text.height / 2));

    var monitor_height = monitor.height;
	var monitor_width = monitor.width;

    Tweener.addTween(text,
                     { opacity: 0,
                       time: 2,
                       transition: 'easeOutQuad',
                       onComplete: _hideHello });
}

function init() {
    button = new St.Bin({ style_class: 'panel-button',
                          reactive: true,
                          can_focus: true,
                          x_fill: true,
                          y_fill: false,
                          track_hover: true });
    /*for(var i in button) {
      global.log(i);
    }*/
    /*let icon = new St.Icon({ icon_name: 'system-run-symbolic',
                             style_class: 'system-status-icon' });*/
	let icon = new St.Icon({ icon_name: 'action-unavailable-symbolic',
                             style_class: 'system-status-icon' });

    button.set_child(icon);
    button.connect('button-press-event', _showHello);


    //controller = new Leap.Controller();

    /*global.log(controller);
    controller.on("frame", function(frame) {
      global.log('test');
    });

    controller.on('ready', function() {
      global.log("ready");
    });
    controller.on('connect', function() {
        global.log("connect");
    });
    controller.on('disconnect', function() {
        global.log("disconnect");
    });
    controller.on('focus', function() {
        global.log("focus");
    });
    controller.on('blur', function() {
        global.log("blur");
    });
    controller.on('deviceConnected', function() {
        global.log("deviceConnected");
    });
    controller.on('deviceDisconnected', function() {
        global.log("deviceDisconnected");
    });

    controller.connect();*/


}
var mode = '';
function enable() {
   resetState();
    wsWinOverInjections['show'] = undefined;
    wsWinOverInjections['hide'] = undefined;
    wsWinOverInjections['cf_alt_tab_show'] = undefined;
    /*wsWinOverInjections['show'] = injectToFunction(Overview.Overview.prototype, 'show', function() {
        global.log('show overview');
        mode = 'overview';
    });
    wsWinOverInjections['hide'] = injectToFunction(Overview.Overview.prototype, 'hide', function() {
        global.log('hide overview');
        mode = '';
    });*/
    Main.overview.connect('showing', Lang.bind(this, function() {
        global.log('show overview');
        mode = 'overview';
       // Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windowOverlays[1].border.show();//.getWindowOverlays());
    }));
    Main.overview.connect('hidden', Lang.bind(this, function() {
        global.log('hide overview');
        mode = '';
    }));

    /*global.window_manager.connect('showing', Lang.bind(this, function() {
        global.log('alt tab');
        mode = '';
    }));*/
    //altTabExtension = imports.extensions.coverflowalttab;
    /*for(var i in ExtensionUtils.extensions) {
      global.log(i);
    }*/

    //TODO: need to also handle other alt tab extensions
    /*altTabExtension = ExtensionUtils.extensions['CoverflowAltTab@palatis.blogspot.com'].imports.switcher;
    if(altTabExtension) {
       wsWinOverInjections['cf_alt_tab_show'] = injectToFunction(altTabExtension.Switcher.prototype, 'show', function() {
        global.log('alt tab');
        mode = 'alt_tab';
      });

    }*/


    Main.panel._rightBox.insert_child_at_index(button, 0);

}

function disable() {
    Main.panel._rightBox.remove_child(button);
    for (i in wsWinOverInjections) {
        removeInjection(Workspace.WindowOverlay.prototype, wsWinOverInjections, i);
    }
    for each (i in createdActors)
        i.destroy();
    resetState();
}

function injectToFunction(parent, name, func) {
    let origin = parent[name];
    parent[name] = function() {
        let ret;
        ret = origin.apply(this, arguments);
        if (ret === undefined)
                ret = func.apply(this, arguments);
        return ret;
    }
    return origin;
}

function removeInjection(object, injection, name) {
    if (injection[name] === undefined)
        delete object[name];
    else
        object[name] = injection[name];
}


/************************8
*DBUS
*************************/


const LeapMotionIface = <interface name="com.jamespcole.leapmotion.dbus.Events">
<signal name="testsignal">
 <arg type="u"/>
 <arg type="s"/>
</signal>
<signal name="LeapMotionHeartbeat">
 <arg type="b"/>
</signal>
<signal name="LeapMotionConnected">
</signal>
<signal name="LeapMotionDisconnected">
</signal>
<signal name="LeapMotionControllerConnected">
</signal>
<signal name="LeapMotionControllerDisconnected">
</signal>
<signal name="FingersChanged">
 <arg type="ai"/>
</signal>
<signal name="SwipeDown">
 <arg type="i"/>
 <arg type="i"/>
</signal>
<signal name="SwipeUp">
 <arg type="i"/>
 <arg type="i"/>
</signal>
<signal name="SwipeLeft">
 <arg type="i"/>
 <arg type="i"/>
</signal>
<signal name="SwipeRight">
 <arg type="i"/>
 <arg type="i"/>
</signal>
<signal name="LeapMotionKeyTap">
 <arg type="s"/>
</signal>
<signal name="LeapMotionScreenTap">
 <arg type="s"/>
</signal>
<signal name="LeapMotionPointerMove">
 <arg type="i"/>
 <arg type="i"/>
 <arg type="i"/>
</signal>
<signal name="KeyTap">
</signal>
</interface>;

const LeapMotionServerInfo  = Gio.DBusInterfaceInfo.new_for_xml(LeapMotionIface);

function LeapMotionServer() {
    return new Gio.DBusProxy({ g_connection: Gio.DBus.session,
                               g_interface_name: LeapMotionServerInfo.name,
                               g_interface_info: LeapMotionServerInfo,
                               g_name: 'com.jamespcole.leapmotion',
                               g_object_path: '/com/jamespcole/leapmotion/dbus/Events' });
}

const LeapDBusEventSource = new Lang.Class({
    Name: 'LeapDBusEventSource',
    //lm_connected: false,

    _init: function() {
        //this._resetCache();
        //this.isLoading = false;
        //this.isDummy = false;

        this._initialized = false;
        this._dbusProxy = new LeapMotionServer();
        this._dbusProxy.init_async(GLib.PRIORITY_DEFAULT, null, Lang.bind(this, function(object, result) {
         // global.log(object, result);
          //global.log('proxy init');
            try {
                this._dbusProxy.init_finish(result);
            } catch(e) {
                log('Error loading leap dbus: ' + e.message);
                return;
            }

            this._dbusProxy.connectSignal('testsignal', Lang.bind(this, this._onChanged));
            this._dbusProxy.connectSignal('LeapMotionHeartbeat', Lang.bind(this, this._onLeapMotionHeartbeat));
            this._dbusProxy.connectSignal('LeapMotionConnected', Lang.bind(this, this._onLeapMotionConnected));
            this._dbusProxy.connectSignal('LeapMotionDisconnected', Lang.bind(this, this._onLeapMotionDisconnected));
            this._dbusProxy.connectSignal('LeapMotionControllerConnected', Lang.bind(this, this._onLeapMotionControllerConnected));
            this._dbusProxy.connectSignal('FingersChanged', Lang.bind(this, this._onFingersChanged));
            this._dbusProxy.connectSignal('SwipeDown', Lang.bind(this, this._onSwipeDown));
			this._dbusProxy.connectSignal('SwipeUp', Lang.bind(this, this._onSwipeUp));
			this._dbusProxy.connectSignal('SwipeLeft', Lang.bind(this, this._onSwipeLeft));
			this._dbusProxy.connectSignal('SwipeRight', Lang.bind(this, this._onSwipeRight));
			this._dbusProxy.connectSignal('LeapMotionPointerMove', Lang.bind(this, this._onLeapMotionPointerMove));
            //this.connect('LeapEvent', Lang.bind(this, this._onLeapEvent));

            /*this._dbusProxy.connect('notify::g-name-owner', Lang.bind(this, function() {
                if (this._dbusProxy.g_name_owner)
                    this._onNameAppeared();
                else
                    this._onNameVanished();
            }));

            this._dbusProxy.connect('g-properties-changed', Lang.bind(this, function() {
                this.emit('notify::has-calendars');
            }));

            this._initialized = true;
            this.emit('notify::has-calendars');
            this._onNameAppeared();*/
            this._initialized = true;
            //this.emit('notify::leap-event')
        }));
    },

    _onChanged: function(proxy, sender, data) {
     // global.log(test);
      //global.log(test2);
      global.log(data);
      //global.log('lp event handled');
    },
    _onLeapMotionConnected: function(proxy, sender, data) {
     // global.log(test);
      //global.log(test2);
      lm_connected = true;
      global.log('Leap Motion Connected');
      let icon = new St.Icon({ icon_name: 'system-run-symbolic',
                             style_class: 'system-status-icon' });

    	button.set_child(icon);
    	Main.notify('LeapMotion', 'LeapMotion device connected');
    },

    _onLeapMotionDisconnected: function(proxy, sender, data) {
     // global.log(test);
      //global.log(test2);
      lm_connected = false;
      global.log('Leap Motion Disconnected');
      let icon = new St.Icon({ icon_name: 'action-unavailable-symbolic',
                             style_class: 'system-status-icon' });

    	button.set_child(icon);
    	Main.notify('LeapMotion', 'LeapMotion has been disconnected');

    },

	_onLeapMotionControllerConnected: function(proxy, sender, data) {
    	global.log('controller connected');
    },


    _onFingersChanged: function(proxy, sender, data) {
     // global.log(test);
      //global.log(test2);
      global.log('Fingers Changed');
      //global.log(test);
      //should not need to do this, it should already be an array
      var str_result = String(data);
      global.log(str_result.split(','));

      var bits = str_result.split(',');
      var from = bits[0];
      var to = bits[1];
      global.log('from ' + from, 'to ' + to);
      global.log('in mode ' + mode);
      if(mode == '') {
        if(to == 5) {
			Main.overview.show();
			//global.log(Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[0]._windowOverlays);//.getWindowOverlays());
			//Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windowOverlays[0].hide();//.getWindowOverlays());
			let win = Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windows[0].metaWindow;
			//Main.activateWindow(win, global.get_current_time());
			//win._animateVisible();

			global.log(Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windowOverlays);
			global.log('selected wspace index',global.screen.get_active_workspace_index());
        }
        else if(to == 4) {
        	//this.emit('notify::switch-applications');
        	this.emit('notify::switch-windows');
        	global.log('switch apps');

			/*let icon = Gio.Icon.new_for_string('system-run-symbolic');

			Main.osdWindow.setIcon(icon);
			Main.osdWindow.setLabel('test');
			Main.osdWindow.setLevel(1);

			Main.osdWindow.show();*/
			//Main.notify('notification title', 'notification summary');
          /*global.window_manager.notify('switch-applications', function() {
            global.log('alt tab');
            //mode = '';
        });*/
          //ExtensionUtils.extensions['CoverflowAltTab@palatis.blogspot.com'].manager._startWindowSwitcher();
        }

      }
      else if(mode == 'overview') {
        if(to == 0) {
          Main.overview.hide();
        }
      }

    },

	_onSwipeUp: function(proxy, sender, data) {
		global.log('swipe up', data);
		var str_result = String(data);
		var bits = str_result.split(',');
		var distance = bits[0];
		var fingers = bits[1];
		if(mode == 'overview') {
			Util.spawn(['xdotool', 'click', '4']);
		}
		else {
			/*var scaled_val = Math.abs(distance / 15);
			global.log('scaled value', scaled_val);
			for(var i = 0; i < scaled_val; i++) {
				Util.spawn(['xdotool', 'click', '4']);
			}*/
		}
	},

    _onSwipeDown: function(proxy, sender, data) {
		global.log('swipe down', data);
		var str_result = String(data);
		var bits = str_result.split(',');
		var distance = bits[0];
		var fingers = bits[1];
		if(mode == 'overview') {
			Util.spawn(['xdotool', 'click', '5']);
		}
		else {
			/*var scaled_val = Math.abs(distance / 15);
			global.log('scaled value', scaled_val);
			for(var i = 0; i < scaled_val; i++) {
				Util.spawn(['xdotool', 'click', '5']);
			}*/
		}
	},

	_onSwipeLeft: function(proxy, sender, data) {
		global.log('swipe left', data);
		var str_result = String(data);
		var bits = str_result.split(',');
		var distance = bits[0];
		var fingers = bits[1];
		//Util.spawn(['xdotool', 'click', '4']);
		//let tabPopup = new AltTab.AppSwitcherPopup();
		global.log('swiped left in mode ' + mode);
		if(mode != 'overview') {
			let tabPopup = new AltTab.WindowSwitcherPopup();
			tabPopup.show(false, 'switch-windows', Shell.KeyBindingMode.SHIFT);
			//tabPopup.show(false, 'switch-windows');
		}
		else {

			let win = Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windows[0].metaWindow;
			//Main.activateWindow(win, global.get_current_time());
			//win._animateVisible();
			global.log('switch overlay', win);
		}

		//Main.ctrlAltTabManager.popup(false, 'switch-panels');

		//var current_window = this._getCurrentWindowMutter();
		//global.log('current window', current_window);

		/*if(mode == 'overview') {
			Util.spawn(['xdotool', 'click', '5']);
		}
		else {
			var scaled_val = Math.abs(distance / 15);
			global.log('scaled value', scaled_val);
			for(var i = 0; i < scaled_val; i++) {
				Util.spawn(['xdotool', 'click', '5']);
			}
		}*/
	},

	_onSwipeRight: function(proxy, sender, data) {
		global.log('swipe right', data);
		var str_result = String(data);
		var bits = str_result.split(',');
		var distance = bits[0];
		var fingers = bits[1];
		let tabPopup = new AltTab.WindowSwitcherPopup();
		tabPopup.show(true, 'switch-windows');
		/*if(mode == 'overview') {
			Util.spawn(['xdotool', 'click', '5']);
		}
		else {
			var scaled_val = Math.abs(distance / 15);
			global.log('scaled value', scaled_val);
			for(var i = 0; i < scaled_val; i++) {
				Util.spawn(['xdotool', 'click', '5']);
			}
		}*/
	},

	_onLeapMotionHeartbeat: function(proxy, sender, data) {
		var status = (data == 'false') ? false : true;
		//global.log(data, lm_connected);
		if(status != lm_connected) {
			lm_connected = status;
			//global.log('status_change');
			if(lm_connected === true) {
				let icon = new St.Icon({ icon_name: 'system-run-symbolic',
					style_class: 'system-status-icon' });

				button.set_child(icon);
				Main.notify('LeapMotion', 'LeapMotion device connected');
			}
			else {
				let icon = new St.Icon({ icon_name: 'action-unavailable-symbolic',
					style_class: 'system-status-icon' });

				button.set_child(icon);
				Main.notify('LeapMotion', 'LeapMotion has been disconnected');
			}
		}
	},

	_onLeapMotionPointerMove: function(proxy, sender, data) {

		var str_result = String(data);
		var bits = str_result.split(',');
		var x = bits[0];
		var y = bits[1];
		var fingers = bits[2];

		if(fingers == 1) {
			global.log(monitor_width, monitor_height);
			var x_scaled = Math.ceil(x * (monitor_width  / 256));
			var y_scaled = Math.ceil(y * (monitor_height / 256));

			global.log('pointer move', x_scaled, y_scaled, fingers);
			//do it this way to smooth the cursor movement
			//var scale_factor = (monitor_height + monitor_width) / 512;
			//for(var i = 0; i < 2; i++) {
				Util.spawn(['xdotool', 'mousemove_relative', '--', String(x_scaled), String(y_scaled)]);
			//}
		}
		else if(fingers == 2) {
			if(mode != 'overview') {
				global.log(y);
				var scale = y;
				if(y < 0) {
					scale = scale * -1;
				}
				global.log('scale', scale);
				if(y < 0) {
					//for(var i = 0; i < scale; i++) {
						Util.spawn(['xdotool', 'click', '4']);
					//}

				}
				else if(y > 0) {
					//for(var i = 0; i < scale; i++) {
						Util.spawn(['xdotool', 'click', '5']);
					//}
				}
			}
		}


	},

	_onKeyTap: function(proxy, sender, data) {
		global.log('keytap');
	},

    destroy: function() {
        this._dbusProxy.run_dispose();
    },

    _getCurrentWindowMutter: function () {
        let windows = Shell.WindowTracker.get_default().focus_app.get_windows();
        for (let i = 0; i < windows.length; i++) {
            if (windows[i].has_focus()) {
                return windows[i];
            }
        }
        // didn't find it.
        return null;
    }

});
Signals.addSignalMethods(LeapDBusEventSource.prototype);
/*for(var i in LeapMotionServer) {
    global.log(i);
}*/

const EventSource = new LeapDBusEventSource();






/*for(var i in EventSource) {
    global.log(i);
  }*/


/*const LeapMotionDbus = new Lang.Class({
    Name: 'LeapMotionDbus',

    _init: function() {
      global.log('here');
        this._dbusImpl = Gio.DBusExportedObject.wrapJSObject(LeapMotionIface, this);
        this._dbusImpl.export(Gio.DBus.session, '/com/jamespcole/LeapmotionDbus');

        this._dbusImpl.connectSignal('LeapEvent', Lang.bind(this, function() { global.log('dbus signal')}));
        for(var i in this._dbusImpl) {
          global.log(i);
        }
    },

    LeapEvent: function(evt, args) {
      global.log(evt, args);
    }
});

const LPDbus = new LeapMotionDbus();*/


/*const Indicator = new Lang.Class({
    Name: 'LeapMotionIndicator',
    Extends: PanelMenu.SystemStatusButton,

    _init: function() {
    	this.setIcon('bluetooth-disabled-symbolic');*/
        /*this.parent('bluetooth-disabled-symbolic', _("Bluetooth"));

        this._applet = new GnomeBluetoothApplet.Applet();

        this._killswitch = new PopupMenu.PopupSwitchMenuItem(_("Bluetooth"), false);
        this._applet.connect('notify::killswitch-state', Lang.bind(this, this._updateKillswitch));
        this._killswitch.connect('toggled', Lang.bind(this, function() {
            let current_state = this._applet.killswitch_state;
            if (current_state != GnomeBluetooth.KillswitchState.HARD_BLOCKED &&
                current_state != GnomeBluetooth.KillswitchState.NO_ADAPTER) {
                this._applet.killswitch_state = this._killswitch.state ?
                    GnomeBluetooth.KillswitchState.UNBLOCKED:
                    GnomeBluetooth.KillswitchState.SOFT_BLOCKED;
            } else
                this._killswitch.setToggleState(false);
        }));

        this._discoverable = new PopupMenu.PopupSwitchMenuItem(_("Visibility"), this._applet.discoverable);
        this._applet.connect('notify::discoverable', Lang.bind(this, function() {
            this._discoverable.setToggleState(this._applet.discoverable);
        }));
        this._discoverable.connect('toggled', Lang.bind(this, function() {
            this._applet.discoverable = this._discoverable.state;
        }));

        this._updateKillswitch();
        this.menu.addMenuItem(this._killswitch);
        this.menu.addMenuItem(this._discoverable);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._fullMenuItems = [new PopupMenu.PopupSeparatorMenuItem(),
                               new PopupMenu.PopupMenuItem(_("Send Files to Device…")),
                               new PopupMenu.PopupMenuItem(_("Set Up a New Device…")),
                               new PopupMenu.PopupSeparatorMenuItem()];
        this._hasDevices = false;

        this._fullMenuItems[1].connect('activate', function() {
            GLib.spawn_command_line_async('bluetooth-sendto');
        });
        this._fullMenuItems[2].connect('activate', function() {
            GLib.spawn_command_line_async('bluetooth-wizard');
        });

        for (let i = 0; i < this._fullMenuItems.length; i++) {
            let item = this._fullMenuItems[i];
            this.menu.addMenuItem(item);
        }

        this._deviceItemPosition = 3;
        this._deviceItems = [];
        this._applet.connect('devices-changed', Lang.bind(this, this._updateDevices));
        this._updateDevices();

        this._applet.connect('notify::show-full-menu', Lang.bind(this, this._updateFullMenu));
        this._updateFullMenu();

        this.menu.addSettingsAction(_("Bluetooth Settings"), 'gnome-bluetooth-panel.desktop');

        this._applet.connect('pincode-request', Lang.bind(this, this._pinRequest));
        this._applet.connect('confirm-request', Lang.bind(this, this._confirmRequest));
        this._applet.connect('auth-request', Lang.bind(this, this._authRequest));
        this._applet.connect('cancel-request', Lang.bind(this, this._cancelRequest));*/
   /* }

});*/