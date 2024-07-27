import BRX, { BRK } from '../../src/index.js';
import { test_batch } from './schemabatch.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: true, send_local: true });
let addcolors = new BRK(test_batch);
addcolors.input['token_inject'] = `This should go into opus please`;

const result = brx.execute(addcolors, msg => {
  console.log(msg);
});
console.log(result)
