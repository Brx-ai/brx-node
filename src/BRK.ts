import { BRX } from './BRX.js';
import { GetSchemaObject, inputfield, RunResult } from './Schema/Schema.js';
import { objToMap, objToMapField } from './Schema/Schema.js';

export class BRK {
  input: any;
  brxQuery: any;
  inprogress: boolean = false;
  BRXClient?: BRX

  constructor(BRKSchema?: GetSchemaObject, BRXClient?: BRX) {
    if (BRKSchema !== undefined) {
      this.SchemaToClass(BRKSchema)
    }
    if (BRXClient !== undefined) {
      this.BRXClient = BRXClient
    }
  }

  async run(callback?: (message: RunResult) => void) {
    if (this.BRXClient !== undefined) {
      if (callback !== undefined) {
        return this.BRXClient.run(this, callback)
      }
      return this.BRXClient.run(this)
    }
  }

  async updateBRK(verbose?: boolean) {
    for (const key in this.input) {
      this.brxQuery.userSchemaInteract.schemas.forEach((schema: any) => {
        if (schema.schemaFields instanceof Map) {
          if (schema.schemaFields.has(key)) {
            const field = schema.schemaFields.get(key);
            field.fieldValue = this.input[key];
            if (verbose) {
              console.log(`Updated ${key} with value ${this.input[key]}`);
            }
          }
        }
      });
    }
    return { brxQuery: this.brxQuery };
  }

  public SchemaToClass(BRKSchema: GetSchemaObject) {
    if (BRKSchema.schemas == undefined) {
      throw new Error('Invalid BRK Object: Schemas undefined.')
    }

    const input_fields: inputfield = {};
    const outputObject = {
      userSchemaInteract: {
        mainBrxId: BRKSchema.schemas.mainBrxId,
        schemas: objToMap(
          BRKSchema.schemas.schemas.data.reduce((schemas: any, schemaEntry: any) => {
            const [schemaKey, schemaData] = schemaEntry;
            const newBrxName = schemaKey;
            const schemaFields = objToMapField(
              schemaData.schemaFields.data.reduce((fields: any, fieldEntry: any) => {
                const [fieldKey, fieldData] = fieldEntry;
                input_fields[fieldKey] = ''
                fields[fieldKey] = { ...fieldData, fieldValue: '' };
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
    this.input = input_fields;
    this.brxQuery = outputObject;
  }
}
