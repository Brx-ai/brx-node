import BRX, { BRK, mapReplacer, mapReviver } from "../../lib/esm/index.js"
import dotenv from 'dotenv';
import { brxModify, modifyBrxMode } from "../../lib/esm/Schema/Schema.js";
dotenv.config({ path: '../../.env' });

const brx = new BRX(process.env.BRXAI_API_KEY!, { verbose: true, send_local: true });

let init_create: brxModify = {
    "modifyBrxMode": modifyBrxMode.CREATE,
    "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774",
    "brx": {
        "brxName": "newObjectTest",
        "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774",
        "dependantBrxIds": {
            "_isMap": true,
            "data": []
        },
        "description": "This is a test of the new object format",
        "prompt": {
            "prompt": {
                "_isMap": true,
                "data": [
                    [
                        "system",
                        "This is a simple instance with one depend for testing :)\n\n\n### something\nbrx{{something}}\n###\n Always respond with green please :)"
                    ]
                ]
            }
        },
        "processParams": {
            "processType": 7
        }
    },
    "schema": {
        "schemaFields": {
            "_isMap": true,
            "data": [
                [
                    "something",
                    {
                        "fieldValueDataType": "string",
                        "fieldValue": ""
                    }
                ]
            ]
        },
        "brxName": "newObjectTest",
        "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774"
    }
}

let modify_object: brxModify = {
    "modifyBrxMode": modifyBrxMode.UPDATE,
    "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774",
    "brx": {
        "brxName": "testing_brk123",
        "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774",
        "dependantBrxIds": {
            "_isMap": true,
            "data": [
                [
                    "dep_15db3144-5eb9-4e31-ace9-6edf449c46d5",
                    "15db3144-5eb9-4e31-ace9-6edf449c46d5"
                ]
            ]
        },
        "description": "THis is a test",
        "prompt": {
            "prompt": {
                "_isMap": true,
                "data": [
                    [
                        "system",
                        "Please respond with blue combined the response below\n\n\nbrx{{dep_15db3144-5eb9-4e31-ace9-6edf449c46d5}} \n\nPlease say the whole color adding sequence in the response aswell 123 xyz"
                    ]
                ]
            }
        },
        "processParams": {
            "processType": 7
        }
    },
    "schema": {
        "schemaFields": {
            "_isMap": true,
            "data": []
        },
        "brxName": "testing_brk123",
        "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774"
    }
}

let clone_obj: brxModify = {
    "modifyBrxMode": modifyBrxMode.CLONE,
    "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774"
}

let delete_obj: brxModify = {
    "modifyBrxMode": modifyBrxMode.DELETE,
    "brxId": "0c3b15f5-28c4-45e4-8bc3-f26511a10774"
}

console.log(modify_object)

// Create and call

let create = await brx.modify(init_create)

console.log(create)

// Update BRK

let update = await brx.modify(modify_object)

console.log(update);

// Clone Brk

let clone = await brx.modify(clone_obj)

console.log(clone);

// Delete BRKs

let delete1 = await brx.modify(delete_obj);

console.log(delete1)
