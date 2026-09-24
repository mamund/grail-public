import { read, find, insert, update } from "../storage/storage.js";

function nextId(records) {
  return `ONB-${String(records.length + 1).padStart(3, "0")}`;
}

export async function startOnboarding() {
  const onboardings = await read("onboardings");

  const onboarding = {
    id: nextId(onboardings),
    status: "started"
  };

  await insert("onboardings", onboarding);

  return {
    onboardingId: onboarding.id
  };
}

function nextAccountId(records) {
  return `ACC-${String(records.length + 1).padStart(3, "0")}`;
}

export async function onboardCustomer(inputs) {
  const { customerId } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  if (!customer.email) {
    throw new Error(`Customer email has not been set: ${customerId}`);
  }

  if (!customer.emailVerified) {
    throw new Error(`Customer email has not been verified: ${customerId}`);
  }

  if (!customer.phone) {
    throw new Error(`Customer phone has not been set: ${customerId}`);
  }

  if (!customer.phoneVerified) {
    throw new Error(`Customer phone has not been verified: ${customerId}`);
  }

  if (!customer.address) {
    throw new Error(`Customer address has not been set: ${customerId}`);
  }

  if (!customer.termsAccepted) {
    throw new Error(`Customer terms have not been accepted: ${customerId}`);
  }

  const onboarding = await find(
    "onboardings",
    customer.onboardingId
  );

  if (!onboarding) {
    throw new Error(
      `Onboarding not found: ${customer.onboardingId}`
    );
  }

  const accounts = await read("accounts");

  const account = {
    id: nextAccountId(accounts),
    customerId,
    status: "active"
  };

  await insert("accounts", account);

  await update("onboardings", onboarding.id, {
    status: "completed",
    accountId: account.id
  });

  return {
    accountId: account.id
  };
}
