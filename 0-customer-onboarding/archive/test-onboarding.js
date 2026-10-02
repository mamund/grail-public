import { reset, read } from "./storage/storage.js";
import { startOnboarding } from "./capabilities/onboarding.js";

await reset();

console.log("Starting first onboarding...");
console.log(await startOnboarding());

console.log("\nStarting second onboarding...");
console.log(await startOnboarding());

console.log("\nStored onboardings:");
console.log(await read("onboardings"));
