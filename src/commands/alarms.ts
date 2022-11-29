import { PutAssetPropertyValueEntry } from "@aws-sdk/client-iotsitewise";
import { generateUUID } from "../common";
import { IoTSiteWiseDataInjestor } from "../IoTSiteWiseDataInjector";

// https://docs.aws.amazon.com/iot-sitewise/latest/userguide/industrial-alarms.html#alarm-states
export type AlarmState =
  | "Active"
  | "Normal"
  | "Acknowledged"
  | "Latched"
  | "SnoozeDisabled"
  | "Disabled";

const alarmData = [
  {
    assetName: "Carbon Monoxide Alarm 01", // name in aws
    elementId: "0x40000000453", // id in iModel
    elementIdPropertyId: "cd1e0c67-d527-4aad-8177-a77f999865fa",
    assetId: "b3e70495-65e7-4b0b-9e48-4a9a13f3edea",
    alarmPropertyId: "442bb1ba-6633-49c6-b916-44954db7b634",
    modelId: "a846949f-b766-4d13-949b-e06c004377a6", // A unique model is required to use different alarms for each asset
  },
  {
    assetName: "Carbon Monoxide Alarm 02",
    elementId: "0x1e000000040c",
    elementIdPropertyId: "6d9fa293-52dc-4274-9b45-fe7b66711c58",
    assetId: "2eee660c-ad18-4aed-b652-dbc1521acff6",
    alarmPropertyId: "491874a3-24b6-4a3d-acf0-a4762003a217",
    modelId: "707b8414-5ca7-49e7-a6f0-330af847cae6",
  },
];

export async function generateAlarmStates(
  injestor: IoTSiteWiseDataInjestor,
  alarm?: "1" | "2",
  state?: AlarmState
) {
  const values = [];
  let data = [...alarmData];

  if (alarm) {
    const index = parseInt(alarm) - 1;
    data = [alarmData[index]];
  }

  for (const alarm of data) {
    values.push(
      await generateAlarmStateUpdate(
        alarm.assetId,
        alarm.alarmPropertyId,
        state ?? "Active",
        alarm.elementIdPropertyId,
        alarm.elementId
      )
    );
  }

  const flatValues = values.flat();
  await injestor.putAssetPropertiesWorkflow(flatValues);
}

function generateAlarmStateUpdate(
  assetId: string,
  alarmPropertyId: string,
  alarmState: AlarmState,
  elementIdPropertyId: string,
  elementId: string
): PutAssetPropertyValueEntry[] {
  const timeInSeconds = Date.now() / 1000;

  return [
    {
      entryId: generateUUID(),
      assetId: assetId,
      propertyId: alarmPropertyId, // "442bb1ba-6633-49c6-b916-44954db7b634",
      propertyValues: [
        {
          timestamp: { timeInSeconds },
          value: { stringValue: `{\"stateName\":\"${alarmState}\"}` },
        },
      ],
    },
    {
      entryId: generateUUID(),
      assetId,
      propertyId: elementIdPropertyId, // "cd1e0c67-d527-4aad-8177-a77f999865fa", // elementId
      propertyValues: [
        {
          timestamp: { timeInSeconds },
          value: { stringValue: elementId },
        },
      ],
    },
  ];
}

export function getAlarmState(choice: string): AlarmState | null {
  switch (choice) {
    case "1":
      return "Active";

    case "2":
      return "Normal";

    case "3":
      return "Acknowledged";

    case "4":
      return "Latched";

    case "5":
      return "SnoozeDisabled";

    case "6":
      return "Disabled";

    default:
      return null;
  }
}
