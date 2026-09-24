import { read, find, insert, update } from "../storage/storage.js";

function nextVerificationId(records) {
  return `VER-${String(records.length + 1).padStart(3, "0")}`;
}

export async function setCustomerPhone(inputs) {
  const { customerId, phone } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  await update("customers", customerId, {
    phone,
    phoneVerified: false
  });

  const verifications = await read("verifications");

  const verification = {
    id: nextVerificationId(verifications),
    customerId,
    type: "phone",
    value: phone,
    verified: false
  };

  await insert("verifications", verification);

  return {
    phoneVerificationId: verification.id
  };
}

export async function verifyCustomerPhone(inputs) {
  const { customerId, phoneVerificationId } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const verification = await find(
    "verifications",
    phoneVerificationId
  );

  if (!verification) {
    throw new Error(
      `Verification not found: ${phoneVerificationId}`
    );
  }

  if (verification.customerId !== customerId) {
    throw new Error(
      `Verification ${phoneVerificationId} does not belong to ${customerId}`
    );
  }

  if (verification.type !== "phone") {
    throw new Error(
      `Verification ${phoneVerificationId} is not a phone verification`
    );
  }

  await update("verifications", phoneVerificationId, {
    verified: true
  });

  await update("customers", customerId, {
    phoneVerified: true
  });

  return {
    verifiedPhone: verification.value
  };
}
