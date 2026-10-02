import { find, update } from "../storage/storage.js";

export async function acceptTerms(inputs) {
  const { customerId, termsVersion } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  await update("customers", customerId, {
    termsVersion,
    termsAccepted: true
  });

  return {};
}
