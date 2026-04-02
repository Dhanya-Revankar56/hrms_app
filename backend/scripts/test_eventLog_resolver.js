const { ApolloServer, gql } = require("apollo-server-express");
const { typeDefs, resolvers } = require("../src/modules");
const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

async function testQuery() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({
      institution_id: "COLLEGE_A",
      user: { id: "some-id", role: "ADMIN" }
    })
  });

  const query = gql`
    query {
      eventLogs {
        items {
          id
          action_type
          description
        }
      }
    }
  `;

  try {
    const res = await server.executeOperation({ query });
    console.log("Response:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

testQuery();
