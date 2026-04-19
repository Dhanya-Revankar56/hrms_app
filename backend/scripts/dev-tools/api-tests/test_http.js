const fetch = require("node-fetch");

async function testHttp() {
  const query = `
    query GetDashboardStats {
      dashboardStats {
        totalEmployees
      }
    }
  `;
  try {
    const res = await fetch("http://localhost:5000/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const text = await res.text();
    console.log("HTTP Response:", text);
  } catch (err) {
    console.error("HTTP Error:", err);
  }
}
testHttp();
