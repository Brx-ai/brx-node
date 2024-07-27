import BRX, { schemaFieldsToQuery, updateInputFields } from '../../src/index.js';
import { add_color1 } from './schema.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!);
let addcolors = schemaFieldsToQuery(add_color1);
addcolors.input_fields[0].value = 'Green';
addcolors.input_fields[1].value = 'Blue';

await updateInputFields(addcolors.input_fields, addcolors.brxQuery);

const result = brx.execute(addcolors.brxQuery, msg => {
  console.log(msg);
});
console.log(result)

