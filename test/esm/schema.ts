import { GetSchemaObject } from '../../src/Schema/Schema.js';
export let add_color1: GetSchemaObject = {
  description: 'this is add color2',
  brxName: 'add_color2',
  brxId: '6fdad0a7-9073-4823-9417-fc9b0605a3b6',
  dependantBrxIds: {
    addcolor1: 'fb535632-ead9-42d7-a0f0-57082f9f8b4a',
  },
  processParams: 0,
  schemas: {
    mainBrxId: '6fdad0a7-9073-4823-9417-fc9b0605a3b6',
    schemas: {
      _isMap: true,
      data: [
        [
          'main_brx_entry_schema',
          {
            schemaFields: {
              _isMap: true,
              data: [
                [
                  'add_color3',
                  {
                    fieldValueDataType: 'string',
                    fieldValue: 'testval',
                  },
                ],
              ],
            },
            brxName: 'add_color2',
            brxId: '6fdad0a7-9073-4823-9417-fc9b0605a3b6',
          },
        ],
        [
          'addcolor1',
          {
            schemaFields: {
              _isMap: true,
              data: [
                [
                  'add_color1',
                  {
                    fieldValueDataType: 'string',
                    fieldValue: 'testval',
                  },
                ],
              ],
            },
            brxName: 'addcolor1',
            brxId: 'fb535632-ead9-42d7-a0f0-57082f9f8b4a',
          },
        ],
      ],
    },
  },
};
