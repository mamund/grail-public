/**
 * GRAIL Demo-25: LLM-backed customer message classification
 * ---------------------------------------------------------
 *
 * Purpose:
 *   Classifies a customer message into one of three categories:
 *   billing, support, or sales.
 *
 *   Uses a locally hosted Qwen language model through the
 *   Ollama HTTP API.
 *
 * GRAIL integration:
 *   Invoked as a STDIO-bound capability by the GRAIL runtime.
 *   Registered as the "classifyCustomerMessage" affordance.
 *   Produces the "customerMessageClassified" effect on SUCCESS.
 *
 * Input (stdin):
 *   JSON object containing a customer message.
 *
 *   Example:
 *     {"message":"I was charged twice for my order."}
 *
 * Output (stdout):
 *   JSON object containing the classification category.
 *
 *   Example:
 *     {"category":"billing"}
 *
 * Dependencies:
 *   - Node.js 22+
 *   - Ollama running at http://localhost:11434
 *   - Installed Ollama model: qwen2.5:3b
 *
 * Processing:
 *   1. Read and validate the input message.
 *   2. Construct a classification prompt.
 *   3. Invoke Ollama using its /api/generate endpoint.
 *   4. Parse the model's JSON response.
 *   5. Validate the category against allowed values.
 *   6. Return the classification through stdout.
 *
 * Failure behavior:
 *   - Missing or invalid input
 *   - Ollama unavailable or HTTP request failure
 *   - Invalid JSON returned by the model
 *   - Category outside the allowed classification set
 *
 *   Errors are written to stderr and the process exits
 *   with a nonzero status. GRAIL interprets this as FAIL.
 *
 * Notes:
 *   Model temperature is set to zero to reduce variation.
 *   This does not guarantee deterministic or semantically
 *   correct classifications.
 *
 *   Successful execution indicates a structurally valid
 *   classification. Semantic accuracy is not independently
 *   verified by this capability.
 *
 *   GRAIL remains unaware of the underlying LLM. The
 *   capability conforms to the existing STDIO contract.
 */

const chunks = [];

for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

try {
  const inputs = JSON.parse(Buffer.concat(chunks).toString("utf8"));

  if (typeof inputs.message !== "string" || !inputs.message.trim()) {
    throw new Error("Missing customer message");
  }

  const prompt = `
Classify the customer message using these rules:

billing: charges, payments, invoices, refunds
support: technical problems, errors, troubleshooting
sales: product inquiries, pricing, purchases

Return only a JSON object with a category field.

Message: ${inputs.message}
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(120000),
    body: JSON.stringify({
      model: "qwen2.5:3b",
      prompt,
      format: "json",
      stream: false,
      options: { temperature: 0 }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`);
  }

  const result = await response.json();
  const classification = JSON.parse(result.response);

  const allowed = ["billing", "support", "sales"];

  if (!allowed.includes(classification.category)) {
    throw new Error("Invalid classification category");
  }

  process.stdout.write(JSON.stringify({
    category: classification.category
  }) + "\n");

} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

