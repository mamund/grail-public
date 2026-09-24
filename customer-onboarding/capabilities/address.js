import { find, update } from "../storage/storage.js";

export async function setCustomerAddress(inputs) {
  const { customerId, address } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  await update("customers", customerId, {
    address
  });

  return {};
}
