// customer-onboarding-http.js
//
// HTTP adapter for the customer-onboarding capabilities.
//
// The HTTP interface preserves the routes used by the GRAIL HTTP-binding
// experiment while delegating application behavior to the same capability
// modules used by GRAIL's Node bindings. Both interfaces therefore operate
// against the same file-backed application state.

import http from "node:http";

import {
  startOnboarding,
  onboardCustomer
} from "./capabilities/onboarding.js";
import {
  createCustomerProfile,
  setCustomerDetails
} from "./capabilities/customer.js";
import {
  setCustomerEmail,
  verifyCustomerEmail
} from "./capabilities/email.js";
import {
  setCustomerPhone,
  verifyCustomerPhone
} from "./capabilities/phone.js";
import { setCustomerAddress } from "./capabilities/address.js";
import { acceptTerms } from "./capabilities/terms.js";

const PORT = process.env.PORT || 3001;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON request body"));
      }
    });

    req.on("error", reject);
  });
}

function customerIdFromPath(pathname, pattern) {
  const match = pathname.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

function requireFields(body, fields, message) {
  const missing = fields.filter(field => !body[field]);

  if (missing.length > 0) {
    const error = new Error(message);
    error.statusCode = 400;
    error.status = "INVALID_REQUEST";
    throw error;
  }
}

function httpError(error) {
  const message = error.message || "Request failed";

  if (error.statusCode) {
    return {
      statusCode: error.statusCode,
      payload: {
        status: error.status || "BAD_REQUEST",
        message
      }
    };
  }

  if (message.startsWith("Customer not found:")) {
    return {
      statusCode: 404,
      payload: { status: "CUSTOMER_NOT_FOUND", message }
    };
  }

  if (message.startsWith("Onboarding not found:")) {
    return {
      statusCode: 400,
      payload: { status: "INVALID_ONBOARDING", message }
    };
  }

  if (
    message.includes("has not been set") ||
    message.includes("has not been verified") ||
    message.includes("has not been accepted")
  ) {
    return {
      statusCode: 409,
      payload: { status: "ONBOARDING_INCOMPLETE", message }
    };
  }

  if (
    message.startsWith("Verification not found:") ||
    message.startsWith("Verification ")
  ) {
    return {
      statusCode: 400,
      payload: { status: "INVALID_VERIFICATION", message }
    };
  }

  return {
    statusCode: 400,
    payload: { status: "BAD_REQUEST", message }
  };
}

function logRequest(req) {
  console.log(`[CUSTOMER-ONBOARDING] Received: ${req.method} ${req.url}`);
}

function logResponse(status, detail = "") {
  console.log(
    `[CUSTOMER-ONBOARDING] Responded: ${status}${detail ? ` ${detail}` : ""}`
  );
}

const server = http.createServer(async (req, res) => {
  logRequest(req);

  const url = new URL(
    req.url,
    `http://${req.headers.host || `localhost:${PORT}`}`
  );
  const { pathname } = url;

  try {
    // startOnboarding: POST /onboarding
    if (req.method === "POST" && pathname === "/onboarding") {
      const result = await startOnboarding();
      sendJson(res, 200, result);
      logResponse("200 OK", `onboardingId=${result.onboardingId}`);
      return;
    }

    // createCustomerProfile: POST /customers
    if (req.method === "POST" && pathname === "/customers") {
      const body = await readJson(req);
      requireFields(body, ["onboardingId", "name"], "onboardingId and name are required");

      const result = await createCustomerProfile(body);
      sendJson(res, 200, result);
      logResponse("200 OK", `customerId=${result.customerId}`);
      return;
    }

    // setCustomerDetails: PUT /customers/{customerId}/details
    if (req.method === "PUT" && /^\/customers\/[^/]+\/details$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/details$/);
      const body = await readJson(req);
      requireFields(
        body,
        ["email", "phone", "street", "city", "state", "postalCode"],
        "email, phone, street, city, state, and postalCode are required"
      );

      const result = await setCustomerDetails({ customerId, ...body });
      sendJson(res, 200, result);
      logResponse(
        "200 OK",
        `customerId=${customerId} emailVerificationId=${result.emailVerificationId} phoneVerificationId=${result.phoneVerificationId}`
      );
      return;
    }

    // setCustomerEmail: PUT /customers/{customerId}/email
    if (req.method === "PUT" && /^\/customers\/[^/]+\/email$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/email$/);
      const body = await readJson(req);
      requireFields(body, ["email"], "email is required");

      const result = await setCustomerEmail({ customerId, email: body.email });
      sendJson(res, 200, result);
      logResponse("200 OK", `customerId=${customerId} emailVerificationId=${result.emailVerificationId}`);
      return;
    }

    // setCustomerPhone: PUT /customers/{customerId}/phone
    if (req.method === "PUT" && /^\/customers\/[^/]+\/phone$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/phone$/);
      const body = await readJson(req);
      requireFields(body, ["phone"], "phone is required");

      const result = await setCustomerPhone({ customerId, phone: body.phone });
      sendJson(res, 200, result);
      logResponse("200 OK", `customerId=${customerId} phoneVerificationId=${result.phoneVerificationId}`);
      return;
    }

    // setCustomerAddress: PUT /customers/{customerId}/address
    if (req.method === "PUT" && /^\/customers\/[^/]+\/address$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/address$/);
      const body = await readJson(req);
      requireFields(body, ["street", "city", "state", "postalCode"], "street, city, state, and postalCode are required");

      await setCustomerAddress({ customerId, ...body });
      sendJson(res, 200, { status: "SUCCESS" });
      logResponse("200 OK", `customerId=${customerId}`);
      return;
    }

    // verifyCustomerEmail: POST /customers/{customerId}/email/verification
    if (req.method === "POST" && /^\/customers\/[^/]+\/email\/verification$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/email\/verification$/);
      const body = await readJson(req);
      requireFields(body, ["emailVerificationId"], "emailVerificationId is required");

      const result = await verifyCustomerEmail({ customerId, emailVerificationId: body.emailVerificationId });
      sendJson(res, 200, result);
      logResponse("200 OK", `customerId=${customerId} verifiedEmail=${result.verifiedEmail}`);
      return;
    }

    // verifyCustomerPhone: POST /customers/{customerId}/phone/verification
    if (req.method === "POST" && /^\/customers\/[^/]+\/phone\/verification$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/phone\/verification$/);
      const body = await readJson(req);
      requireFields(body, ["phoneVerificationId"], "phoneVerificationId is required");

      const result = await verifyCustomerPhone({ customerId, phoneVerificationId: body.phoneVerificationId });
      sendJson(res, 200, result);
      logResponse("200 OK", `customerId=${customerId} verifiedPhone=${result.verifiedPhone}`);
      return;
    }

    // acceptTerms: POST /customers/{customerId}/terms
    if (req.method === "POST" && /^\/customers\/[^/]+\/terms$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/terms$/);
      const body = await readJson(req);
      requireFields(body, ["termsVersion"], "termsVersion is required");

      await acceptTerms({ customerId, termsVersion: body.termsVersion });
      sendJson(res, 200, { status: "SUCCESS" });
      logResponse("200 OK", `customerId=${customerId} termsVersion=${body.termsVersion}`);
      return;
    }

    // onboardCustomer: POST /customers/{customerId}/onboarding
    if (req.method === "POST" && /^\/customers\/[^/]+\/onboarding$/.test(pathname)) {
      const customerId = customerIdFromPath(pathname, /^\/customers\/([^/]+)\/onboarding$/);
      const result = await onboardCustomer({ customerId });
      sendJson(res, 200, result);
      logResponse("200 OK", `customerId=${customerId} accountId=${result.accountId}`);
      return;
    }

    sendJson(res, 404, { status: "NOT_FOUND" });
    logResponse("404 Not Found");
  } catch (error) {
    console.error(`[CUSTOMER-ONBOARDING] Error: ${error.message}`);

    const translated = httpError(error);
    sendJson(res, translated.statusCode, translated.payload);
    logResponse(`${translated.statusCode} Error`, error.message);
  }
});

server.listen(PORT, () => {
  console.log(`[CUSTOMER-ONBOARDING] Listening on http://localhost:${PORT}`);
});
