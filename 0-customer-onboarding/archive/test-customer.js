import { reset, read } from "./storage/storage.js";
import { startOnboarding } from "./capabilities/onboarding.js";
import { createCustomerProfile } from "./capabilities/customer.js";

await reset();

console.log("Starting onboarding...");
const onboarding = await startOnboarding();
console.log(onboarding);

console.log("\nCreating customer profile...");
const customer = await createCustomerProfile({
  onboardingId: onboarding.onboardingId,
  name: "Jordan"
});
console.log(customer);

console.log("\nStored onboardings:");
console.log(await read("onboardings"));

console.log("\nStored customers:");
console.log(await read("customers"));
