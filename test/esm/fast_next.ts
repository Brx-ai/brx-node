import BRX, { BRK } from '../../src/index.js';
import { add_color1 } from './schema.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: true, send_local: true });
let addcolors = new BRK(add_color1);
addcolors.input['add_color1'] = 'Green';
addcolors.input['add_color3'] = 'Blue';

const result = brx.execute(addcolors, msg => {
  console.log(msg);
});
console.log(result)
