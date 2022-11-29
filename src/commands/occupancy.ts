import { generateUUID } from "../common";
import { IoTSiteWiseDataInjestor } from "../IoTSiteWiseDataInjector";
type results = {
  assetName: string;
  assetId: string;
  modelId: string;
};

const occupancyData: results[] = [
  {
    assetName: "Traveler Space",
    assetId: "edb19e34-2e90-4098-8e82-65e17163e5ef",
    modelId: "6670db54-8462-49c9-b51b-8c58c0c69fa0",
  },
  {
    assetName: "Platform",
    assetId: "3d041d63-812a-459b-ade7-2004ef3e26cc",
    modelId: "6670db54-8462-49c9-b51b-8c58c0c69fa0",
  },
  {
    assetName: "Street Level",
    assetId: "68763c50-052e-4993-ba35-5108b223f185",
    modelId: "6670db54-8462-49c9-b51b-8c58c0c69fa0",
  },
];

export async function uploadOccupancyValues(
  injestor: IoTSiteWiseDataInjestor,
  numberOfRuns: number
) {
  let runs = numberOfRuns === -1 ? -2 : 0;

  while (runs < numberOfRuns) {
    const values = occupancyData.map((result) => ({
      entryId: generateUUID(),
      assetId: result.assetId,
      propertyId: "d25b090f-1aa8-4baa-b99e-8ae46d0fdd60", // num of people
      propertyValues: [
        {
          timestamp: { timeInSeconds: Date.now() / 1000 },
          value: { integerValue: Math.floor(Math.random() * 200) },
        },
      ],
    }));

    await injestor.putAssetPropertiesWorkflow(values);
    if (numberOfRuns !== -1) runs++;
  }
}
