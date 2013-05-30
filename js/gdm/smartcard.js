// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const Gio = imports.gi.Gio;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Signals = imports.signals;

const ObjectManager = imports.misc.objectManager;

const _SMARTCARD_SERVICE_DBUS_NAME = "org.gnome.SettingsDaemon.Smartcard";

const SmartcardManagerIface = <interface name="org.gnome.Smartcard.Manager">
  <method name="GetLoginToken">
      <arg name="token" type="o" direction="out"/>
  </method>
  <method name="GetInsertedTokens">
      <arg name="tokens" type="ao" direction="out"/>
  </method>
</interface>;

const SmartcardTokenIface = <interface name="org.gnome.Smartcard.Token">
  <property name="Name" type="s" access="read"/>
  <property name="Driver" type="o" access="read"/>
  <property name="IsInserted" type="b" access="read"/>
  <property name="UsedToLogin" type="b" access="read"/>
</interface>;

const SmartcardDriverIface = <interface name="org.gnome.Smartcard.Driver">
  <property name="Library" type="s" access="read"/>
  <property name="Description" type="s" access="read"/>
</interface>;

const SmartcardManager = new Lang.Class({
    Name: 'SmartcardManager',
    _init: function() {
        this._objectManager = new ObjectManager.ObjectManager({ connection: Gio.DBus.session,
                                                                name: _SMARTCARD_SERVICE_DBUS_NAME,
                                                                objectPath: '/org/gnome/SettingsDaemon/Smartcard',
                                                                knownInterfaces: [ SmartcardManagerIface,
                                                                                   SmartcardTokenIface,
                                                                                   SmartcardDriverIface ],
                                                                onLoaded: Lang.bind(this, this._onLoaded) });
        this._tokens = {};
    },

    _onLoaded: function() {
        let tokens = this._objectManager.getProxiesForInterface('org.gnome.Smartcard.Token');

        for (let i = 0; i < tokens.length; i++)
            this._addToken(tokens[i]);

        this._objectManager.connect('interface-added', Lang.bind(this, function(interfaceName, proxy) {
                                        if (interfaceName == 'org.gnome.Smartcard.Token')
                                            this._addToken(proxy);
                                    }));

        this._objectManager.connect('interface-removed', Lang.bind(this, function(interfaceName, proxy) {
                                        if (interfaceName == 'org.gnome.Smartcard.Token')
                                            this._removeToken(proxy);
                                    }));
    },

    _addToken: function(token) {
        if (this._tokens[token.get_object_path()])
            return;

        this._tokens[token.get_object_path()] = token;

        token.connect('g-properties-changed',
                      Lang.bind(this, function(proxy, properties) {
                          if ('IsInserted' in properties.deep_unpack()) {
                              if (token.IsInserted)
                                  this.emit('token-inserted', token.Name);
                              else
                                  this.emit('token-removed', token.Name);
                          }
                      }));
    },

    _removeToken: function(token) {
        if (!this._tokens[token.get_object_path()])
            return;

        token.disconnectAll();
        delete this._tokens[token.get_object_path()];
    }
});
Signals.addSignalMethods(SmartcardManager.prototype);

