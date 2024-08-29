import { processParams, processType } from '../Process.js';

export enum modifyBrxMode {
  DELETE,
  UPDATE,
  CREATE,
  CLONE,
  OP,
}
export interface brxModify {
  modifyBrxMode: modifyBrxMode;
  brxId: string;
  brx?: brxObjectMap;
  schema?: SchemaMap;
}

export interface modifyBrxResponse {
  httpResponse?: queryHttpResponse;
}

export interface queryHttpResponse {
  isError?: boolean;
  statusMsg?: string;
  brxId?: string,
  cloned_from?: string,
}

export class BRKBuilderObject {
  brx: GetSchemaObject
  schema: brxFieldData
  editorJSON?: JSONContent
  constructor() { }
}

export interface GetSchemaSuccess { isError: boolean; statusMsg: string; brkObject: string; }
export interface GetSchemaError { isError: boolean; errorID: string; statusMsg: string; }
export interface ModifySuccess { isError: boolean; statusMsg: string; }
export interface ModifyError { isError: boolean; errorID: string; statusMsg: string; }

export interface RunResult {
  brxId: string;
  brxName: string;
  topLevelBrx?: boolean;
  brxRes: {
    output: string;
  };
}

export declare type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};

export interface brxFieldData {
  schemaFields: { [key: string]: { [key: string]: string } } | Map<string, schemaField>,
  brxName: string,
  brxId: string
}

export interface GetSchemaObject {
  brxId: string;
  brxName: string;
  description: string;
  processParams: processParams | processType;
  dependantBrxIds: { [key: string]: string } | Map<string, schema>;
  prompt?: { [key: string]: { [key: string]: string } | Map<string, schema> };
  schemas?: {
    mainBrxId: string;
    schemas: SchemaObject;
  };
}

export interface schemaField {
  fieldValue?: string;
  fieldValueDataType: string;
  fieldInformation?: {
    pineconeClient?: {
      host: string;
      username: string;
      password: string;
    };
  };
}
export interface inputfield {
  [key: string]: string;
}
export interface schema {
  schemaFields: Map<string, schemaField>;
  brxName: string;
  brxId: string;
}

interface SchemaObject {
  _isMap: boolean;
  data: Array<[string, schemaField | SchemaMap]>; //Use SchemaTuple | schemaMap to be flexible in array input
}

// Create new object for map representation
interface SchemaMap {
  schemaFields: SchemaObject;
  brxName: string;
  brxId: string;
}

// Refactor SchemaOld to accept both SchemaTuple and array of string and schemaMap

export interface userSchemaInteract {
  mainBrxId: string;
  schemas: Map<string, schema>;
}

// Object to Map Converter functions
export function objToMap(obj: { [key: string]: schema }): Map<string, schema> {
  return new Map(Object.entries(obj));
}

export function objToMapField(obj: { [key: string]: schemaField }): Map<string, schemaField> {
  return new Map(Object.entries(obj));
}
export interface brxPrompt {
  prompt: Map<string, string>;
}
export interface brxObject {
  brxName: string;
  brxId: string;
  description: string;
  prompt: brxPrompt;
  processParams: processParams;
  dependantBrxIds: Map<string, string>;
}

export interface brxObjectMap {
  brxName: string;
  brxId: string;
  description: string;
  prompt: {
    prompt: {
      _isMap: boolean;
      data: Array<[string, string]>;
    };
  };
  processParams: {
    processType: number;
  };
  dependantBrxIds: {
    _isMap: boolean;
    data: Array<[string, string]>;
  };
}
