// capability-stub.js

import http from "node:http";

const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/execute") {
    console.log(`[CAPABILITY-STUB] Received: ${req.method} ${req.url}`);

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify({
      status: "SUCCESS"
    }));

    console.log(`[CAPABILITY-STUB] Responded: 200 OK`);
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
