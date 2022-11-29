import {
  BatchPutAssetPropertyValueCommand,
  BatchPutAssetPropertyValueCommandInput,
  CreateAssetCommand,
  CreateAssetCommandInput,
  IoTSiteWiseClient,
  ListAssetModelsCommand,
  PutAssetPropertyValueEntry,
} from "@aws-sdk/client-iotsitewise";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { wait } from "./common";

interface CreateAssetsOptions {
  assetName?: string;
}

export class IoTSiteWiseDataInjestor {
  constructor(private client: IoTSiteWiseClient) {}

  public async createAsset(modelId: string, options: CreateAssetsOptions) {
    const input: CreateAssetCommandInput = {
      assetName:
        options.assetName ?? `asset-${Math.floor(Math.random() * 10 ** 5)}`,
      assetModelId: modelId,
    };

    return this.client.send(new CreateAssetCommand(input));
  }

  public async batchPutAssetPropertyValues(
    entries: PutAssetPropertyValueEntry[]
  ) {
    const responses = []
    // API only allows 10 asset property value puts per-call.

    console.log(`uploading Entries length: ${entries.length}`)
    while (entries.length) {
      const thisBatch = entries.splice(0, 10);
   
      const input: BatchPutAssetPropertyValueCommandInput = {
        entries: thisBatch,
      };
      const cmd = new BatchPutAssetPropertyValueCommand(input);
      const res = await this.client.send(cmd)
      responses.push(res);
    }
    return responses
  }

  public async listModels() {
    return this.client.send(new ListAssetModelsCommand({}));
  }

  async putAssetPropertiesWorkflow(values) {
    const responses = await this.batchPutAssetPropertyValues(values);
    for (let res of responses) {
      if (res.errorEntries.length) {
        console.error(res.errorEntries);
        const errorStamp = Math.floor(Date.now() / 10000);
        await writeFile(
          resolve(__dirname, `errors_${errorStamp}.json`),
          JSON.stringify(res, null, 4),
          "utf8"
        );
        console.log(`Errors - Please check errors_${errorStamp}.log`);
      }
      console.log(res);
    }
    await wait(1000); // seems like anything less than a second overwrites previous entries...
  }
}

