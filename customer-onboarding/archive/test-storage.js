import {
  read,
  find,
  insert,
  update,
  reset
} from "./storage/storage.js";

console.log("Resetting storage...");
await reset();

console.log("\nAfter reset:");
console.log(await read("onboardings"));

console.log("\nInserting onboarding...");
await insert("onboardings", {
  id: "ONB-001",
  status: "started"
});

console.log("\nAfter insert:");
console.log(await read("onboardings"));

console.log("\nFinding ONB-001:");
console.log(await find("onboardings", "ONB-001"));

console.log("\nUpdating ONB-001...");
await update("onboardings", "ONB-001", {
  status: "completed"
});

console.log("\nAfter update:");
console.log(await find("onboardings", "ONB-001"));

console.log("\nResetting again...");
await reset();

console.log("\nFinal state:");
console.log(await read("onboardings"));
