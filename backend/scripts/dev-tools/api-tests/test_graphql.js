require("dotenv").config();
const { ApolloServer } = require("apollo-server-express");
const mongoose = require("mongoose");
const { typeDefs, resolvers } = require("../src/modules");
const { runWithTenant } = require("../src/middleware/tenantContext");

async function testGQL() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await mongoose.connection.db
    .collection("users")
    .findOne({ email: "dhanyavernekar@gmail.com" });
  const tenantId = user.tenant_id;

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({
      user,
      tenant_id: tenantId,
      institution_id: tenantId,
    }),
  });

  await server.start();

  console.log("\n--- Querying Relievings ---");
  await runWithTenant(tenantId, async () => {
    const res1 = await server.executeOperation({
      query: `
        query GetRelievings {
          relievings(pagination: { page: 1, limit: 10 }) {
            items {
              id
              employee_id
              employee_code
              resignation_date
              last_working_date
              notice_period_days
              reason
              status
              remarks
              created_at
              employee {
                id
                first_name
                last_name
                employee_id
                work_detail {
                  department { name }
                  designation { name }
                }
              }
            }
            pageInfo { totalCount }
          }
        }
      `,
    });
    console.log(
      res1.errors
        ? JSON.stringify(res1.errors, null, 2)
        : JSON.stringify(res1.data.relievings.items[0], null, 2),
    );

    console.log("\n--- Querying Holidays ---");
    const res2 = await server.executeOperation({
      query: `
        query GetHolidays {
          holidays {
            id
            name
            date
          }
        }
      `,
    });
    console.log(
      res2.errors
        ? JSON.stringify(res2.errors, null, 2)
        : `Holidays found: ${res2.data.holidays.length}`,
    );

    console.log("\n--- Querying Dashboard Stats ---");
    const res3 = await server.executeOperation({
      query: `
        query GetDashboardStats {
          dashboardStats {
            totalEmployees
            upcomingHolidays { name }
          }
        }
      `,
    });
    console.log(
      res3.errors
        ? JSON.stringify(res3.errors, null, 2)
        : JSON.stringify(res3.data.dashboardStats, null, 2),
    );
  });

  await server.stop();
  await mongoose.disconnect();
}

testGQL().catch(console.error);
