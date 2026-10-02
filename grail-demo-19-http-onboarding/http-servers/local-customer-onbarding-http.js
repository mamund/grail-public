// customer-onboarding-http.js
//
// Stateful HTTP capability stub for the GRAIL customer-onboarding scenario.
// Matches the HTTP bindings declared in registry-http-onboarding.json.

import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = process.env.PORT || 3001;

const onboardings = new Map();
const customers = new Map();
const emailVerifications = new Map();
const phoneVerifications = new Map();
const accounts = new Map();

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

function makeId(prefix) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function customerFromPath(pathname, pattern) {
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  const customerId = decodeURIComponent(match[1]);

  return {
    customerId,
    customer: customers.get(customerId)
  };
}

function createEmailVerification(customerId, email) {
  const id = makeId("EMV");

  emailVerifications.set(id, {
    id,
    customerId,
    email,
    verified: false
  });

  return id;
}

function createPhoneVerification(customerId, phone) {
  const id = makeId("PHV");

  phoneVerifications.set(id, {
    id,
    customerId,
    phone,
    verified: false
  });

  return id;
}

function logRequest(req) {
  console.log(
    `[CUSTOMER-ONBOARDING] Received: ${req.method} ${req.url}`
  );
}

function logResponse(status, detail = "") {
  console.log(
    `[CUSTOMER-ONBOARDING] Responded: ${status}${
      detail ? ` ${detail}` : ""
    }`
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
    // ------------------------------------------------------------
    // startOnboarding
    //
    // POST /onboarding
    // ------------------------------------------------------------

    if (
      req.method === "POST" &&
      pathname === "/onboarding"
    ) {
      const onboardingId = makeId("ONB");

      onboardings.set(onboardingId, {
        id: onboardingId,
        started: true
      });

      sendJson(res, 200, {
        onboardingId
      });

      logResponse(
        "200 OK",
        `onboardingId=${onboardingId}`
      );

      return;
    }

    // ------------------------------------------------------------
    // createCustomerProfile
    //
    // POST /customers
    //
    // {
    //   "onboardingId": "...",
    //   "name": "..."
    // }
    // ------------------------------------------------------------

    if (
      req.method === "POST" &&
      pathname === "/customers"
    ) {
      const body = await readJson(req);
      const { onboardingId, name } = body;

      if (
        !onboardingId ||
        !onboardings.has(onboardingId)
      ) {
        sendJson(res, 400, {
          status: "INVALID_ONBOARDING",
          message: "A valid onboardingId is required"
        });

        logResponse(
          "400 Bad Request",
          "invalid onboardingId"
        );

        return;
      }

      if (!name) {
        sendJson(res, 400, {
          status: "INVALID_CUSTOMER",
          message: "name is required"
        });

        logResponse(
          "400 Bad Request",
          "missing name"
        );

        return;
      }

      const customerId = makeId("CUS");

      customers.set(customerId, {
        id: customerId,
        onboardingId,
        name,
        email: null,
        phone: null,
        address: null,
        emailVerified: false,
        phoneVerified: false,
        termsAccepted: false,
        termsVersion: null,
        onboarded: false,
        accountId: null
      });

      sendJson(res, 200, {
        customerId
      });

      logResponse(
        "200 OK",
        `customerId=${customerId}`
      );

      return;
    }

// ------------------------------------------------------------
// setCustomerDetails
//
// PUT /customers/{customerId}/details
// ------------------------------------------------------------

if (
  req.method === "PUT" &&
  /^\/customers\/[^/]+\/details$/.test(pathname)
) {
  const found = customerFromPath(
    pathname,
    /^\/customers\/([^/]+)\/details$/
  );

  if (!found?.customer) {
    sendJson(res, 404, {
      status: "CUSTOMER_NOT_FOUND"
    });

    logResponse("404 Not Found");
    return;
  }

  const body = await readJson(req);

  const {
    email,
    phone,
    street,
    city,
    state,
    postalCode
  } = body;

  if (
    !email ||
    !phone ||
    !street ||
    !city ||
    !state ||
    !postalCode
  ) {
    sendJson(res, 400, {
      status: "INVALID_CUSTOMER_DETAILS",
      message:
        "email, phone, street, city, state, and postalCode are required"
    });

    logResponse(
      "400 Bad Request",
      "incomplete customer details"
    );

    return;
  }

  const customer = found.customer;

  // Preserve established verification state when the underlying
  // value has not changed.
  const emailChanged = customer.email !== email;
  const phoneChanged = customer.phone !== phone;

  customer.email = email;
  customer.phone = phone;

  customer.address = {
    street,
    city,
    state,
    postalCode
  };

  let emailVerificationId;
  let phoneVerificationId;

  if (emailChanged) {
    customer.emailVerified = false;

    emailVerificationId =
      createEmailVerification(
        found.customerId,
        email
      );
  } else {
    const existing =
      [...emailVerifications.values()]
        .find(
          verification =>
            verification.customerId === found.customerId &&
            verification.email === email
        );

    emailVerificationId =
      existing?.id ??
      createEmailVerification(
        found.customerId,
        email
      );
  }

  if (phoneChanged) {
    customer.phoneVerified = false;

    phoneVerificationId =
      createPhoneVerification(
        found.customerId,
        phone
      );
  } else {
    const existing =
      [...phoneVerifications.values()]
        .find(
          verification =>
            verification.customerId === found.customerId &&
            verification.phone === phone
        );

    phoneVerificationId =
      existing?.id ??
      createPhoneVerification(
        found.customerId,
        phone
      );
  }

  sendJson(res, 200, {
    emailVerificationId,
    phoneVerificationId
  });

  logResponse(
    "200 OK",
    `customerId=${found.customerId} ` +
      `emailVerificationId=${emailVerificationId} ` +
      `phoneVerificationId=${phoneVerificationId}`
  );

  return;
}
    // ------------------------------------------------------------
    // setCustomerEmail
    //
    // PUT /customers/{customerId}/email
    // ------------------------------------------------------------

    if (
      req.method === "PUT" &&
      /^\/customers\/[^/]+\/email$/.test(pathname)
    ) {
      const found = customerFromPath(
        pathname,
        /^\/customers\/([^/]+)\/email$/
      );

      if (!found?.customer) {
        sendJson(res, 404, {
          status: "CUSTOMER_NOT_FOUND"
        });

        logResponse("404 Not Found");
        return;
      }

      const body = await readJson(req);
      const { email } = body;

      if (!email) {
        sendJson(res, 400, {
          status: "INVALID_EMAIL",
          message: "email is required"
        });

        logResponse(
          "400 Bad Request",
          "missing email"
        );

        return;
      }

      found.customer.email = email;
      found.customer.emailVerified = false;

      const emailVerificationId =
        createEmailVerification(
          found.customerId,
          email
        );

      sendJson(res, 200, {
        emailVerificationId
      });

      logResponse(
        "200 OK",
        `customerId=${found.customerId} ` +
          `emailVerificationId=${emailVerificationId}`
      );

      return;
    }

    // ------------------------------------------------------------
    // setCustomerPhone
    //
    // PUT /customers/{customerId}/phone
    // ------------------------------------------------------------

    if (
      req.method === "PUT" &&
      /^\/customers\/[^/]+\/phone$/.test(pathname)
    ) {
      const found = customerFromPath(
        pathname,
        /^\/customers\/([^/]+)\/phone$/
      );

      if (!found?.customer) {
        sendJson(res, 404, {
          status: "CUSTOMER_NOT_FOUND"
        });

        logResponse("404 Not Found");
        return;
      }

      const body = await readJson(req);
      const { phone } = body;

      if (!phone) {
        sendJson(res, 400, {
          status: "INVALID_PHONE",
          message: "phone is required"
        });

        logResponse(
          "400 Bad Request",
          "missing phone"
        );

        return;
      }

      found.customer.phone = phone;
      found.customer.phoneVerified = false;

      const phoneVerificationId =
        createPhoneVerification(
          found.customerId,
          phone
        );

      sendJson(res, 200, {
        phoneVerificationId
      });

      logResponse(
        "200 OK",
        `customerId=${found.customerId} ` +
          `phoneVerificationId=${phoneVerificationId}`
      );

      return;
    }

    // ------------------------------------------------------------
    // setCustomerAddress
    //
    // PUT /customers/{customerId}/address
    // ------------------------------------------------------------

    if (
      req.method === "PUT" &&
      /^\/customers\/[^/]+\/address$/.test(pathname)
    ) {
      const found = customerFromPath(
        pathname,
        /^\/customers\/([^/]+)\/address$/
      );

      if (!found?.customer) {
        sendJson(res, 404, {
          status: "CUSTOMER_NOT_FOUND"
        });

        logResponse("404 Not Found");
        return;
      }

      const body = await readJson(req);

      const {
        street,
        city,
        state,
        postalCode
      } = body;

      if (
        !street ||
        !city ||
        !state ||
        !postalCode
      ) {
        sendJson(res, 400, {
          status: "INVALID_ADDRESS",
          message:
            "street, city, state, and postalCode are required"
        });

        logResponse(
          "400 Bad Request",
          "incomplete address"
        );

        return;
      }

      found.customer.address = {
        street,
        city,
        state,
        postalCode
      };

      sendJson(res, 200, {
        status: "SUCCESS"
      });

      logResponse(
        "200 OK",
        `customerId=${found.customerId}`
      );

      return;
    }

    // ------------------------------------------------------------
    // verifyCustomerEmail
    //
    // POST /customers/{customerId}/email/verification
    // ------------------------------------------------------------

    if (
      req.method === "POST" &&
      /^\/customers\/[^/]+\/email\/verification$/.test(
        pathname
      )
    ) {
      const found = customerFromPath(
        pathname,
        /^\/customers\/([^/]+)\/email\/verification$/
      );

      if (!found?.customer) {
        sendJson(res, 404, {
          status: "CUSTOMER_NOT_FOUND"
        });

        logResponse("404 Not Found");
        return;
      }

      const body = await readJson(req);

      const {
        emailVerificationId
      } = body;

      const verification =
        emailVerifications.get(
          emailVerificationId
        );

      if (
        !verification ||
        verification.customerId !==
          found.customerId ||
        verification.email !==
          found.customer.email
      ) {
        sendJson(res, 400, {
          status: "INVALID_EMAIL_VERIFICATION"
        });

        logResponse(
          "400 Bad Request",
          "invalid email verification"
        );

        return;
      }

      verification.verified = true;
      found.customer.emailVerified = true;

      sendJson(res, 200, {
        verifiedEmail: found.customer.email
      });

      logResponse(
        "200 OK",
        `customerId=${found.customerId} ` +
          `verifiedEmail=${found.customer.email}`
      );

      return;
    }

    // ------------------------------------------------------------
    // verifyCustomerPhone
    //
    // POST /customers/{customerId}/phone/verification
    // ------------------------------------------------------------

    if (
      req.method === "POST" &&
      /^\/customers\/[^/]+\/phone\/verification$/.test(
        pathname
      )
    ) {
      const found = customerFromPath(
        pathname,
        /^\/customers\/([^/]+)\/phone\/verification$/
      );

      if (!found?.customer) {
        sendJson(res, 404, {
          status: "CUSTOMER_NOT_FOUND"
        });

        logResponse("404 Not Found");
        return;
      }

      const body = await readJson(req);

      const {
        phoneVerificationId
      } = body;

      const verification =
        phoneVerifications.get(
          phoneVerificationId
        );

      if (
        !verification ||
        verification.customerId !==
          found.customerId ||
        verification.phone !==
          found.customer.phone
      ) {
        sendJson(res, 400, {
          status: "INVALID_PHONE_VERIFICATION"
        });

        logResponse(
          "400 Bad Request",
          "invalid phone verification"
        );

        return;
      }

      verification.verified = true;
      found.customer.phoneVerified = true;

      sendJson(res, 200, {
        verifiedPhone: found.customer.phone
      });

      logResponse(
        "200 OK",
        `customerId=${found.customerId} ` +
          `verifiedPhone=${found.customer.phone}`
      );

      return;
    }

    // ------------------------------------------------------------
    // acceptTerms
    //
    // POST /customers/{customerId}/terms
    // ------------------------------------------------------------

    if (
      req.method === "POST" &&
      /^\/customers\/[^/]+\/terms$/.test(pathname)
    ) {
      const found = customerFromPath(
        pathname,
        /^\/customers\/([^/]+)\/terms$/
      );

      if (!found?.customer) {
        sendJson(res, 404, {
          status: "CUSTOMER_NOT_FOUND"
        });

        logResponse("404 Not Found");
        return;
      }

      const body = await readJson(req);

      const {
        termsVersion
      } = body;

      if (!termsVersion) {
        sendJson(res, 400, {
          status: "INVALID_TERMS",
          message: "termsVersion is required"
        });

        logResponse(
          "400 Bad Request",
          "missing termsVersion"
        );

        return;
      }

      found.customer.termsAccepted = true;
      found.customer.termsVersion =
        termsVersion;

      sendJson(res, 200, {
        status: "SUCCESS"
      });

      logResponse(
        "200 OK",
        `customerId=${found.customerId} ` +
          `termsVersion=${termsVersion}`
      );

      return;
    }

    // ------------------------------------------------------------
    // onboardCustomer
    //
    // POST /customers/{customerId}/onboarding
    //
    // This independently verifies the actual capability state
    // before completing onboarding.
    // ------------------------------------------------------------

    if (
      req.method === "POST" &&
      /^\/customers\/[^/]+\/onboarding$/.test(
        pathname
      )
    ) {
      const found = customerFromPath(
        pathname,
        /^\/customers\/([^/]+)\/onboarding$/
      );

      if (!found?.customer) {
        sendJson(res, 404, {
          status: "CUSTOMER_NOT_FOUND"
        });

        logResponse("404 Not Found");
        return;
      }

      const customer = found.customer;

      const missing = [];

      if (!customer.email) {
        missing.push("email");
      }

      if (!customer.emailVerified) {
        missing.push("emailVerified");
      }

      if (!customer.phone) {
        missing.push("phone");
      }

      if (!customer.phoneVerified) {
        missing.push("phoneVerified");
      }

      if (!customer.address) {
        missing.push("address");
      }

      if (!customer.termsAccepted) {
        missing.push("termsAccepted");
      }

      if (missing.length > 0) {
        sendJson(res, 409, {
          status: "ONBOARDING_INCOMPLETE",
          missing
        });

        logResponse(
          "409 Conflict",
          `customerId=${found.customerId} ` +
            `missing=${missing.join(",")}`
        );

        return;
      }

      if (!customer.accountId) {
        customer.accountId =
          makeId("ACC");

        customer.onboarded = true;

        accounts.set(
          customer.accountId,
          {
            id: customer.accountId,
            customerId:
              found.customerId,
            status: "active"
          }
        );
      }

      sendJson(res, 200, {
        accountId: customer.accountId
      });

      logResponse(
        "200 OK",
        `customerId=${found.customerId} ` +
          `accountId=${customer.accountId}`
      );

      return;
    }

    // ------------------------------------------------------------
    // Unknown endpoint
    // ------------------------------------------------------------

    sendJson(res, 404, {
      status: "NOT_FOUND"
    });

    logResponse("404 Not Found");
  } catch (error) {
    console.error(
      `[CUSTOMER-ONBOARDING] Error: ${error.message}`
    );

    sendJson(res, 400, {
      status: "BAD_REQUEST",
      message: error.message
    });

    logResponse("400 Bad Request");
  }
});

server.listen(PORT, () => {
  console.log(
    `[CUSTOMER-ONBOARDING] Listening on http://localhost:${PORT}`
  );
});
