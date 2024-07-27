import { inputfield } from './Schema/Schema.js';
import { objToMap, objToMapField } from './Schema/Schema.js';
import { userSchemaInteract } from './Schema/Schema.js';

// Interface Definitions
export interface queryStreamRequest {
  userSchemaInteract: userSchemaInteract;
}

export async function updateInputFields(input_fields: Array<inputfield>, brxQuery: any) {
  for (const input of input_fields) {
    const currentSchema = brxQuery.userSchemaInteract.schemas.get(input.entry_key);
    if (currentSchema && currentSchema.schemaFields instanceof Map) {
      const currentField = currentSchema.schemaFields.get(`${input.name}`);
      if (currentField) {
        currentField.fieldValue = input.value;
      } else {
        currentSchema.schemaFields.set(`${input.name}`, {
          fieldValue: input.value,
        });
      }
    }
  }
  return { brxQuery: brxQuery };
}

export function schemaFieldsToQuery(brx_schema_export: string | object) {
  let json_export: any;
  if (typeof brx_schema_export === 'string') {
    json_export = JSON.parse(brx_schema_export);
  } else if (typeof brx_schema_export === 'object' && brx_schema_export !== null) {
    json_export = brx_schema_export;
  }
  const input_fields: any[] = [];
  const outputObject = {
    userSchemaInteract: {
      mainBrxId: json_export.schemas.mainBrxId,
      schemas: objToMap(
        json_export.schemas.schemas.data.reduce((schemas: any, schemaEntry: any) => {
          const [schemaKey, schemaData] = schemaEntry;
          const newBrxName = schemaKey;
          const schemaFields = objToMapField(
            schemaData.schemaFields.data.reduce((fields: any, fieldEntry: any) => {
              const [fieldKey, fieldData] = fieldEntry;
              input_fields.push({
                type: fieldData.fieldValueDataType,
                name: fieldKey,
                entry_key: schemaKey,
                value: '',
              });
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

  return { brxQuery: outputObject, input_fields: input_fields };
}
