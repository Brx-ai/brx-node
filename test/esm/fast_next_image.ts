import BRX, { BRK } from '../../src/index.js';
import { img_vis } from './schema_img.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: true, send_local: true });
let addcolors = new BRK(img_vis);
addcolors.input['user_input'] = 'What do you see in this image?';
addcolors.input['image_url'] = 'https://firebasestorage.googleapis.com/v0/b/brx-frontend.appspot.com/o/imgGen%2FdalleGen%2F2f2f590e-4c12-4d11-9c4e-fc30a033ffbf%2F26cd71a7-199e-4f26-bc04-fba7377fc68a%2F0a846f0b-cf4b-4a23-849c-22effd9d3cd1?alt=media&token=f8426c76-e0e4-4a1a-8ee4-f4a70cbc83f7';
addcolors.input['image_url2'] = 'https://firebasestorage.googleapis.com/v0/b/brx-frontend.appspot.com/o/imgGen%2FdalleGen%2F2f2f590e-4c12-4d11-9c4e-fc30a033ffbf%2F490e7d9f-6a4b-4ab5-84d9-8be339b1bdf4%2F68ff9389-870d-4408-adbe-72acf362a772?alt=media&token=68bf104a-a5c9-48eb-b56a-ae452118c099';

const result = brx.execute(addcolors, msg => {
  console.log(msg);
});
console.log(result)
