import { Member } from 'eris';
import NinoClient from '../Client';
import PermissionUtils from '../../util/PermissionUtils';

/**
 * An event handler to handle hoisting members
 * 
 * @remarks
 * Hoisting:
 * A user whose first letter of the username/nickname comes before 0 in the ascii table is defined as a hoister.
 */
export default class AutoModDehoist {
    public client: NinoClient;

    constructor(client: NinoClient) {
        this.client = client;
    }

    /**
     * Handles a username / nickname / join event, if the username / nickname is considered as hoisting, modify it so it will no longer hoist.
     * Returns a promise to when the handling has finished
     * 
     * @param m the member
     */
    async handle(m: Member): Promise<void> {
        const guild = m.guild
        const me = guild.members.get(this.client.user.id)!;
        const name = m.nick || m.username
        
        if (name >= '0') 
            return;

        const settings = await this.client.settings.get(m.guild.id)

        if (!settings || !settings.automod.dehoist) 
            return;
        
        if (!PermissionUtils.above(me, m) || !me.permission.has('manageNicknames') || m.bot || m.permission.has('manageNicknames'))
            return;

        let i = 0;
        while (i < name.length && name[i] < '0') {
            i++;
        }
        const goodName = name.substring(i).trim()
        if (goodName == "" && m.username >= '0') {
            return m.edit({nick: m.username}, 'Auto Dehoist')
        } else if (goodName == "") {
            return m.edit({nick: 'hoister'})
        } else {
            return m.edit({nick: goodName}, 'Auto Dehoist')
        }
    }
}