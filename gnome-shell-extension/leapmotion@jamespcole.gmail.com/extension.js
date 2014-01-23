//require('leapjs/template/entry');
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const ExtensionUtils = imports.misc.extensionUtils;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;


//const Main = imports.ui.main;
//const Tweener = imports.tweener.tweener;
const Workspace = imports.ui.workspace;
const Overview = imports.ui.overview;
//const WebKit = imports.gi.WebKit;
//const Soup = imports.gi.Soup;

const Gio = imports.gi.Gio;

const Signals = imports.signals;

let altTabExtension = null;

/*const MyIface = <interface name="com.jamespcole.LeapMotionextension">
<method name="Activate" />
</interface>;
const MyProxy = Gio.DBusProxy.makeProxyWrapper(MyIface);

let instance = new MyProxy(Gio.DBus.session, 'com.jamespcole.LeapMotionextension', '/com/jamespcole/LeapMotionextension');

for(var i in instance) {
  global.log(i);
}*/


let ExtensionImports;
ExtensionImports = imports.misc.extensionUtils.getCurrentExtension().imports;

global.log(ExtensionImports);


/*const Leapjs = ExtensionImports.leap;

global.log(Leap);

let controller;*/
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

function _showHello() {
    if (!text) {
        text = new St.Label({ style_class: 'helloworld-label', text: "Hello, world!" });
        Main.uiGroup.add_actor(text);
    }

    text.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
                      Math.floor(monitor.height / 2 - text.height / 2));

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
    let icon = new St.Icon({ icon_name: 'system-run-symbolic',
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
   /* for(var i in ExtensionUtils.extensions['CoverflowAltTab@palatis.blogspot.com'].imports.extension) {
      global.log(i);
    }*/

    //TODO: need to also handle other alt tab extensions
    altTabExtension = ExtensionUtils.extensions['CoverflowAltTab@palatis.blogspot.com'].imports.switcher;
    if(altTabExtension) {
       wsWinOverInjections['cf_alt_tab_show'] = injectToFunction(altTabExtension.Switcher.prototype, 'show', function() {
        global.log('alt tab');
        mode = 'alt_tab';
      });
      
    }
   
    
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
<signal name="LeapMotionConnected">
</signal>
<signal name="FingersChanged">
 <arg type="ai"/>
</signal>
<signal name="SwipeDown">
 <arg type="i"/>
</signal>
<signal name="SwipeUp">
 <arg type="i"/>
</signal>
</interface>;

const LeapMotionServerInfo  = Gio.DBusInterfaceInfo.new_for_xml(LeapMotionIface);

global.log(LeapMotionServerInfo.name);
function LeapMotionServer() {
    return new Gio.DBusProxy({ g_connection: Gio.DBus.session,
                               g_interface_name: LeapMotionServerInfo.name,
                               g_interface_info: LeapMotionServerInfo,
                               g_name: 'com.jamespcole.leapmotion',
                               g_object_path: '/com/jamespcole/leapmotion/dbus/Events' });
}

const LeapDBusEventSource = new Lang.Class({
    Name: 'LeapDBusEventSource',

    _init: function() {
        //this._resetCache();
        //this.isLoading = false;
        //this.isDummy = false;

        this._initialized = false;
        this._dbusProxy = new LeapMotionServer();
        this._dbusProxy.init_async(GLib.PRIORITY_DEFAULT, null, Lang.bind(this, function(object, result) {
          global.log(object, result);
          global.log('proxy init');
            try {
                this._dbusProxy.init_finish(result);
            } catch(e) {
                log('Error loading leap dbus: ' + e.message);
                return;
            }

            this._dbusProxy.connectSignal('testsignal', Lang.bind(this, this._onChanged));
            this._dbusProxy.connectSignal('LeapMotionConnected', Lang.bind(this, this._onLeapMotionConnected));
            this._dbusProxy.connectSignal('FingersChanged', Lang.bind(this, this._onFingersChanged));
            this._dbusProxy.connectSignal('SwipeDown', Lang.bind(this, this._onSwipeDown));
            this._dbusProxy.connectSignal('SwipeUp', Lang.bind(this, this._onSwipeUp));
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
            this.emit('notify::leap-event')
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
      global.log('Leap Motion Connected');
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
        }
        else if(to == 4) {
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
      global.log(data);
      var scaled_val = Math.abs(data / 15);
      for(var i = 0; i < scaled_val; i++) {
       Util.spawn(['xdotool', 'click', '4']);
      }
      
    },

    _onSwipeDown: function(proxy, sender, data) {
      global.log(data);
      var scaled_val = Math.abs(data / 15);
      for(var i = 0; i < scaled_val; i++) {
        Util.spawn(['xdotool', 'click', '5']);
      }
    },

    destroy: function() {
        this._dbusProxy.run_dispose();
    }

});
Signals.addSignalMethods(LeapDBusEventSource.prototype);
for(var i in LeapMotionServer) {
    global.log(i);
  }

const EventSource = new LeapDBusEventSource();

for(var i in EventSource) {
    global.log(i);
  }


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