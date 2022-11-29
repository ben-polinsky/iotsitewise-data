// a client can be shared by different commands.
import "node:crypto";
import { config } from "dotenv";
import { menu } from "./menu";


config();

async function run() {
  await menu();
}

run()
  .then(() => {
    console.log("Finished Processsing");
    process.exit();
  })
  .catch((e) => {
    console.error(e);
  });




// async function createAsset(injestor, modelId) {
//   for (const { name, elementId } of data) {
//     const res = await injestor.createAsset(modelId, { assetName: name });
//     // store results to later add property values in batch
//     results.push({
//       assetName: name,
//       assetId: res.assetId,
//       modelId,
//       elementId,
//     });
//   }

//   await writeFile(
//     resolve(__dirname, "out.json"),
//     JSON.stringify(results, null, 4),
//     "utf8"
//   );
// }