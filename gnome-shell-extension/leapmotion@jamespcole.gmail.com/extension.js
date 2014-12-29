
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const Signals = imports.signals;
const Util = imports.misc.util;

const ExtensionUtils = imports.misc.extensionUtils;

const Shell = imports.gi.Shell;
const Overview = imports.ui.overview;
const AltTab = imports.ui.altTab;
const PopupMenu = imports.ui.popupMenu;
const PanelMenu = imports.ui.panelMenu;


let text, button, winInjections, workspaceInjections, workViewInjections, createdActors, connectedSignals;
let logToConsole, logToUI, enablePointing, numberOfPointingFingers;

function resetState() {
    winInjections = { };
    workspaceInjections = { };
    workViewInjections = { };
    createdActors = [ ];
    connectedSignals = [ ];
    logToConsole = false;
    logToUI = false;
    enablePointing = false;
    numberOfPointingFingers = 1;
};

function _hideText() {
    Main.uiGroup.remove_actor(text);
    text = null;
}

function _showText(textStr) {
    
    let textLabel = new St.Label({ style_class: 'leapmotion-text-label', text: textStr });
    Main.uiGroup.add_actor(textLabel);
    
    textLabel.opacity = 255;

    let monitor = Main.layoutManager.primaryMonitor;

    textLabel.set_position(Math.floor(monitor.width / 2 - textLabel.width / 2),
                      Math.floor(monitor.height / 2 - textLabel.height / 2));

    Tweener.addTween(textLabel,
                     { opacity: 0,
                       time: 5,
                       transition: 'easeOutQuad',
                       onComplete: function() {
                        Main.uiGroup.remove_actor(textLabel);
                       } 
                     });
}

function init() {
    
}

const LeapMotionMenu = new Lang.Class({
    Name: 'LeapMotionMenu.LeapMotionMenu',
    Extends: PanelMenu.Button,
    StatusIcon: null,
    _init: function() {
      this.parent(0.0, _("LeapMotion"));

      this._screenSignals = [];
      
      let icon = new St.Icon({ icon_name: 'action-unavailable-symbolic',
                               style_class: 'system-status-icon' });

      this.actor.add_child(icon);
      this.StatusIcon = icon;

      let enablePointerItem = new PopupMenu.PopupSwitchMenuItem(_('Pointer'), enablePointing);
  
      enablePointerItem.connect('toggled', Lang.bind(this, function() {
            enablePointing = !enablePointing;
            if(enablePointing) {
              _showText("Pointing enabled, use a single finger to move the cursor.");
            }
            else {
              _showText("Pointing disabled.");
            }
        }));
      this.menu.addMenuItem(enablePointerItem);

      let startServiceItem = new PopupMenu.PopupMenuItem(_("Start Service"));
      startServiceItem.connect('activate', Lang.bind(this, function() {
            _showText("Service Started");
        }));
      this.menu.addMenuItem(startServiceItem);

      this.menu.addMenuItem(new PopupMenu.PopupMenuItem(_("Settings")));

      this.actor.show();
    },

    destroy: function() {

        this.parent();
    },

    setStatusIcon: function(connected) {
      this.actor.remove_child(this.StatusIcon);
      if(connected) {
        let icon = new St.Icon({ icon_name: 'system-run-symbolic',
                                 style_class: 'system-status-icon' });
        this.StatusIcon = icon;
        this.actor.add_child(this.StatusIcon);
      }
      else {
        let icon = new St.Icon({ icon_name: 'action-unavailable-symbolic',
                                 style_class: 'system-status-icon' });
        this.StatusIcon = icon;
        this.actor.add_child(this.StatusIcon);
      }
    }
    
});

var lm_connected = false;
var mode = '';

function enable() {
  resetState();
    //Main.panel._rightBox.insert_child_at_index(button, 0);
    button = new LeapMotionMenu();

    Main.panel.addToStatusArea('leapmotion-menu', button);

    let showSignalId = Main.overview.connect('showing', Lang.bind(this, function() {
        debugLog('show overview');
        mode = 'overview';
        leapMotionOverviewSelectionUsed = false;
       // Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windowOverlays[1].border.show();//.getWindowOverlays());
    }));

    connectedSignals.push({ obj: Main.overview, id: showSignalId });


    let hideSignalId = Main.overview.connect('hidden', Lang.bind(this, function() {
        debugLog('hide overview');
        mode = '';
    }));

    connectedSignals.push({ obj: Main.overview, id: hideSignalId });

}

function removeInjection(object, injection, name) {
    if (injection[name] === undefined)
        delete object[name];
    else
        object[name] = injection[name];
}

function disable() {
    Main.panel._rightBox.remove_child(button);

    let i;

    for (i in workspaceInjections)
        removeInjection(Workspace.Workspace.prototype, workspaceInjections, i);
    for (i in winInjections)
        removeInjection(Workspace.WindowOverlay.prototype, winInjections, i);
    for (i in workViewInjections)
        removeInjection(WorkspacesView.WorkspacesView.prototype, workViewInjections, i);

    for each (i in connectedSignals)
        i.obj.disconnect(i.id);

    for each (i in createdActors)
        i.destroy();

    button.destroy();

    resetState();
}

function debugLog(obj1, obj2, showOnUI) {
  if(logToConsole) {
    if(!obj2) {
      global.log(obj1);
    }
    else {
      global.log(obj1, obj2);
    }
  }
  if(showOnUI && logToUI) {
    if (!text) {
        text = new St.Label({ style_class: 'leapmotion-text-label', text: obj1 });
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
                       onComplete: _hideText });
  }
                    
}


/************************8
*DBUS
*************************/

const LeapMotionIface = '<node> \
<interface name="com.jamespcole.leapmotion.dbus.Events"> \
<signal name="testsignal"> \
 <arg type="u"/> \
 <arg type="s"/> \
</signal> \
<signal name="LeapMotionHeartbeat"> \
 <arg type="b"/> \
</signal> \
<signal name="LeapMotionConnected">  \
</signal> \
<signal name="LeapMotionDisconnected"> \
</signal> \
<signal name="LeapMotionControllerConnected"> \
</signal> \
<signal name="LeapMotionControllerDisconnected"> \
</signal> \
<signal name="LeapMotionFingersChanged"> \
 <arg type="ai"/> \
</signal> \
<signal name="LeapMotionSwipeDown"> \
 <arg type="i"/> \
 <arg type="i"/> \
</signal> \
<signal name="LeapMotionSwipeUp"> \
 <arg type="i"/> \
 <arg type="i"/> \
</signal> \
<signal name="LeapMotionSwipeLeft"> \
 <arg type="i"/> \
 <arg type="i"/> \
</signal> \
<signal name="LeapMotionSwipeRight"> \
 <arg type="i"/> \
 <arg type="i"/> \
</signal> \
<signal name="LeapMotionKeyTap"> \
 <arg type="i"/> \
</signal> \
<signal name="LeapMotionScreenTap"> \
 <arg type="s"/> \
</signal> \
<signal name="LeapMotionClockWise"> \
 <arg type="d"/> \
 <arg type="i"/> \
</signal> \
<signal name="LeapMotionAntiClockWise"> \
 <arg type="d"/> \
 <arg type="i"/> \
</signal> \
<signal name="LeapMotionPointerMove"> \
 <arg type="d"/> \
 <arg type="d"/> \
 <arg type="i"/> \
</signal> \
<signal name="KeyTap"> \
</signal> \
</interface> \
</node>';

const LeapMotionServerInfo  = Gio.DBusInterfaceInfo.new_for_xml(LeapMotionIface);

function LeapMotionServer() {
    return new Gio.DBusProxy({ g_connection: Gio.DBus.session,
                               g_interface_name: LeapMotionServerInfo.name,
                               g_interface_info: LeapMotionServerInfo,
                               g_name: 'com.jamespcole.leapmotion',
                               g_object_path: '/com/jamespcole/leapmotion/dbus/Events' });
}

function toggleAltTab(show) {
  if(show) {
    Util.spawn(['xdotool', 'keyup', 'alt', 'keydown', 'alt', 'key', 'Tab']);
    mode = 'alt-tab';
  }
  else {
    Util.spawn(['xdotool', 'keyup', 'alt']);
    mode = '';
  }
}
//these are for selecting windows from the overview
//a bit of a hack but it's actually harder to do than
//you would think
var currentWorkspaceIndex = 0;
var currentWindowIndex = 0;
//this is just to keep track of whether windows in the overview pane were selected using our custom
//leapmotion method.
var leapMotionOverviewSelectionUsed = false; 

const LeapDBusEventSource = new Lang.Class({
    Name: 'LeapDBusEventSource',
    _init: function() {

        this._initialized = false;
        this._dbusProxy = new LeapMotionServer();
        this._dbusProxy.init_async(GLib.PRIORITY_DEFAULT, null, Lang.bind(this, function(object, result) {
    
        try {
            this._dbusProxy.init_finish(result);
        } catch(e) {
            log('Error loading leap dbus: ' + e.message);
            return;
        }

        this._dbusProxy.connectSignal('LeapMotionKeyTap', Lang.bind(this, this._onLeapMotionKeyTap));
        this._dbusProxy.connectSignal('LeapMotionSwipeLeft', Lang.bind(this, this._onLeapMotionSwipeLeft));
        this._dbusProxy.connectSignal('LeapMotionSwipeRight', Lang.bind(this, this._onLeapMotionSwipeRight));
        this._dbusProxy.connectSignal('LeapMotionSwipeUp', Lang.bind(this, this._onLeapMotionSwipeUp));
        this._dbusProxy.connectSignal('LeapMotionSwipeDown', Lang.bind(this, this._onLeapMotionSwipeDown));
        this._dbusProxy.connectSignal('LeapMotionFingersChanged', Lang.bind(this, this._onLeapMotionFingersChanged));
        this._dbusProxy.connectSignal('LeapMotionClockWise', Lang.bind(this, this._onLeapMotionClockWise));
        this._dbusProxy.connectSignal('LeapMotionAntiClockWise', Lang.bind(this, this._onLeapMotionAntiClockWise));
        this._dbusProxy.connectSignal('LeapMotionControllerConnected', Lang.bind(this, this._onLeapMotionControllerConnected));
        this._dbusProxy.connectSignal('LeapMotionControllerDisconnected', Lang.bind(this, this._onLeapMotionControllerDisconnected));
        this._dbusProxy.connectSignal('LeapMotionHeartbeat', Lang.bind(this, this._onLeapMotionHeartbeat));
        this._dbusProxy.connectSignal('LeapMotionPointerMove', Lang.bind(this, this._onLeapMotionPointerMove));
  
        this._initialized = true;

      }));
    },

  _onLeapMotionKeyTap: function(proxy, sender, data) {
    debugLog('keytap', data);
    var str_result = String(data);
    var bits = str_result.split(',');
    var fingers = bits[0];
    debugLog('KeyTap fingers == ' + fingers, null, true);

    if(enablePointing && fingers == numberOfPointingFingers) {
      debugLog('cancelled because pointing is enabled', data);
      return;
    }
  },

  _onLeapMotionSwipeLeft: function(proxy, sender, data) {
    debugLog('swipe left', data);
    var str_result = String(data);
    var bits = str_result.split(',');
    var distance = bits[0];
    var fingers = bits[1];
    debugLog('Swipe Left fingers == ' + fingers, null, true);

    if(enablePointing && fingers == numberOfPointingFingers) {
      debugLog('cancelled because pointing is enabled', data);
      return;
    }

    if(mode == 'alt-tab') {
      Util.spawn(['xdotool', 'key', 'Tab']);
    }
    else if(mode != 'overview') {
      let tabPopup = new AltTab.WindowSwitcherPopup();
      tabPopup.show(false, 'switch-windows', Shell.KeyBindingMode.SHIFT);
      debugLog("change windows");
      //tabPopup.show(false, 'switch-windows');
    }    
  },

  _onLeapMotionSwipeRight: function(proxy, sender, data) {
    debugLog('swipe right', data);
    var str_result = String(data);
    var bits = str_result.split(',');
    var distance = bits[0];
    var fingers = bits[1];
    debugLog('Swipe Right fingers == ' + fingers, null, true);

    if(enablePointing && fingers == numberOfPointingFingers) {
      debugLog('cancelled because pointing is enabled', data);
      return;
    }
    
    if(mode == 'alt-tab') {
      Util.spawn(['xdotool', 'key', 'Shift+Tab']);
    }
  },

  _onLeapMotionSwipeUp: function(proxy, sender, data) {
    debugLog('swipe up', data);
    var str_result = String(data);
    var bits = str_result.split(',');
    var distance = bits[0];
    var fingers = bits[1];
    debugLog('Swipe Up fingers == ' + fingers, null, true);

    if(enablePointing && fingers == numberOfPointingFingers) {
      debugLog('cancelled because pointing is enabled', data);
      return;
    }    
    if(mode == 'overview') {
      Util.spawn(['xdotool', 'click', '4']);
    }
    else {
      var scaled_val = Math.abs(distance / 15);
      debugLog('scaled value', scaled_val);
      for(var i = 0; i < scaled_val; i++) {
        Util.spawn(['xdotool', 'click', '4']);
      }
    }
  },

  _onLeapMotionSwipeDown: function(proxy, sender, data) {
    debugLog('swipe down', data);
    var str_result = String(data);
    var bits = str_result.split(',');
    var distance = bits[0];
    var fingers = bits[1];    
    debugLog('Swipe Down fingers == ' + fingers, null, true);
    if(enablePointing && fingers == numberOfPointingFingers) {
      debugLog('cancelled because pointing is enabled', data);
      return;
    }
    if(mode == 'overview') {
      Util.spawn(['xdotool', 'click', '5']);
    }
    else {
      var scaled_val = Math.abs(distance / 15);
      debugLog('scaled value', scaled_val);
      for(var i = 0; i < scaled_val; i++) {
        Util.spawn(['xdotool', 'click', '5']);
      }
    }
  },

  _onLeapMotionClockWise: function(proxy, sender, data) {
    debugLog('Clockwise', data);
    var str_result = String(data);
    var bits = str_result.split(',');
    var distance = bits[0];
    var fingers = bits[1];    
    debugLog('Clockwise fingers == ' + fingers + ' distance == ' + distance, null, true);
    if(enablePointing && fingers == numberOfPointingFingers) {
      debugLog('cancelled because pointing is enabled', data);
      return;
    }
    if(mode == 'overview') {
      /*if ( Main.overview._viewSelector._activeTab.id != 'windows') {
        global.log('not in window overview');
        return;
      }*/

      //This is so that windows can be selected in the main window
      var selectedWorkspace = global.screen.get_active_workspace_index();
      if(selectedWorkspace != currentWorkspaceIndex) {
        currentWindowIndex = 0;
        leapMotionOverviewSelectionUsed = false;
      }
      else {
        currentWindowIndex++;
        if(currentWindowIndex >= Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays.length) {
          currentWindowIndex = 0;
        }
      }
      currentWorkspaceIndex = selectedWorkspace;
      if(Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays.length > 0) {
        leapMotionOverviewSelectionUsed = true;
        Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays[currentWindowIndex]._onEnter();  
      }      
    }
  },

  _onLeapMotionAntiClockWise: function(proxy, sender, data) {
    debugLog('Anti Clockwise', data);
    var str_result = String(data);
    var bits = str_result.split(',');
    var distance = bits[0];
    var fingers = bits[1];
    debugLog('Anti Clockwise fingers == ' + fingers + ' distance == ' + distance, null, true);
    if(enablePointing && fingers == numberOfPointingFingers) {
      debugLog('cancelled because pointing is enabled', data);
      return;
    }

    if(mode == 'overview') {
      //This is so that windows can be selected in the main window
      var selectedWorkspace = global.screen.get_active_workspace_index();
      if(selectedWorkspace != currentWorkspaceIndex) {
        currentWindowIndex = 0;
        leapMotionOverviewSelectionUsed = false;
      }
      else {
        currentWindowIndex--;
        if(currentWindowIndex < 0) {
          currentWindowIndex = Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays.length - 1;
        }

        if(currentWindowIndex < 0) {
          currentWindowIndex = 0;
        }
      }
      currentWorkspaceIndex = selectedWorkspace;
      if(Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays.length > 0) {
        leapMotionOverviewSelectionUsed = true;
        Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays[currentWindowIndex]._onEnter();  
      }      
    }

  },

  _onLeapMotionFingersChanged: function(proxy, sender, data) {
      debugLog('Fingers Changed');
      //should not need to do this, it should already be an array
      var str_result = String(data);
      debugLog(str_result.split(','));

      var bits = str_result.split(',');
      var from = bits[0];
      var to = bits[1];
      debugLog('from ' + from, 'to ' + to);
      debugLog('from ' + from + ' to ' + to, null, true);
      debugLog('in mode ' + mode);
      if(mode == '') {
        if(to == 5) {
          Main.overview.show();
          //let win = Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windows[0].metaWindow;

          //global.log(Main.overview._viewSelector._workspacesDisplay._workspacesViews[0]._workspaces[global.screen.get_active_workspace_index()]._windowOverlays);
          //global.log('selected wspace index',global.screen.get_active_workspace_index());
        }
        else if(to == 4) {
          //this.emit('notify::switch-applications');
          /*this.emit('notify::switch-windows');
          global.log('switch apps');
          var altTabExtension = ExtensionUtils.extensions['CoverflowAltTab@palatis.blogspot.com'].imports.switcher;
          global.log(altTabExtension);*/
          debugLog('switch apps');
          //Util.spawn(['xdotool', 'keyup', 'alt', 'keydown', 'alt', 'key', 'Tab']);
          //mode = 'alt-tab';
          toggleAltTab(true);
        }

      }
      else if(mode == 'overview') {
        if(to == 0) {
          //Main.overview.hide();
          if(leapMotionOverviewSelectionUsed == true && Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays.length > 0) {            
            Main.activateWindow(Main.overview.viewSelector._workspacesDisplay._workspaces[0][currentWorkspaceIndex]._windowOverlays[currentWindowIndex]._windowClone.metaWindow);
          }
          else {
            Main.overview.hide();
          }    
        }
        else if(to == 4) {
          //Main.overview.hide();
          //Util.spawn(['xdotool', 'keyup', 'alt', 'keydown', 'alt', 'key', 'Tab']);
          //mode = 'alt-tab';
        }
      }
      else if(mode == 'alt-tab') {
        if(to == 0) {
          //Util.spawn(['xdotool', 'keyup', 'alt']);
          //mode = '';
          toggleAltTab(false);
        }
      }

    },

    _onLeapMotionPointerMove: function(proxy, sender, data) {

      var str_result = String(data);
      var bits = str_result.split(',');
      var x = bits[0];
      var y = bits[1];
      var fingers = bits[2];

      if(enablePointing && fingers == numberOfPointingFingers) {

        let monitor = Main.layoutManager.primaryMonitor;

        var monitor_height = monitor.height;
        var monitor_width = monitor.width;
        
        Util.spawn(['xdotool', 'mousemove', '--', String(Math.round(x * monitor_width)), String(Math.round(monitor_height - y * monitor_height))]);        
      }
    },

    _onLeapMotionControllerDisconnected: function(proxy, sender, data) {
      lm_connected = false;
      button.setStatusIcon(lm_connected);
      Main.notify('LeapMotion', 'LeapMotion has been disconnected');

    },

    _onLeapMotionControllerConnected: function(proxy, sender, data) {
      lm_connected = true;
      button.setStatusIcon(lm_connected);
      Main.notify('LeapMotion', 'LeapMotion has been connected');
    },

    _onLeapMotionHeartbeat: function(proxy, sender, data) {
      var status = (data == 'false') ? false : true;      
      if(status != lm_connected) {
        lm_connected = status;
        
        if(lm_connected === true) {
          Main.notify('LeapMotion', 'LeapMotion device connected');
        }
        else {
          Main.notify('LeapMotion', 'LeapMotion has been disconnected');
        }
        button.setStatusIcon(lm_connected);
      }
    }
  
});
Signals.addSignalMethods(LeapDBusEventSource.prototype);

const EventSource = new LeapDBusEventSource();
