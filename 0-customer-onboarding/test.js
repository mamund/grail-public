import { reset, read } from "./storage/storage.js";
import {
  startOnboarding,
  onboardCustomer
} from "./capabilities/onboarding.js";
import { createCustomerProfile } from "./capabilities/customer.js";
import {
  setCustomerEmail,
  verifyCustomerEmail
} from "./capabilities/email.js";
import {
  setCustomerPhone,
  verifyCustomerPhone
} from "./capabilities/phone.js";
import { setCustomerAddress } from "./capabilities/address.js";
import { acceptTerms } from "./capabilities/terms.js";

await reset();

const onboarding = await startOnboarding();

const customer = await createCustomerProfile({
  onboardingId: onboarding.onboardingId,
  name: "Jordan"
});

const email = await setCustomerEmail({
  customerId: customer.customerId,
  email: "jordan@example.com"
});

await verifyCustomerEmail({
  customerId: customer.customerId,
  emailVerificationId: email.emailVerificationId
});

const phone = await setCustomerPhone({
  customerId: customer.customerId,
  phone: "555-0100"
});

await verifyCustomerPhone({
  customerId: customer.customerId,
  phoneVerificationId: phone.phoneVerificationId
});

await setCustomerAddress({
  customerId: customer.customerId,
  address: {
    street: "100 Main Street",
    city: "Cincinnati",
    state: "OH",
    postalCode: "45202"
  }
});

await acceptTerms({
  customerId: customer.customerId,
  termsVersion: "2026-09"
});

const account = await onboardCustomer({
  customerId: customer.customerId
});

console.log("Onboarding complete.");
console.log({
  onboardingId: onboarding.onboardingId,
  customerId: customer.customerId,
  accountId: account.accountId
});

console.log("\nFinal application state:");
console.log("Onboardings:", await read("onboardings"));
console.log("Customers:", await read("customers"));
console.log("Verifications:", await read("verifications"));
console.log("Accounts:", await read("accounts"));
