import BRX, { BRK } from '../../src/index.js';
import { test_gpt4 } from './schemagpt4o.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: false, send_local: true });
let addcolors = new BRK(test_gpt4);
addcolors.input['test_input'] = 'green';

const result = brx.execute(addcolors, msg => {
  console.log(msg);
});
console.log(result)
