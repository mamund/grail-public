// httpBinding.js
// Generic HTTP binding executor.
// Maps resolved GRAIL inputs to HTTP path, query, header, and body locations.
// Returns captured request/response facts to the GRAIL runtime.

export async function executeHttpBinding(binding, inputs) {
  const parameters = binding.parameters;

  if (!parameters) {
    return executeRequest(binding, {
      url: binding.url,
      headers: {},
      body: { ...inputs }
    });
  }

  let url = binding.url;
  const headers = {};
  const body = {};
  const query = new URLSearchParams();

  for (const [inputName, parameter] of Object.entries(parameters)) {
    if (!(inputName in inputs)) {
      throw new Error(`Missing binding input: ${inputName}`);
    }

    const value = inputs[inputName];
    const httpName = parameter.name || inputName;

    switch (parameter.in) {
      case "path": {
        const token = `{${httpName}}`;

        if (!url.includes(token)) {
          throw new Error(
            `Path parameter '${inputName}' expects placeholder '${token}' in binding URL`
          );
        }

        url = url.replaceAll(token, encodeURIComponent(String(value)));
        break;
      }

      case "query":
        appendQueryValue(query, httpName, value);
        break;

      case "header":
        headers[httpName] = String(value);
        break;

      case "body":
        body[httpName] = value;
        break;

      default:
        throw new Error(
          `Unsupported HTTP parameter location '${parameter.in}' for input '${inputName}'`
        );
    }
  }

  const queryString = query.toString();
  if (queryString) {
    url += `${url.includes("?") ? "&" : "?"}${queryString}`;
  }

  return executeRequest(binding, {
    url,
    headers,
    body
  });
}

function appendQueryValue(query, name, value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      query.append(name, String(item));
    }
    return;
  }

  query.append(name, String(value));
}

async function executeRequest(binding, request) {
  const contentType = binding.contentType || "application/json";
  const headers = { ...request.headers };
  const hasBody = Object.keys(request.body).length > 0;
  let requestBody;

  if (hasBody) {
    headers["Content-Type"] = contentType;

    if (contentType === "application/x-www-form-urlencoded") {
      requestBody = new URLSearchParams(request.body).toString();
    } else {
      requestBody = JSON.stringify(request.body);
    }
  }

  const options = {
    method: binding.method,
    headers
  };

  if (hasBody) {
    options.body = requestBody;
  }

  const response = await fetch(request.url, options);
  const responseHeaders = Object.fromEntries(response.headers.entries());
  const responseBody = await readResponseBody(response);

  return {
    request: {
      method: binding.method,
      url: request.url,
      headers,
      body: hasBody ? request.body : null
    },
    response: {
      ok: response.ok,
      status: response.status,
      headers: responseHeaders,
      body: responseBody
    }
  };
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (text === "") {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}
