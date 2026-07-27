// debug-403-fixer.js
const fs = require('fs');
const path = require('path');

console.log("🔍 Starting Automated 403 Forbidden Diagnostics Engine...");

// 1. Audit wrangler.toml / netlify.toml for Database Binding Matrix
const wranglerPath = path.join(__dirname, 'wrangler.toml');
if (fs.existsSync(wranglerPath)) {
    const content = fs.readFileSync(wranglerPath, 'utf8');
    console.log("Checking wrangler.toml configurations...");

    if (!content.includes('binding = "DB"') && !content.includes("binding = 'DB'")) {
        console.error("❌ ERROR DETECTED: D1 Database Binding name is not set to 'DB' inside wrangler.toml!");
    } else if (!content.includes('ceba9320-4b75-46b5-8077-d96c4c627176')) {
        console.error("❌ ERROR DETECTED: Missing or incorrect D1 Database ID inside wrangler.toml.");
    } else {
        console.log("✅ wrangler.toml Database Binding parameters verified successfully.");
    }
} else {
    console.warn("⚠️ wrangler.toml not found at root directory. Skipping config check.");
}

// 2. Scan and Auto-Fix Backend Serverless API Handler
const apiPath = path.join(__dirname, 'backend', 'api', 'd1-admin-deploy.ts'); // Verify your exact directory path
// If path is under netlify/functions or src/api, adjust accordingly:
const fallbackApiPath = path.join(__dirname, 'netlify', 'functions', 'd1-admin-deploy.ts');
const targetApi = fs.existsSync(apiPath) ? apiPath : (fs.existsSync(fallbackApiPath) ? fallbackApiPath : null);

if (targetApi) {
    console.log(`Analyzing target backend API endpoint: ${targetApi}`);
    let apiContent = fs.readFileSync(targetApi, 'utf8');

    // Check if Preflight OPTIONS handler exists
    if (!apiContent.includes('request.method === "OPTIONS"') && !apiContent.includes("request.method === 'OPTIONS'")) {
        console.log("🔧 Injecting missing HTTP OPTIONS Preflight 204 Route Guard to eliminate 403 blocks...");

        const injectOptionsCode = `
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Static-Admin",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
        `;

        // Find the beginning of the handler function and insert the CORS matrix
        apiContent = apiContent.replace(/export async function handler\((.*?)\) \{/, `export async function handler($1) {${injectOptionsCode}`);
        fs.writeFileSync(targetApi, apiContent, 'utf8');
        console.log("✅ API successfully injected with CORS Preflight capabilities.");
    } else {
        console.log("✅ HTTP OPTIONS intercept rules are already defined in the API logic.");
    }
} else {
    console.warn("⚠️ Could not locate the backend API deploy handler file automatically. Verify directory tree arrays.");
}

console.log("🏁 Automated Diagnostics complete. Please run `netlify dev` or `wrangler dev` to spin up active sessions.");