import BRX from '../../src/index.js';
import { nd_base } from './schema_nd.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: true, send_local: true });
let base = await brx.get('asdasdasdsad');
base.input['insert_prompt'] = `hello world`;

const result = brx.execute(base, msg => {
  console.log(msg);
});
console.log(result)
