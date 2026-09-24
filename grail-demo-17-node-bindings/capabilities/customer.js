// capabilities/customer.js

export async function lookupCustomer(inputs) {
  return {
    id: inputs.customerId,
    name: "Jordan",
    account: {
      id: "A97"
    }
  };
}
