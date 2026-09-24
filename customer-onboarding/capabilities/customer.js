import { read, find, insert, update } from "../storage/storage.js";

function nextId(records) {
  return `CUS-${String(records.length + 1).padStart(3, "0")}`;
}

export async function createCustomerProfile(inputs) {
  const { onboardingId, name } = inputs;

  const onboarding = await find("onboardings", onboardingId);

  if (!onboarding) {
    throw new Error(`Onboarding not found: ${onboardingId}`);
  }

  const customers = await read("customers");

  const customer = {
    id: nextId(customers),
    onboardingId,
    name,
    email: null,
    emailVerified: false,
    phone: null,
    phoneVerified: false,
    address: null,
    termsVersion: null,
    termsAccepted: false
  };

  await insert("customers", customer);

  await update("onboardings", onboardingId, {
    customerId: customer.id
  });

  return {
    customerId: customer.id
  };
}
