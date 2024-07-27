const { default: BRX } = require('brx-node')
const dotenv = require('dotenv')
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!);

async function main() {
    let addcolors = await brx.get('79ecd829-1cb7-4f81-9b46-371cb1ae1af7')
    addcolors.input['add_color1'] = 'Green';
    addcolors.input['add_color3'] = 'Blue';

    console.log(addcolors.run())
}

main()
