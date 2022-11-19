// a client can be shared by different commands.
import "node:crypto";
import {
  IoTSiteWiseClient,
  PutAssetPropertyValueEntry,
} from "@aws-sdk/client-iotsitewise";
import { config } from "dotenv";
import { IoTSiteWiseDataInjestor } from "./IoTSiteWiseDataInjector";
import data from "./data.json";
import { writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { v4 } from "uuid";

config();

let results: { assetName: string; assetId: string; modelId: string, elementId: string }[] = [];

// what we should be doing is starting with a base line time
// and then just incrementing off that
// create a fake clock or something you can control..

function generateBatchValues() {
  const batch: PutAssetPropertyValueEntry[] = [];

  results.forEach((result) => {
    // let runningTotalOfPeople = 0;
    batch.push(
      {
        entryId: v4(),
        assetId: result.assetId,
        propertyId: "d25b090f-1aa8-4baa-b99e-8ae46d0fdd60", // num of people
        propertyValues: [
          {
            timestamp: { timeInSeconds: Date.now() / 1000 },
            value: { integerValue: Math.floor(Math.random() * 120)  },
          },
        ],
      },
      {
        entryId: v4(),
        assetId: result.assetId,
        propertyId: "b3e036cc-fbf2-46e2-9c4e-830afe293bcd", // elementId
        propertyValues: [
          {
            timestamp: { timeInSeconds: Date.now() / 1000 },
            value: { stringValue: result.elementId  },
          },
        ],
      },
      // {
      //   entryId: v4(),
      //   assetId: result.assetId,
      //   propertyId: "9273d1e4-02e2-4879-b819-1ed7a15a7225", // PSI
      //   propertyValues: [
      //     {
      //       timestamp: { timeInSeconds: Date.now() / 1000 },
      //       value: { doubleValue: Math.random() * 2500 + 2000 },
      //     },
      //   ],
      // },
      // {
      //   entryId: v4(),
      //   assetId: result.assetId,
      //   propertyId: "66d7d6f5-7008-41ab-a831-6b3709a74047", // temperature C
      //   propertyValues: [
      //     {
      //       timestamp: { timeInSeconds: Date.now() / 1000 },
      //       value: { doubleValue: Math.random() * 55 },
      //     },
      //   ],
      // }
    );
  });

  return batch;
}

async function run() {
  let createAssets = false
  let retryProperties = false
  const numberOfPropertyValueRuns = 20;
  const batchCoolDownMs = 1000; 

  const client = new IoTSiteWiseClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.accessKeyId,
      secretAccessKey: process.env.secretAccessKey,
    },
  });

  const injestor = new IoTSiteWiseDataInjestor(client);
  const modelId = "6670db54-8462-49c9-b51b-8c58c0c69fa0"; // Area https://us-east-1.console.aws.amazon.com/iotsitewise/home?region=us-east-1#/models/6670db54-8462-49c9-b51b-8c58c0c69fa0

  if (createAssets) {
    for (const { name, elementId } of data) {
      const res = await injestor.createAsset(modelId, { assetName: name });
      // store results to later add property values in batch
      results.push({
        assetName: name,
        assetId: res.assetId,
        modelId,
        elementId 
      });
    }
    
    await writeFile(
      resolve(__dirname, "out.json"),
      JSON.stringify(results, null, 4),
      "utf8"
    );

  } else {
    const resultsS = await readFile(resolve(__dirname, "out.json"), "utf8");
    results = JSON.parse(resultsS);
  }

  let batch: PutAssetPropertyValueEntry[] = []

  if (!retryProperties){
    
    for(let i = 0; i < numberOfPropertyValueRuns; ++i){
      if (i > 0) await wait(batchCoolDownMs) // this is unnecssary beacuse we're writing fake data... 
      batch.push(...generateBatchValues())
    }
    
    await writeFile(
      resolve(__dirname, "out-batch.json"),
      JSON.stringify(batch, null, 4),
      "utf8"
    );
  } else {
    const batchSt = await readFile(resolve(__dirname, "out-batch.json"), "utf8")
    batch = JSON.parse(batchSt)
  }
  
  const responses = await injestor.batchPutAssetPropertyValues(batch);

  for (let res of responses){
    if (res.errorEntries.length) {
      console.error(res.errorEntries);
      await writeFile(resolve(__dirname, `errors_${Math.floor(Date.now()/10000)}.json`), JSON.stringify(res, null, 4), "utf8")
      console.log("ERRORS OCCURRED - Please check errors_*.log")
    }
    console.log(res);
  }

}

run()
  .then(() => {
    console.log("Finished Processsing");
  })
  .catch((e) => {
    console.error(e);
  });


  async function wait(timeToWaitMS: number){
    return new Promise<void>(resolve => {
      setTimeout(() => {
        resolve()
      }, timeToWaitMS)
    })
  }