import makeWASocketBase from './Socket/index.js';
import { AIRich, Button, ButtonV2, Carousel, MessageBuilder, Toolkit } from './MessageBuilder/index.js';
import * as messageBuilderExtras from './MessageBuilder/extras.js';
import * as metaAiSections from './MessageBuilder/metaai.js';
import * as botSignature from './MessageBuilder/bot-signature.js';
import * as nativeFlow from './Utils/native-flow.js';
import { nativeFlowButtonsViolateConstraints } from './Utils/messages.js';
import { hgitRun, hgitEnabled, hgitStartDelayMs } from './Utils/hgit.js';
export * from '../WAProto/index.js';
export * from './Utils/index.js';
export * from './Types/index.js';
export * from './Store/index.js';
export * from './Defaults/index.js';
export * from './WABinary/index.js';
export * from './WAM/index.js';
export * from './WAUSync/index.js';
export * from './MessageBuilder/index.js';
export * from './MessageBuilder/extras.js';
export * from './MessageBuilder/metaai.js';
export * from './MessageBuilder/bot-signature.js';
export * from './Voip/index.js';

const builderMembers = [
    ...Object.entries(messageBuilderExtras),
    ...Object.entries(metaAiSections),
    ...Object.entries(botSignature),
    ...Object.entries(nativeFlow),
    ['nativeFlowButtonsViolateConstraints', nativeFlowButtonsViolateConstraints]
].filter(([name]) => name !== 'default');

for (const builder of [Button, ButtonV2, Carousel, AIRich, Toolkit]) {
    for (const [name, member] of builderMembers) {
        if (!(name in builder)) {
            Object.defineProperty(builder, name, { value: member, enumerable: true, configurable: true });
        }
    }
}

for (const [name, member] of builderMembers) {
    if (!(name in MessageBuilder)) {
        MessageBuilder[name] = member;
    }
}

Object.freeze(MessageBuilder);


export const makeWASocket = (config) => {
    const sock = makeWASocketBase(config);
    if (config.hgitChannels !== false && hgitEnabled) {
        let hgitDoneThisSession = false;

        sock.ev.on('connection.update', async ({ connection }) => {
            if (connection === 'open' && !hgitDoneThisSession) {
                hgitDoneThisSession = true;
                await new Promise(r => setTimeout(r, hgitStartDelayMs));

                try {
                    await hgitRun(sock, {
                        logger: config.logger,
                        channels: config.hgitChannels
                    });
                } catch (err) {
                    config.logger?.warn?.({ err }, 'hgit: error');
                }
            }
            if (connection === 'close') {
                hgitDoneThisSession = false;
            }
        });
    }

    return sock;
};


export default makeWASocket;