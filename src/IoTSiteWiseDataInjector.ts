import {
  BatchPutAssetPropertyValueCommand,
  BatchPutAssetPropertyValueCommandInput,
  CreateAssetCommand,
  CreateAssetCommandInput,
  IoTSiteWiseClient,
  ListAssetModelsCommand,
  PutAssetPropertyValueEntry,
} from "@aws-sdk/client-iotsitewise";

interface CreateAssetsOptions {
  assetName?: string;
}

export class IoTSiteWiseDataInjestor {
  /**
   *
   */
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
    let numberOfCalls = 1
    console.log(`Entries length: ${entries.length}`)
    while (entries.length) {
      const thisBatch = entries.splice(0, 10);
      console.log(`Entries length after splice: ${entries.length}`)
      const input: BatchPutAssetPropertyValueCommandInput = {
        entries: thisBatch,
      };
      console.log(`Putting property values batch ${numberOfCalls++}`)
      const cmd = new BatchPutAssetPropertyValueCommand(input);
      const res = await this.client.send(cmd)
      responses.push(res);
    }
    return responses
  }

  public async listModels() {
    return this.client.send(new ListAssetModelsCommand({}));
  }
}
