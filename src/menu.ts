import { IoTSiteWiseClient } from "@aws-sdk/client-iotsitewise";
import { createInterface } from "node:readline/promises";
import { generateAlarmStates, AlarmState, getAlarmState } from "./commands/alarms";
import { uploadOccupancyValues } from "./commands/occupancy";
import { IoTSiteWiseDataInjestor } from "./IoTSiteWiseDataInjector";

let injector;

export async function menu() {
  const rl = createInterface(process.stdin, process.stdout);
  let operation: string = "";

  while (operation !== "exit") {
    operation = await rl.question(`
      
      AWS IoT SiteWise Data Injector 💉
      
      Commands:
  
      1      manage alarms
      2      manage occupancy data
      exit   exit
      
      `);

    if (operation === "1") {
      const alarm = await rl.question(`
      
      Select an alarm to update
      
      Commands:
  
      1      Alarm One
      2      Alarm Two
      any    Back
      
      `);

      if (alarm === "1" || alarm === "2") {
        const alarmState = await rl.question(`
      
        Select an alarm state
        
        Commands:
    
        1      Active
        2      Normal
        3      Acknowledged
        4      Latched
        5      Snoozed
        6      Disabled
        0      Back

        `);
        const state = getAlarmState(alarmState)

        if (state) await generateAlarmStates(getInjector(), alarm, state);
      }
    } else if (operation === "2") {

        const runs = await rl.question(`
      
      How many occupancy runs to trigger? 
      Enter a number or -1 to stream; 0 will back out.

    `);


      const numberOfRuns = parseInt(runs)
      if (numberOfRuns !== 0)
          await uploadOccupancyValues(getInjector(), numberOfRuns)
    }
  }

  console.log("Bye!");
}

function getInjector() {
  if (injector) return injector;

  const client = new IoTSiteWiseClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.accessKeyId,
      secretAccessKey: process.env.secretAccessKey,
    },
  });

  injector = new IoTSiteWiseDataInjestor(client);
  return injector;
}
