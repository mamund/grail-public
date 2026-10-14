/**
 * GRAIL Demo-25: Rules-based customer message classification
 * ---------------------------------------------------------
 *
 * Purpose:
 *   Classifies a customer message into one of three categories:
 *   billing, support, or sales.
 *
 *   Uses deterministic keyword matching without an LLM
 *   or external service dependency.
 *
 * GRAIL integration:
 *   Invoked as a STDIO-bound capability by the GRAIL runtime.
 *   Registered as the "classifyWithRules" affordance.
 *   Produces the "customerMessageClassified" effect on SUCCESS.
 *
 *   Provides an alternative producer of the same effect
 *   as the Qwen-backed "classifyCustomerMessage" affordance.
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
 *   - No external services or language models
 *
 * Processing:
 *   1. Read and validate the input message.
 *   2. Normalize the message to lowercase.
 *   3. Compare the message against category keyword lists.
 *   4. Return the first matching category through stdout.
 *
 * Matching behavior:
 *   Categories are evaluated in this order:
 *     billing -> support -> sales
 *
 *   The first matching category is returned.
 *   Keyword matching uses substring inclusion.
 *   Multiple matching categories are not ranked or scored.
 *
 * Failure behavior:
 *   - Missing or invalid input
 *   - No matching classification keyword
 *
 *   Errors are written to stderr and the process exits
 *   with a nonzero status. GRAIL interprets this as FAIL.
 *
 * Notes:
 *   This capability provides a deterministic alternative
 *   when the Qwen-backed capability fails.
 *
 *   GRAIL selects affordances based on their ability to
 *   produce the required effect. The runtime does not
 *   require a predefined fallback sequence.
 *
 *   The rules-based classifier has limited vocabulary
 *   coverage and does not verify semantic correctness.
 */

const chunks = [];

for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

try {
  const inputs = JSON.parse(
    Buffer.concat(chunks).toString("utf8")
  );

  if (typeof inputs.message !== "string" ||
      !inputs.message.trim()) {
    throw new Error("Missing customer message");
  }

  const message = inputs.message.toLowerCase();

  const rules = {
    billing: [
      "charged", "payment", "invoice",
      "refund", "billing"
    ],
    support: [
      "error", "broken", "technical",
      "troubleshoot", "not working"
    ],
    sales: [
      "pricing", "purchase", "buy",
      "product", "quote"
    ]
  };

  let category = null;

  for (const [name, keywords] of Object.entries(rules)) {
    if (keywords.some(word => message.includes(word))) {
      category = name;
      break;
    }
  }

  if (!category) {
/**
 * GRAIL Demo-25: Rules-based customer message classification
 * ---------------------------------------------------------
 *
 * Purpose:
 *   Classifies a customer message into one of three categories:
 *   billing, support, or sales.
 *
 *   Uses deterministic keyword matching without an LLM
 *   or external service dependency.
 *
 * GRAIL integration:
 *   Invoked as a STDIO-bound capability by the GRAIL runtime.
 *   Registered as the "classifyWithRules" affordance.
 *   Produces the "customerMessageClassified" effect on SUCCESS.
 *
 *   Provides an alternative producer of the same effect
 *   as the Qwen-backed "classifyCustomerMessage" affordance.
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
 *   - No external services or language models
 *
 * Processing:
 *   1. Read and validate the input message.
 *   2. Normalize the message to lowercase.
 *   3. Compare the message against category keyword lists.
 *   4. Return the first matching category through stdout.
 *
 * Matching behavior:
 *   Categories are evaluated in this order:
 *     billing -> support -> sales
 *
 *   The first matching category is returned.
 *   Keyword matching uses substring inclusion.
 *   Multiple matching categories are not ranked or scored.
 *
 * Failure behavior:
 *   - Missing or invalid input
 *   - No matching classification keyword
 *
 *   Errors are written to stderr and the process exits
 *   with a nonzero status. GRAIL interprets this as FAIL.
 *
 * Notes:
 *   This capability provides a deterministic alternative
 *   when the Qwen-backed capability fails.
 *
 *   GRAIL selects affordances based on their ability to
 *   produce the required effect. The runtime does not
 *   require a predefined fallback sequence.
 *
 *   The rules-based classifier has limited vocabulary
 *   coverage and does not verify semantic correctness.
 */

    throw new Error("No matching classification rule");
  }

  process.stdout.write(
    JSON.stringify({ category }) + "\n"
  );

} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

