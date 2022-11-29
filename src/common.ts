import { v4 } from "uuid";
export async function wait(timeToWaitMS: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeToWaitMS);
    });
  }
  

  export function generateUUID(){
    return v4()
  }