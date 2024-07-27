![img](https://img.shields.io/npm/v/brx-node)

![img](https://img.shields.io/npm/dt/brx-node)

`brx-node` is the official interaction module for BRX.ai. It is used for interacting with BRX and includes functionalities such as sending requests and receiving responses.

We’re currently in BETA. Expect package changes and improvements in the future!

## Install

```shell shell
// For npm:
npm install brx-node -s

// For yarn:
yarn install brx-node -s

// For pnpm:
pnpm install brx-node -D
```

## Usage

Here is how you can interact with the BRX AI API using this module:

```typescript
import BRX, { BRK } from 'brx-node';

const brx = new BRX('you-api-key');

// Fetch the BRK Schema with an BRK ID
const EstimatePriceSchema = await brx.get('d5683979-772d-464e-9dda-94ca854d6194')

// Initialize the BRK using the schema
const EstimatePrice = new BRK(EstimatePriceSchema)

// Add inputs
EstimatePrice.input['Estimation Product'] = 'F695 Ball Bearing (20-pack)'

const result = await brx.run(EstimatePrice);
console.log(result)
```

## BRX Client Class

The BRX Client is used for fetching the BRK Object on runtime, and BRK Execution.

### BRX.constructor(accessToken: string): BRX

Creates an instance of the BRX Client.

Parameters:

- `accessToken` (`string`): The access token to interact with the BRX AI API.

Example:

```typescript
const brxClient = new BRX("your_access_token");
```

### BRX.get(BRK_ID: string)

```typescript
BRX.get(BRK_ID: string): Promise<GetSchemaObject>
```

Fetches a BRK schema and returns a promise for the response.

Note: this function only fetches the object needed for BRK constructor. You still have to initialize the BRK Class for execution.

Parameters:

- query: (`BRK`): The BRK

Example:

```typescript
const EstimatePriceSchema = await brxClient.get('d5683979-772d-464e-9dda-94ca854d6194');
```

### BRX.run(query: BRK)

```typescript
BRX.run(query: BRK, callback?: ((message: RunResult) => void) | undefined): Promise<RunResult[]>
```

Executes a BRK and returns a promise for the response.

Note: this function contains an optional callback function which fires events when a Dependency BRK is resolved. You can either await the full response, or optionally use callbacks.

Parameters:

- query: (`BRK`): The BRK

Example:

```typescript
const result = await brxClient.run(EstimatePrice);
```

Example with callbacks:

```typescript
let resultArray = []
await BRXClient.run(EstimatePrice, (e) => {
    resultArray.push(e)
    console.log(e)
});

console.log(resultArray)
```

## BRK Class

A BRK is a prompt with an ability to include variables, and other BRKs as dependencies with recursion.

### BRK.constructor(BRKSchema: GetSchemaObject): BRK

Creates an instance of the BRK.

Parameters:

- `BRKSchema` (`GetSchemaObject`): The schema for the BRK. you can fetch this schema using BRX.get(’BRK-ID’)

Example:

```typescript
const EstimatePrice = new BRK(EstimatePriceSchema)
```

### Input Fields

A BRK may contain variable(s). These variables are surfaced from each BRK in the pipeline (BRK Dependencies).

Example:

```typescript
// Estimate Price is the BRK, Estimation Product is the variable within it.
EstimatePrice.input['Estimation Product'] = 'F695 Ball Bearing (20-pack)'
```

Example with multiple variables

```typescript
// Proof Validator is the BRK, Theorem is the variable within it.
ProofValidator.input['Theorem'] = 'If a and b are even integers, then a + b is also an even integer.'

// Proof Validator uses Proof Extractor BRK as a dependency
// Proof Extractor contains a Proof variable.
ProofValidator.input['Proof'] = 'Since a and b are even, a = 2m and b = 2n for some integers m and n; thus, ( a + b = 2m + 2n = 2(m + n) ), which is even.'
```