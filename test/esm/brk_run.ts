import BRX, { BRK, mapReplacer } from '../../lib/esm/src/index.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: false, send_local: false });

const BRK5 = await brx.get('80146882-6c8e-4e91-9141-bc027ad1936d')
BRK5.input['Variable5'] = 'Hi, please repeat the following Phrase.'
BRK5.input['Variable4'] = 'I like ice '
BRK5.input['Variable3'] = ''
BRK5.input['Variable2'] = ''
BRK5.input['Variable1'] = 'Hi, please repeat the following Phrase. I like Ice Cream'

const result = await BRK5.run(msg => {
    console.log(msg)
});
