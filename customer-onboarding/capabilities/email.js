import { read, find, insert, update } from "../storage/storage.js";

function nextVerificationId(records) {
  return `VER-${String(records.length + 1).padStart(3, "0")}`;
}

export async function setCustomerEmail(inputs) {
  const { customerId, email } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  await update("customers", customerId, {
    email,
    emailVerified: false
  });

  const verifications = await read("verifications");

  const verification = {
    id: nextVerificationId(verifications),
    customerId,
    type: "email",
    value: email,
    verified: false
  };

  await insert("verifications", verification);

  return {
    emailVerificationId: verification.id
  };
}

export async function verifyCustomerEmail(inputs) {
  const { customerId, emailVerificationId } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const verification = await find(
    "verifications",
    emailVerificationId
  );

  if (!verification) {
    throw new Error(
      `Verification not found: ${emailVerificationId}`
    );
  }

  if (verification.customerId !== customerId) {
    throw new Error(
      `Verification ${emailVerificationId} does not belong to ${customerId}`
    );
  }

  if (verification.type !== "email") {
    throw new Error(
      `Verification ${emailVerificationId} is not an email verification`
    );
  }

  await update("verifications", emailVerificationId, {
    verified: true
  });

  await update("customers", customerId, {
    emailVerified: true
  });

  return {
    verifiedEmail: verification.value
  };
}
