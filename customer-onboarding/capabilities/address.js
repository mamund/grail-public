import { find, update } from "../storage/storage.js";

export async function setCustomerAddress(inputs) {
  const {
    customerId,
    street,
    city,
    state,
    postalCode
  } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const address = {
    street,
    city,
    state,
    postalCode
  };

  await update("customers", customerId, {
    address
  });

  return {};
}
