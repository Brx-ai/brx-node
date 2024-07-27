import BRX, { BRK } from '../../src/index.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: false, send_local: false });

console.log("Testing SCHEMA GRAB")

const BRK5 = await brx.get('80146882-6c8e-4e91-9141-bc027ad1936d:81eda41b46fb396d831be16b65a4f34f4e87cfba')
console.log(BRK5.input)
BRK5.input['Variable5'] = 'Hi, please repeat the following Phrase.'
BRK5.input['Variable4'] = 'I like ice '
BRK5.input['Variable3'] = ''
BRK5.input['Variable2'] = ''
BRK5.input['Variable1'] = 'Hi, please repeat the following Phrase. I like Ice Cream'

const result = await brx.run(BRK5, msg => {
    console.log(msg)
});
console.log(result)
