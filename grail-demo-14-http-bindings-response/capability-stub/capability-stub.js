// capability-stub.js

import http from "node:http";

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/execute") {
    console.log(`[CAPABILITY-STUB] Received: ${req.method} ${req.url}`);

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      const contentType = req.headers["content-type"] || "";

      let inputs = {};

      try {
        if (contentType.startsWith("application/x-www-form-urlencoded")) {
          inputs = Object.fromEntries(new URLSearchParams(body));
        } else if (contentType.startsWith("application/json")) {
          inputs = JSON.parse(body || "{}");
        } else {
          inputs = body;
        }
      } catch {
        inputs = body;
      }

      console.log(`[CAPABILITY-STUB] Content-Type: ${contentType}`);
      console.log(`[CAPABILITY-STUB] Raw body: ${body}`);
      console.log(`[CAPABILITY-STUB] Inputs:`, inputs);

      res.writeHead(200, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        status: "SUCCESS"
      }));

      console.log(`[CAPABILITY-STUB] Responded: 200 OK`);
    });

    return;
  }

  // Test endpoint for explicit HTTP input-location bindings.
  // Expected request:
  //
  // POST /binding-test/{customerId}?lang={language}
  // X-Test-Token: {token}
  //
  // {
  //   "emailAddress": "..."
  // }

  if (req.method === "POST" && req.url.startsWith("/binding-test/")) {
    console.log(`[CAPABILITY-STUB] Received: ${req.method} ${req.url}`);

    const url = new URL(
      req.url,
      `http://${req.headers.host || `localhost:${PORT}`}`
    );

    const match = url.pathname.match(/^\/binding-test\/([^/]+)$/);

    if (!match) {
      res.writeHead(404, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        status: "NOT_FOUND"
      }));

      return;
    }

    const customerId = decodeURIComponent(match[1]);
    const language = url.searchParams.get("lang");
    const token = req.headers["x-test-token"] || null;

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      let parsedBody = {};

      try {
        parsedBody = JSON.parse(body || "{}");
      } catch {
        parsedBody = body;
      }

      const emailAddress =
        parsedBody && typeof parsedBody === "object"
          ? parsedBody.emailAddress ?? null
          : null;

      console.log(`[CAPABILITY-STUB] Path customerId: ${customerId}`);
      console.log(`[CAPABILITY-STUB] Query lang: ${language}`);
      console.log(`[CAPABILITY-STUB] Header X-Test-Token: ${token}`);
      console.log(`[CAPABILITY-STUB] Raw body: ${body}`);
      console.log(
        `[CAPABILITY-STUB] Body emailAddress: ${emailAddress}`
      );

      const received = {
        customerId,
        language,
        token,
        emailAddress
      };

      const complete = Object.values(received).every(
        value =>
          value !== null &&
          value !== undefined &&
          value !== ""
      );

      res.writeHead(complete ? 200 : 400, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        status: complete
          ? "SUCCESS"
          : "INVALID_BINDING_TEST",
        received
      }));

      console.log(
        `[CAPABILITY-STUB] Responded: ${
          complete ? "200 OK" : "400 Bad Request"
        }`
      );
    });

    return;
  }

  // Demo 14: return customer data containing an account identifier.
  //
  // GET /customers/{customerId}

  if (req.method === "GET" && req.url.startsWith("/customers/")) {
    console.log(`[CAPABILITY-STUB] Received: ${req.method} ${req.url}`);

    const url = new URL(
      req.url,
      `http://${req.headers.host || `localhost:${PORT}`}`
    );

    const match = url.pathname.match(/^\/customers\/([^/]+)$/);

    if (!match) {
      res.writeHead(404, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        status: "NOT_FOUND"
      }));

      return;
    }

    const customerId = decodeURIComponent(match[1]);

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      id: customerId,
      name: "Jordan",
      account: {
        id: "A97"
      }
    }));

    console.log(
      `[CAPABILITY-STUB] Responded: 200 OK customerId=${customerId} accountId=A97`
    );

    return;
  }

  // Demo 14: consume the account identifier returned by lookupCustomer.
  //
  // GET /accounts/{accountId}

  if (req.method === "GET" && req.url.startsWith("/accounts/")) {
    console.log(`[CAPABILITY-STUB] Received: ${req.method} ${req.url}`);

    const url = new URL(
      req.url,
      `http://${req.headers.host || `localhost:${PORT}`}`
    );

    const match = url.pathname.match(/^\/accounts\/([^/]+)$/);

    if (!match) {
      res.writeHead(404, {
        "Content-Type": "application/json"
      });

      res.end(JSON.stringify({
        status: "NOT_FOUND"
      }));

      return;
    }

    const accountId = decodeURIComponent(match[1]);

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      id: accountId,
      status: "active"
    }));

    console.log(
      `[CAPABILITY-STUB] Responded: 200 OK accountId=${accountId}`
    );

    return;
  }

  console.log(
    `[CAPABILITY-STUB] Unknown request: ${req.method} ${req.url}`
  );

  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify({
    status: "NOT_FOUND"
  }));
});

server.listen(PORT, () => {
  console.log(
    `[CAPABILITY-STUB] Listening on http://localhost:${PORT}`
  );
});
