import { executeNodeBinding } from "./nodeBinding.js";

const binding = {
  protocol: "node",
  module: "./capabilities/customer.js",
  function: "lookupCustomer"
};

const interaction = await executeNodeBinding(binding, {
  customerId: "customer-123"
});

console.log(JSON.stringify(interaction, null, 2));
