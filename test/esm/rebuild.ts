import readline from 'readline';
import BRX, { objToMap, objToMapField, sftoq, uif } from '../../src/index.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

let input_fields: any[] = []; // Initialized input_fields as an array
let outputObject: any;
let brx_schema_export: any = '';

let env_api_key = process.env.BRXAI_API_KEY!;

const brx = new BRX('', { verbose: true, send_local: true });

async function getUserInput(question: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise<string>(resolve =>
    rl.question(question, ans => {
      rl.close();
      resolve(ans);
    })
  );
}

async function update_inputs() {
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);

    // Update the fieldValue for current input field in the map
    let currentSchema = outputObject.userSchemaInteract.schemas.get(input.entry_key);

    if (currentSchema && currentSchema.schemaFields instanceof Map) {
      let currentField = currentSchema.schemaFields.get(`${input.name}`);

      if (currentField) {
        // Update the existing fieldValue
        currentField.fieldValue = value;
      } else {
        // fieldValue not present currently, add a new one
        currentSchema.schemaFields.set(`${input.name}`, { fieldValue: value });
      }
    }
  }
}

const query_rebuilder = async () => {
  // console.log("starting rebuild: "  , input_fields)
  let json_export: any = JSON.parse(brx_schema_export);
  // let json_export:any =  brx_schema_export
  // console.log(json_export)
  outputObject = {
    userSchemaInteract: {
      mainBrxId: json_export.schemas.mainBrxId,
      schemas: objToMap(
        json_export.schemas.schemas.data.reduce((schemas: any, schemaEntry: any) => {
          const [schemaKey, schemaData] = schemaEntry;
          const newBrxName = schemaKey;

          const schemaFields = objToMapField(
            schemaData.schemaFields.data.reduce((fields: any, fieldEntry: any) => {
              const [fieldKey, fieldData] = fieldEntry;
              input_fields.push({ type: fieldData.fieldValueDataType, name: fieldKey, entry_key: schemaKey });

              fields[fieldKey] = { ...fieldData, fieldValue: fieldKey };
              return fields;
            }, {})
          );

          schemas[schemaKey] = {
            brxId: schemaData.brxId,
            brxName: newBrxName,
            schemaFields,
          };

          return schemas;
        }, {})
      ),
    },
  };
};

async function testCase1() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This BRK adds input colors',
    brxName: 'Add Colors',
    brxId: '590ac222-f291-4da6-9123-a4822957d155',
    dependantBrxIds: { invert_color_1: '01afd050-fe19-406b-9b83-891c48ec5198' },
    schemas: {
      mainBrxId: '590ac222-f291-4da6-9123-a4822957d155',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: { _isMap: true, data: [['colorAdd1', { fieldValueDataType: 'string', description: 'test123' }]] },
              brxName: 'Invert Color',
              brxId: '01afd050-fe19-406b-9b83-891c48ec5198',
            },
          ],
          [
            'invert_color_1',
            {
              schemaFields: { _isMap: true, data: [['userInvertColor', { fieldValueDataType: 'string', description: 'lol123' }]] },
              brxName: 'Invert Color',
              brxId: '01afd050-fe19-406b-9b83-891c48ec5198',
            },
          ],
        ],
      },
    },
  };
  let brx_schema_export_string = `{"description":"This BRK adds input colors","brxName":"Add Colors","brxId":"590ac222-f291-4da6-9123-a4822957d155","dependantBrxIds":{"invert_color_1":"01afd050-fe19-406b-9b83-891c48ec5198"},"schemas":{"mainBrxId":"590ac222-f291-4da6-9123-a4822957d155","schemas":{"_isMap":true,"data":[["main_brx_entry_schema",{"schemaFields":{"_isMap":true,"data":[["colorAdd1",{"fieldValueDataType":"string","description":"test123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}],["invert_color_1",{"schemaFields":{"_isMap":true,"data":[["userInvertColor",{"fieldValueDataType":"string","description":"lol123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}]]}}}`;
  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // console.log("After Rebuilder")
  // console.log(input_fields)

  // let update_oo = await uifcli(input_fields , outputObject)
  let update_oo = await uif(input_fields, outputObject);

  console.log(update_oo.brxQuery);

  // await update_inputs();

  // console.log(outputObject)

  const result = await brx.execute(update_oo.brxQuery);
  console.log('After Execution');
  console.log(result);
}

async function testCase2() {
  // This is testing the json object flop process
  let brx_schema_export_string = `{"description":"This BRK adds input colors","brxName":"Add Colors","brxId":"590ac222-f291-4da6-9123-a4822957d155","dependantBrxIds":{"invert_color_1":"01afd050-fe19-406b-9b83-891c48ec5198"},"schemas":{"mainBrxId":"590ac222-f291-4da6-9123-a4822957d155","schemas":{"_isMap":true,"data":[["main_brx_entry_schema",{"schemaFields":{"_isMap":true,"data":[["colorAdd1",{"fieldValueDataType":"string","description":"test123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}],["invert_color_1",{"schemaFields":{"_isMap":true,"data":[["userInvertColor",{"fieldValueDataType":"string","description":"lol123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}]]}}}`;
  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export_string);

  console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // console.log("After Rebuilder")
  // console.log(input_fields)

  // let update_oo = await uifcli(input_fields , outputObject)
  let update_oo = await uif(input_fields, outputObject);

  console.log(update_oo.brxQuery);

  // await update_inputs();

  // console.log(outputObject)

  const result = await brx.execute(update_oo.brxQuery);
  console.log('After Execution');
  console.log(result);
}

async function testCase3() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This BRK adds input colors',
    brxName: 'Add Colors',
    brxId: '590ac222-f291-4da6-9123-a4822957d155',
    dependantBrxIds: { invert_color_1: '01afd050-fe19-406b-9b83-891c48ec5198' },
    schemas: {
      mainBrxId: '590ac222-f291-4da6-9123-a4822957d155',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: { _isMap: true, data: [['colorAdd1', { fieldValueDataType: 'string', description: 'test123' }]] },
              brxName: 'Invert Color',
              brxId: '01afd050-fe19-406b-9b83-891c48ec5198',
            },
          ],
          [
            'invert_color_1',
            {
              schemaFields: { _isMap: true, data: [['userInvertColor', { fieldValueDataType: 'string', description: 'lol123' }]] },
              brxName: 'Invert Color',
              brxId: '01afd050-fe19-406b-9b83-891c48ec5198',
            },
          ],
        ],
      },
    },
  };
  let brx_schema_export_string = `{"description":"This BRK adds input colors","brxName":"Add Colors","brxId":"590ac222-f291-4da6-9123-a4822957d155","dependantBrxIds":{"invert_color_1":"01afd050-fe19-406b-9b83-891c48ec5198"},"schemas":{"mainBrxId":"590ac222-f291-4da6-9123-a4822957d155","schemas":{"_isMap":true,"data":[["main_brx_entry_schema",{"schemaFields":{"_isMap":true,"data":[["colorAdd1",{"fieldValueDataType":"string","description":"test123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}],["invert_color_1",{"schemaFields":{"_isMap":true,"data":[["userInvertColor",{"fieldValueDataType":"string","description":"lol123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}]]}}}`;
  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);

  console.log(update_oo.brxQuery);

  const result = await brx.execute(update_oo.brxQuery);
  // const result = await brx.execute(update_oo.brxQuery, (event:any) => {console.log(event)});
  console.log('After Execution');
  console.log(result);
}

async function testCase4() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This is a vision test with real img',
    brxName: 'vtest234',
    brxId: 'f6e4601f-dec1-4032-aafb-5e4731e3484c',
    dependantBrxIds: {},
    schemas: {
      mainBrxId: 'f6e4601f-dec1-4032-aafb-5e4731e3484c',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: { _isMap: true, data: [['img_context', { fieldValueDataType: 'string', fieldValue: 'testval' }]] },
              brxName: 'vtest234',
              brxId: 'f6e4601f-dec1-4032-aafb-5e4731e3484c',
            },
          ],
        ],
      },
    },
  };
  // brx_schema_export = {"description":"This tests the resolve of the vars","brxName":"Resolve_test_dep","brxId":"c156bcb8-0606-404c-94a7-648bca6afc2e","dependantBrxIds":{"dep_9246447b-8ed2-4c6c-a139-bd2ae79b0703":"9246447b-8ed2-4c6c-a139-bd2ae79b0703"},"schemas":{"mainBrxId":"c156bcb8-0606-404c-94a7-648bca6afc2e","schemas":{"_isMap":true,"data":[["main_brx_entry_schema",{"schemaFields":{"_isMap":true,"data":[]},"brxName":"Resolve_test_dep","brxId":"c156bcb8-0606-404c-94a7-648bca6afc2e"}],["dep_9246447b-8ed2-4c6c-a139-bd2ae79b0703",{"schemaFields":{"_isMap":true,"data":[["var1f",{"fieldValueDataType":"string","fieldValue":"testval"}]]},"brxName":"testing_var_return","brxId":"9246447b-8ed2-4c6c-a139-bd2ae79b0703"}]]}}}
  let brx_schema_export_string = `{"description":"This BRK adds input colors","brxName":"Add Colors","brxId":"590ac222-f291-4da6-9123-a4822957d155","dependantBrxIds":{"invert_color_1":"01afd050-fe19-406b-9b83-891c48ec5198"},"schemas":{"mainBrxId":"590ac222-f291-4da6-9123-a4822957d155","schemas":{"_isMap":true,"data":[["main_brx_entry_schema",{"schemaFields":{"_isMap":true,"data":[["colorAdd1",{"fieldValueDataType":"string","description":"test123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}],["invert_color_1",{"schemaFields":{"_isMap":true,"data":[["userInvertColor",{"fieldValueDataType":"string","description":"lol123"}]]},"brxName":"Invert Color","brxId":"01afd050-fe19-406b-9b83-891c48ec5198"}]]}}}`;
  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);

  console.log(update_oo.brxQuery);

  const result = await brx.execute(update_oo.brxQuery);
  console.log('After Execution');
  console.log(result);
}

function callback_external() {
  console.log('Internal Callback reached!!--=-=-=-=-=-=-=-==-=');
}

async function testCase5() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This is a test for the internal embedding for brx',
    brxName: 'embedding_testing',
    brxId: '804a9845-561f-4fc1-8865-e695c645a21b',
    dependantBrxIds: {},
    schemas: {
      mainBrxId: '804a9845-561f-4fc1-8865-e695c645a21b',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: { _isMap: true, data: [['embedding_input_text', { fieldValueDataType: 'string', fieldValue: 'testval' }]] },
              brxName: 'embedding_testing',
              brxId: '804a9845-561f-4fc1-8865-e695c645a21b',
            },
          ],
        ],
      },
    },
  };

  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);

  console.log(update_oo.brxQuery);

  const result = await brx.execute(update_oo.brxQuery);
  // const result = await brx.execute(update_oo.brxQuery, (event:any) => {console.log(event)});
  console.log('After Execution');
  console.log(result);
}

async function testCase6() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This is a image test of dalle',
    brxName: 'dall_test',
    brxId: '62d3d092-1221-4163-89ac-50b9207da846',
    dependantBrxIds: {},
    processType: 16,
    schemas: {
      mainBrxId: '62d3d092-1221-4163-89ac-50b9207da846',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: { _isMap: true, data: [['image_type', { fieldValueDataType: 'string', fieldValue: 'testval' }]] },
              brxName: 'dall_test',
              brxId: '62d3d092-1221-4163-89ac-50b9207da846',
            },
          ],
        ],
      },
    },
  };

  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);

  console.log(update_oo.brxQuery);

  const result = await brx.execute(update_oo.brxQuery);
  // const result = await brx.execute(update_oo.brxQuery, (event:any) => {console.log(event)});
  console.log('After Execution');
  console.log(result);
}

async function testCase7() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This is the first groq run brk',
    brxName: 'groq_test1',
    brxId: '1339efaa-5db1-4b73-8105-7903dd039279',
    dependantBrxIds: {},
    processType: 18,
    schemas: {
      mainBrxId: '1339efaa-5db1-4b73-8105-7903dd039279',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: { _isMap: true, data: [['Best-way-to-do-x', { fieldValueDataType: 'string', fieldValue: 'testval' }]] },
              brxName: 'groq_test1',
              brxId: '1339efaa-5db1-4b73-8105-7903dd039279',
            },
          ],
        ],
      },
    },
  };

  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);

  console.log(update_oo.brxQuery);

  const result = await brx.execute(update_oo.brxQuery);
  // const result = await brx.execute(update_oo.brxQuery, (event:any) => {console.log(event)});
  console.log('After Execution');
  console.log(result);
}

// Embedding Op
async function testCase8() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This is the embedding test for large and small',
    brxName: 'embed_test_sl',
    brxId: '7fbbe4fd-b847-431e-beec-be7aef7d5917',
    dependantBrxIds: {},
    processType: 7,
    schemas: {
      mainBrxId: '7fbbe4fd-b847-431e-beec-be7aef7d5917',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: {
                _isMap: true,
                data: [['embed_text', { fieldValueDataType: 'string', fieldValue: 'testval' }]],
              },
              brxName: 'embed_test_sl',
              brxId: '7fbbe4fd-b847-431e-beec-be7aef7d5917',
            },
          ],
        ],
      },
    },
  };

  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  // console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);
  let result = await brx.execute(update_oo.brxQuery);
  console.log(result);
  // console.log(update_oo.brxQuery);
}

// Long Op
async function testCase9() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = {
    description: 'This instance is combine the brks running the supply chain ingestion for forecasting demand',
    brxName: 'combine3_supply_chain_forecasting_demand_updated',
    brxId: '677a6a39-aefc-4b92-9d8f-af620acea7a0',
    dependantBrxIds: {
      'dep_e1ee2b53-89e1-4ee2-80a0-c17ca0ab766c': 'e1ee2b53-89e1-4ee2-80a0-c17ca0ab766c',
      'dep_b623f924-dbd5-4edf-adc9-7635d0875d0e': 'b623f924-dbd5-4edf-adc9-7635d0875d0e',
      'dep_76188883-2401-47d2-9670-e18624e56c25': '76188883-2401-47d2-9670-e18624e56c25',
      'dep_4123e3d0-45f6-4e4f-9ea6-777e131a8a88': '4123e3d0-45f6-4e4f-9ea6-777e131a8a88',
      'dep_b39bcb49-297f-411c-90d6-aae31b60eef0': 'b39bcb49-297f-411c-90d6-aae31b60eef0',
      'dep_bc63c720-3abd-458d-827d-d2a6231793f7': 'bc63c720-3abd-458d-827d-d2a6231793f7',
    },
    processType: 7,
    schemas: {
      mainBrxId: '677a6a39-aefc-4b92-9d8f-af620acea7a0',
      schemas: {
        _isMap: true,
        data: [
          [
            'main_brx_entry_schema',
            {
              schemaFields: { _isMap: true, data: [['Forecasting-Direction', { fieldValueDataType: 'string', fieldValue: 'testval' }]] },
              brxName: 'combine3_supply_chain_forecasting_demand_updated',
              brxId: '677a6a39-aefc-4b92-9d8f-af620acea7a0',
            },
          ],
          [
            'dep_e1ee2b53-89e1-4ee2-80a0-c17ca0ab766c',
            {
              schemaFields: { _isMap: true, data: [['supply-chain-data-input', { fieldValueDataType: 'string', fieldValue: 'testval' }]] },
              brxName: 'supply_chain_top_data_var',
              brxId: 'e1ee2b53-89e1-4ee2-80a0-c17ca0ab766c',
            },
          ],
          [
            'dep_b623f924-dbd5-4edf-adc9-7635d0875d0e',
            { schemaFields: { _isMap: true, data: [] }, brxName: 'generate_xy_mermaid_leadtime', brxId: 'b623f924-dbd5-4edf-adc9-7635d0875d0e' },
          ],
          [
            'dep_19413ced-474b-4ee4-ab40-05746e9978d6',
            { schemaFields: { _isMap: true, data: [] }, brxName: 'leadtime_extraction', brxId: '19413ced-474b-4ee4-ab40-05746e9978d6' },
          ],
          [
            'dep_76188883-2401-47d2-9670-e18624e56c25',
            {
              schemaFields: { _isMap: true, data: [] },
              brxName: 'generate_mermaid_xy_customer_sentiment_analysis',
              brxId: '76188883-2401-47d2-9670-e18624e56c25',
            },
          ],
          [
            'dep_b8c16fb9-329c-445a-8e44-1709311667bb',
            {
              schemaFields: { _isMap: true, data: [] },
              brxName: 'generate_customer_sentiment_analysis',
              brxId: 'b8c16fb9-329c-445a-8e44-1709311667bb',
            },
          ],
          [
            'dep_4123e3d0-45f6-4e4f-9ea6-777e131a8a88',
            { schemaFields: { _isMap: true, data: [] }, brxName: 'generate_xy_mermiad_inv_opt', brxId: '4123e3d0-45f6-4e4f-9ea6-777e131a8a88' },
          ],
          [
            'dep_93b69193-d122-4eaf-a783-a949bccba618',
            { schemaFields: { _isMap: true, data: [] }, brxName: 'inventory_optimization', brxId: '93b69193-d122-4eaf-a783-a949bccba618' },
          ],
          [
            'dep_b39bcb49-297f-411c-90d6-aae31b60eef0',
            { schemaFields: { _isMap: true, data: [] }, brxName: 'generate_xy_mermaid_risk_analysis', brxId: 'b39bcb49-297f-411c-90d6-aae31b60eef0' },
          ],
          [
            'dep_2bad7a01-9959-481c-9fff-6a013ba3b32f',
            { schemaFields: { _isMap: true, data: [] }, brxName: 'supply_chain_risk_analysis', brxId: '2bad7a01-9959-481c-9fff-6a013ba3b32f' },
          ],
          [
            'dep_bc63c720-3abd-458d-827d-d2a6231793f7',
            {
              schemaFields: { _isMap: true, data: [] },
              brxName: 'generate_xy_mermaid_chart_for_defect2',
              brxId: 'bc63c720-3abd-458d-827d-d2a6231793f7',
            },
          ],
          [
            'dep_98dc1f8a-0598-46bf-99ad-f54a711702d6',
            { schemaFields: { _isMap: true, data: [] }, brxName: 'defect_rates_by_product_type', brxId: '98dc1f8a-0598-46bf-99ad-f54a711702d6' },
          ],
        ],
      },
    },
  };

  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  // console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);
  let result = await brx.execute(update_oo.brxQuery, (event: any) => {
    console.log(event);
  });
  console.log(result);
  // console.log(update_oo.brxQuery);
}

async function testCase10() {
  // brx_schema_export = await getUserInput("Please enter the brx_schema_export: ");
  brx_schema_export = { "description": "This is the claude opus test", "brxName": "claude_opus_test", "brxId": "3c4812ee-08a8-4c9f-ac62-2f7e8d62c058", "dependantBrxIds": {}, "processType": 21, "schemas": { "mainBrxId": "3c4812ee-08a8-4c9f-ac62-2f7e8d62c058", "schemas": { "_isMap": true, "data": [["main_brx_entry_schema", { "schemaFields": { "_isMap": true, "data": [["user-input", { "fieldValueDataType": "string", "fieldValue": "testval" }]] }, "brxName": "claude_opus_test", "brxId": "3c4812ee-08a8-4c9f-ac62-2f7e8d62c058" }]] } } }

  // await query_rebuilder();
  let query_rebuild = sftoq(brx_schema_export);

  // console.log(query_rebuild);

  outputObject = query_rebuild.brxQuery;
  input_fields = query_rebuild.input_fields;

  // Simulates updating the inputfeilds
  for (const input of input_fields) {
    // Get value for current input field from user
    const value = await getUserInput(`Please enter the value for ${input.name}: `);
    input.value = value;
  }
  let update_oo = await uif(input_fields, outputObject);
  let result = await brx.execute(update_oo.brxQuery);
  console.log(result);
  // console.log(update_oo.brxQuery);
}

(async function () {
  await testCase10();
  console.log('Exiting Main....');
})();
