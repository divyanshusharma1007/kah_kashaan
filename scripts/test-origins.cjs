const path = require("node:path");

// Mock request
function makeMockRequest({ url = "http://localhost:10000/api/auth/google/callback", headers = {} } = {}) {
  const nextUrl = new URL(url);
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    url,
    nextUrl,
    headers: {
      get: (key) => headerMap.get(key.toLowerCase()) || null,
    },
  };
}

function assert(condition, msg) {
  if (!condition) {
    console.error("FAIL:", msg);
    process.exit(1);
  } else {
    console.log("PASS:", msg);
  }
}

async function run() {
  // Use compiled or transpile test directly
  // We can write simple functions matching request-origin logic or require it
  // Since request-origin is TS, let's test request-origin by building or importing via Next or running tsc
  console.log("Testing origin logic directly...");

  // Let's test the functions
  delete process.env.APP_URL;
  delete process.env.RENDER_EXTERNAL_URL;
  delete process.env.GOOGLE_REDIRECT_URI;
  delete process.env.ALLOWED_ORIGINS;

  // Let's import request-origin via a small bundle or ts-node or test with next build
}

run();

