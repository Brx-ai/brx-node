import { WebSocket as ServerWebSocket } from 'ws';
import axios, { Axios, AxiosError } from 'axios';
import { BRK } from './BRK.js';
import { mapReplacer } from './Sockets.js';
import { queryStreamRequest } from './oldFunctions.js';
import { GetSchemaError, GetSchemaObject, GetSchemaSuccess, inputfield, objToMap, objToMapField, RunResult, brxModify, modifyBrxResponse, ModifyError, ModifySuccess, brxFieldData } from './Schema/Schema.js';

const isNode = () => typeof process !== 'undefined' && !!process.versions && !!process.versions.node;

// BRX class with its methods
export class BRX {
  _CONN_STRING: string;
  _BASE_STRING: string;
  _MODIFY_CONN_STRING: string;
  _sockets: Map<string, ServerWebSocket | WebSocket> = new Map<string, ServerWebSocket | WebSocket>();
  socket!: ServerWebSocket;
  clientSocket!: WebSocket;
  verbose?: boolean;
  accessToken: string;
  inBrowser: boolean;
  webhookOpenFlag!: boolean;
  webhookClosedFlag!: boolean;
  webhookOpenFlags: { [key: string]: boolean } = {};
  webhookClosedFlags: { [key: string]: boolean } = {};
  initalized: boolean;
  response_stream: Array<string>;
  use_api_key?: boolean;
  pull_length_from_query!: boolean;
  send_local?: boolean;
  force_client?: boolean;
  silent?: boolean;

  constructor(
    accessToken: string,
    options: {
      use_brx_key?: boolean;
      verbose?: boolean;
      send_local?: boolean;
      force_client?: boolean;
      silent?: boolean;
    } = {
        use_brx_key: true,
        verbose: false,
        send_local: false,
        force_client: false,
        silent: false,
      }
  ) {
    let { use_brx_key, verbose, send_local, force_client, silent } = options;
    if (silent == undefined) {
      silent = false;
    }
    if (use_brx_key == undefined) {
      use_brx_key = true;
    }
    if (force_client == undefined) {
      force_client = false;
    }

    if (verbose) {
      console.log('Top Level Options: ', options);
      console.log('Using Access Token: ', this.accessToken);
    }

    this._CONN_STRING = send_local ? 'ws://localhost:8080/query_stream' : 'wss://api.brx.ai/query_stream';
    this._BASE_STRING = send_local ? 'http://localhost:8080/' : 'https://api.brx.ai/';
    this._MODIFY_CONN_STRING = send_local ? 'http://localhost:8080/modify_brx' : 'https://api.brx.ai/modify_brx';

    if (!silent) {
      console.log(`  ██████╗ ██████╗ ██╗  ██╗
  ██╔══██╗██╔══██╗╚██╗██╔╝
  ██████╔╝██████╔╝ ╚███╔╝           Amplify not replace | https://brx.ai
  ██╔══██╗██╔══██╗ ██╔██╗ 
  ██████╔╝██║  ██║██╔╝ ██╗
  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝                  

Using Package ${send_local ? 'Local' : 'Global'} Connection: brx.ai\nWARN: ${send_local ? 'Local' : 'Global'} Conn Strings enabled\n`);
    }

    this.force_client = force_client;
    this.send_local = send_local;
    this.verbose = verbose;
    this.accessToken = accessToken;
    this.use_api_key = use_brx_key;
    this.pull_length_from_query = true;
    this.initalized = false;
  }

  private SchemaToClass(BRKSchema: GetSchemaObject): BRK {
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
    const NewBRK = new BRK()
    NewBRK.input = input_fields
    NewBRK.brxQuery = outputObject
    NewBRK.BRXClient = this
    return NewBRK
  }

  async initWebSocketConnection(accessToken: string): Promise<string> {
    const socketId: string = `${Math.floor(Math.random() * 100000)}`;
    this.webhookClosedFlags[socketId] = false;
    this.webhookOpenFlags[socketId] = false;

    if (!this.force_client && isNode()) {
      if (this.verbose) {
        console.log('Running Server Side');
      }
      this.inBrowser = false;
      if (this.use_api_key) {
        if (this.verbose) {
          console.log('Using BRX Api key at auth level');
        }
        this.socket = new ServerWebSocket(this._CONN_STRING, {
          headers: { key: `${accessToken}` },
        });
        this._sockets.set(socketId, this.socket);
      } else {
        if (this.verbose) {
          console.log('Using Firebase Auth at auth level');
        }
        this.socket = new ServerWebSocket(this._CONN_STRING, ['authorization', `${accessToken}`]);
        this._sockets.set(socketId, this.socket);
      }

      const socket: any = this._sockets.get(socketId);

      socket.addEventListener('message', (event: any) => {
        const data = JSON.parse(event.data)
        if (data.queryStreamResponse && data.queryStreamResponse.isError) { // Check for error response.
          console.error(`Auth error: ${data.queryStreamResponse.errMsg}`);
          // Additional error handling can be placed here.
          socket.removeEventListener('message'); // Removing message listener after checking for the error.
        }
      });

      socket.addEventListener('open', (event: any) => {
        if (this.verbose) {
          console.log('WebSocket connection opened');
        }
        this.webhookOpenedTrigger(socketId);
      });

      socket.addEventListener('close', (event: any) => {
        if (this.verbose) {
          console.log('WebSocket connection closed');
        }
        this.webhookClosedTrigger(socketId);
      });

      socket.addEventListener('error', (event: any) => {
        if (this.verbose) {
          console.log('WebSocket error:', event);
        }
      });
    } else {
      console.log('Running Client Side');
      this.inBrowser = true;
      if (this.use_api_key) {
        this.clientSocket = new WebSocket(this._CONN_STRING, ['clientKey', `${accessToken}`]);
        this._sockets.set(socketId, this.clientSocket);
      } else {
        if (this.verbose) {
          console.log('Using Firebase Auth at auth level');
        }
        this.clientSocket = new WebSocket(this._CONN_STRING, ['authorization', `${accessToken}`]);
        this._sockets.set(socketId, this.clientSocket);
      }

      const clientSocket: any = this._sockets.get(socketId);

      clientSocket.addEventListener('message', (event: any) => {
        const data = JSON.parse(event.data)
        if (data.queryStreamResponse && data.queryStreamResponse.isError) { // Check for error response.
          console.error(`Auth error: ${data.queryStreamResponse.errMsg}`);
          // Additional error handling can be placed here.
          clientSocket.removeEventListener('message'); // Removing message listener after checking for the error.
        }
      });

      clientSocket.addEventListener('open', (event: any) => {
        if (this.verbose) {
          console.log('WebSocket connection opened');
        }
        this.webhookOpenedTrigger(socketId);
      });

      clientSocket.addEventListener('close', (event: any) => {
        if (this.verbose) {
          console.log('WebSocket connection closed');
        }
        this.webhookClosedTrigger(socketId);
      });

      clientSocket.addEventListener('error', (event: any) => {
        if (this.verbose) {
          console.log('WebSocket error:', event);
        }
      });
    }
    return socketId;
  }

  webhookClosedTrigger(socketId: string) {
    this.webhookClosedFlags[socketId] = true;
  }
  webhookOpenedTrigger(socketId: string) {
    this.webhookOpenFlags[socketId] = true;
  }

  async waitForWebhookOpen(socketId: string): Promise<void> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.webhookOpenFlags[socketId]) {
          clearInterval(interval);
          this.webhookOpenFlags[socketId] = false;
          resolve();
        }
      }, 100);
    });
  }

  async waitForWebhookClose(socketId: string): Promise<void> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (this.webhookClosedFlags[socketId]) {
          clearInterval(interval);
          this.webhookClosedFlags[socketId] = false;
          resolve();
        }
      }, 100);
    });
  }

  socketWait = (x: number): Promise<void> => new Promise(resolve => setTimeout(resolve, x));

  async sfid(brxID: string): Promise<BRK> {
    try {
      const url = `${this._BASE_STRING}schema_from_id`;
      const response = await axios.post(url, { brxId: brxID }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          key: this.accessToken,
        }
      });
      const SchemaResponse: GetSchemaSuccess | GetSchemaError = response.data.httpResponse;
      if (SchemaResponse.isError == true) {
        let ErrorMessage = ''
        const ErrorPointer = (SchemaResponse as GetSchemaError).statusMsg
        if (ErrorPointer == 'no emails') {
          ErrorMessage = 'Unauthorized: Check BRK ID or BRK Access'
        } else {
          ErrorMessage = ErrorPointer
        }
        throw new Error(ErrorMessage)
      }
      const BRKResponse: GetSchemaObject = JSON.parse((SchemaResponse as GetSchemaSuccess).brkObject)
      return this.SchemaToClass(BRKResponse);
    } catch (error: AxiosError | any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status == 401) {
          throw new Error(JSON.stringify('Unauthorized: API Key Invalid'))
        }
        throw new Error(JSON.stringify(error))
      } else {
        throw new Error(error)
      }
    }
  }

  async execute(query: BRK | queryStreamRequest, callback?: (message: RunResult) => void): Promise<Array<RunResult>> {
    if (query instanceof BRK) {
      query.inprogress = true;
      await query.updateBRK(this.verbose);
    }

    if (this.verbose) {
      console.log('Starting Execute');
    }

    let socketId: any;
    try {
      socketId = await this.initWebSocketConnection(this.accessToken);
    } catch (error) {
      console.log(error);
    }
    // const socketId = await this.initWebSocketConnection(this.accessToken);
    const socket: any = this._sockets.get(socketId);

    if (this.verbose) {
      console.log('----====Socket Debug===---');
      console.log(socketId);
      console.log('-=-=-=-=-=-=-=-==-=-=-=');
      console.log('Websocket Initalized');
    }

    await this.waitForWebhookOpen(socketId);
    // Todo: Validate Auth Throw error to user
    await this.socketWait(1000);

    // Todo: Add socket retry here

    if (this.verbose) {
      console.log('Waiting Hook is open');
    }
    const brx: any = [];

    let response_length = 0;

    if (this.pull_length_from_query) {
      if (query instanceof BRK) {
        response_length = query.brxQuery.userSchemaInteract.schemas.size;
      } else {
        response_length = query.userSchemaInteract.schemas.size;
      }
    }
    if (this.verbose) {
      console.log('Response Length Set to ', response_length);
    }

    const messageListener = async (event: any) => {
      const data = this.inBrowser ? JSON.parse(event.data) : JSON.parse(event.data);
      brx.push(data);
      if (callback && typeof callback === 'function') {
        callback(data);
      }

      if (brx.length == response_length) {
        socket!.removeEventListener('message', messageListener);
        await this.waitForWebhookClose(socketId);
        if (this.verbose) {
          console.log(brx);
        }
        return brx;
      }
    };

    if (this.verbose) {
      console.log('Sending WS message');
    }

    if (query instanceof BRK) {
      socket!.send(JSON.stringify(query.brxQuery, mapReplacer));
    } else {
      socket!.send(JSON.stringify(query, mapReplacer));
    }

    const result = await new Promise(resolve => {
      socket!.addEventListener('message', (event: any) => {
        messageListener(event).then(resolvedValue => {
          if (resolvedValue) {
            resolve(resolvedValue);
          }
        });
      });
    });
    if (query instanceof BRK) {
      query.inprogress = false;
    }
    return result as RunResult[];
  }

  async modify(modifyRequest: brxModify): Promise<ModifySuccess | ModifyError> {
    try {
      const url = this._MODIFY_CONN_STRING;
      const response = await axios.post(url, modifyRequest, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          key: this.accessToken,
        }
      });
      const ModifyResponse: ModifySuccess | ModifyError = response.data.modifyBrxResponse.httpResponse;
      if (this.verbose) {
        console.log("MODIFY RESPONSE:")
        console.log(ModifyResponse)
      }
      if (ModifyResponse.isError == true) {
        let ErrorMessage = ''
        const ErrorPointer = (ModifyResponse as ModifyError).statusMsg
        if (ErrorPointer == 'no emails') {
          ErrorMessage = 'Unauthorized: Check BRK ID or BRK Access'
        } else {
          ErrorMessage = ErrorPointer
        }
        throw new Error(ErrorMessage)
      }
      return ModifyResponse
    } catch (error: AxiosError | any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status == 401) {
          throw new Error(JSON.stringify('Unauthorized: API Key Invalid'))
        }
        throw new Error(JSON.stringify(error))
      } else {
        throw new Error(error)
      }
    }
  }

  // Aliases
  create = this.modify;
  update = this.modify;
  delete = this.modify;
  clone = this.modify;
  get = this.sfid;
  run = this.execute;
}
