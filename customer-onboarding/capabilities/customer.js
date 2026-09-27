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

function nextVerificationId(records) {
  return `VER-${String(records.length + 1).padStart(3, "0")}`;
}

export async function setCustomerDetails(inputs) {
  const {
    customerId,
    email,
    phone,
    street,
    city,
    state,
    postalCode
  } = inputs;

  const customer = await find("customers", customerId);

  if (!customer) {
    throw new Error(`Customer not found: ${customerId}`);
  }

  const emailChanged = customer.email !== email;
  const phoneChanged = customer.phone !== phone;

  const address = {
    street,
    city,
    state,
    postalCode
  };

  await update("customers", customerId, {
    email,
    emailVerified: emailChanged ? false : customer.emailVerified,
    phone,
    phoneVerified: phoneChanged ? false : customer.phoneVerified,
    address
  });

  const verifications = await read("verifications");

  let emailVerification;
  let phoneVerification;

  if (emailChanged) {
    emailVerification = {
      id: nextVerificationId(verifications),
      customerId,
      type: "email",
      value: email,
      verified: false
    };

    await insert("verifications", emailVerification);
    verifications.push(emailVerification);
  } else {
    emailVerification = [...verifications]
      .reverse()
      .find(
        verification =>
          verification.customerId === customerId &&
          verification.type === "email" &&
          verification.value === email
      );
  }

  if (phoneChanged) {
    phoneVerification = {
      id: nextVerificationId(verifications),
      customerId,
      type: "phone",
      value: phone,
      verified: false
    };

    await insert("verifications", phoneVerification);
    verifications.push(phoneVerification);
  } else {
    phoneVerification = [...verifications]
      .reverse()
      .find(
        verification =>
          verification.customerId === customerId &&
          verification.type === "phone" &&
          verification.value === phone
      );
  }

  return {
    emailVerificationId: emailVerification?.id,
    phoneVerificationId: phoneVerification?.id
  };
}

