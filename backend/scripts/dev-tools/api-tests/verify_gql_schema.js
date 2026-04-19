const {
  ApolloClient,
  InMemoryCache,
  gql,
  HttpLink,
} = require("@apollo/client/core");
const fetch = require("cross-fetch");

const client = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:5000/graphql", fetch }),
  cache: new InMemoryCache(),
});

const TEST_SCHEMA = gql`
  query {
    __schema {
      mutationType {
        fields {
          name
        }
      }
    }
  }
`;

async function verifyMutations() {
  try {
    const { data } = await client.query({ query: TEST_SCHEMA });
    const mutations = data.__schema.mutationType.fields.map((f) => f.name);
    console.log("Registered Mutations:", mutations);

    const required = ["applyLeave", "updateLeaveApproval", "cancelLeave"];
    const missing = required.filter((m) => !mutations.includes(m));

    if (missing.length === 0) {
      console.log("SUCCESS: All required leave mutations are registered.");
    } else {
      console.log("FAILURE: Missing mutations:", missing);
      process.exit(1);
    }
  } catch (err) {
    console.error("Connection Error:", err.message);
    process.exit(1);
  }
}

verifyMutations();
