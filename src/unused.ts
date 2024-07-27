// export interface listBrxRequest {
//   start: number;
//   end: number;
// }
// export interface queryStreamResponse {
//   isError?: boolean;
//   errorMsg?: string;
//   promptName?: string;
//   promptValue?: string;
// }
// export interface listBrxResponse {
//   brxs: brxListEntry[];
//   httpResponse?: queryHttpResponse;
// }
// export interface getBrxSchemaRequest {
//   brxId: string;
// }
// export interface getBrxSchemaResponse {
//   userSchemaInteract: userSchemaInteract;
//   httpResponse?: queryHttpResponse;
// }
export interface modifyBrxResponse {
    httpResponse?: queryHttpResponse;
}
// export interface brxValidationRequest {
//   userSchemaInteract: userSchemaInteract;
//   brxs: brx[];
//   isExecute: boolean;
// }
// export interface brxValidationResponse {
//     isError?: boolean;
//     errorMsg?: string;
//     isMainResponse?: boolean;
//     promptName?: string;
//     promptValue?: string;
//   }
export interface queryHttpResponse {
    isError?: boolean;
    statusMsg?: string;
}
// export interface brxListEntry {
//     brxName: string;
//     brxId: string;
//     description: string;
//     dependantBrxIds: Map<string, string>;
//   }
// export function objToMapString(obj: {
//     [key: string]: string;
//   }): Map<string, string> {
//     return new Map(Object.entries(obj));
//   }
//   export function objToMapEntry(obj: {
//       [key: string]: schemaField;
//     }): Map<string, schemaField> {
//       return new Map(Object.entries(obj));
//     }
export enum modifyBrxMode {
    DELETE,
    UPDATE,
    CREATE,
}

//   export interface modifyBrxRequest {
//     modifyBrxMode: modifyBrxMode;
//     schema?: schema;
//     brxId: string;
//     brx?: brx;
//   }
