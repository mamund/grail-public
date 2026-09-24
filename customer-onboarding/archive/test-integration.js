import { reset, read } from "./storage/storage.js";
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
import {
  startOnboarding,
  onboardCustomer
} from "./capabilities/onboarding.js";

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

const verifiedEmail = await verifyCustomerEmail({
  customerId: customer.customerId,
  emailVerificationId: email.emailVerificationId
});

const phone = await setCustomerPhone({
  customerId: customer.customerId,
  phone: "555-0100"
});

console.log("\nPhone:");
console.log(phone);

const verifiedPhone = await verifyCustomerPhone({
  customerId: customer.customerId,
  phoneVerificationId: phone.phoneVerificationId
});

console.log("\nVerified phone:");
console.log(verifiedPhone);

await setCustomerAddress({
  customerId: customer.customerId,
  address: {
    street: "100 Main Street",
    city: "Cincinnati",
    state: "OH",
    postalCode: "45202"
  }
});

console.log("\nAddress set.");

await acceptTerms({
  customerId: customer.customerId,
  termsVersion: "2026-09"
});

console.log("Terms accepted.");

const account = await onboardCustomer({
  customerId: customer.customerId
});

console.log("\nCustomer onboarded:");
console.log(account);

console.log("\nFinal onboardings:");
console.log(await read("onboardings"));

console.log("\nFinal customers:");
console.log(await read("customers"));

console.log("\nFinal verifications:");
console.log(await read("verifications"));

console.log("\nFinal accounts:");
console.log(await read("accounts"));


console.log("\nStored customer:");
console.log(await read("customers"));

console.log("\nStored customers:");
console.log(await read("customers"));

console.log("\nStored verifications:");
console.log(await read("verifications"));

console.log("\nVerified email:");
console.log(verifiedEmail);

console.log("\nStored customers:");
console.log(await read("customers"));

console.log("\nStored verifications:");
console.log(await read("verifications"));

console.log("Onboarding:");
console.log(onboarding);

console.log("\nCustomer:");
console.log(customer);

console.log("\nEmail:");
console.log(email);

console.log("\nStored customers:");
console.log(await read("customers"));

console.log("\nStored verifications:");
console.log(await read("verifications"));
