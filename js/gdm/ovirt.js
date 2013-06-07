// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const Gio = imports.gi.Gio;

const OVirtCredentialsIface = <interface name='org.virt.vdsm.Credentials'>
<signal name="UserAuthenticated">
    <arg type="s" name="token"/>
</signal>
</interface>;

const OVirtCredentialsInfo = Gio.DBusInterfaceInfo.new_for_xml(OVirtCredentialsIface);
const OVIRT_SERVICE_NAME = 'gdm-ovirtcred';

function OVirtCredentials() {
    var self = new Gio.DBusProxy({ g_connection: Gio.DBus.system,
				   g_interface_name: OVirtCredentialsInfo.name,
				   g_interface_info: OVirtCredentialsInfo,
				   g_name: 'org.ovirt.vdsm.Credentials',
				   g_object_path: '/org/ovirt/vdsm/Credentials',
				   g_flags: (Gio.DBusProxyFlags.DO_NOT_LOAD_PROPERTIES)});

    self.init(null);
    return self;
}

