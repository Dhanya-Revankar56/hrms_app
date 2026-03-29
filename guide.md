# HRMS Project Guide: The Complete Manual

Welcome to your HRMS (Human Resource Management System) guide! This document explains how your project works, from the code to the database, in simple terms.

---

## 1. The Big Picture (Overall Architecture)

*   **The Frontend (The Dining Area)**: React + Vite + Apollo Client. The UI users interact with.
*   **The Backend (The Kitchen)**: Node.js + Express + Apollo Server. The logic brain.
*   **The Database (The Pantry)**: MongoDB + Mongoose. Persistent storage with strict schema enforcement.
*   **The Waiter (GraphQL)**: The efficient bridge between Frontend and Backend.

---

## 2. The Technology Stack

1.  **React**: "Lego blocks" for building the UI.
2.  **Node.js**: The motor for the backend.
3.  **MongoDB**: Flexible database for saving documents.
4.  **GraphQL**: A single-endpoint API for efficient data retrieval.

---

## 3. Module Deep Dive (Backend APIs)

### Employee Module
*   `getAllEmployees`: Returns a list of all staff. Includes search and pagination.
*   `createEmployee`: Adds a new person to the system using a **Strict Schema** (enums for gender, marital status, roles, etc.).
*   `updateEmployee`: Changes details like designation or phone number.

### Settings Module (Modular Master Data)
The system uses separate collections for better organization:
*   **Departments**: Main organizational units.
*   **Designations**: Job titles, now **linked to specific departments**.
*   **Leave Types**: Detailed policies including total days, carry-forward, and gender applicability.
*   **Employee Categories/Types**: For granular classification (e.g., Teaching, Contract).

### Leave Module
*   `leaves`: Shows all requests.
*   `leaveBalances`: Shows how many days an employee has left.
*   `updateLeave`: Where the "Approve/Reject" logic lives.

---

## 4. Advanced: Modifying & Debugging

### How to add a new field (The 3-Step Rule)
1.  **Database**: Add to `model.js`.
2.  **API**: Add to `typeDefs.js`.
3.  **Frontend**: Update `queries.ts`.

### Debugging Checklist
1.  **Console (F12)**: Check for code errors.
2.  **Network Tab**: Click the "graphql" POST request to see the real data being sent/received.
3.  **Terminal**: Check the backend logs for server-side crashes.

---

## 5. Security & Roles
Values for `app_role` determine what a user can see:
*   **Admin**: Full access.
*   **HOD/Dept Admin**: Can manage their specific department.
*   **Employee**: Can manage their own profile and leaves.

---

## 6. Why GraphQL?
*   **No Over-fetching**: We never download data we don't need.
*   **Single Request**: All data for a page comes in one trip.
*   **Schema-First**: The API is like a contract; the code must match the plan.

---

## 7. Scaling to 10,000+ Users

If your project grows from 100 to 10,000 employees, you will face new challenges. Here is how to handle them:

### The Problems
1.  **Server Overload**: One "Chef" (Server) cannot handle 10,000 orders at once. He will get tired and slow down.
2.  **Database Bottleneck**: Searching through 10,000 records without a plan is slow.
3.  **Heavy Tasks**: Generating 10,000 payslips at once will freeze the whole application for everyone.

### The Solutions (Simple Terms)
1.  **Horizontal Scaling (More Chefs)**: Instead of one big server, run 5-10 small servers. Use a **Load Balancer** to distribute the requests. If one server crashes, the others keep working.
2.  **Database Indexing (The Quick Search)**: Tell MongoDB to keep a "shortcut list" for fields like `employee_id` or `department`. This makes searching 1,000x faster.
3.  **Caching with Redis (The Instant Shelf)**: Put frequently used data (like the list of Settings or Departments) in a "Quick Access" memory (RAM). It’s like keeping salt and pepper on the counter instead of in the back room.
4.  **Database Sharding**: Split the data by College. College A’s data sits on one database, and College B’s on another.
5.  **Background Queues**: Use a service to handle heavy work (like sending emails or generating PDFs) in the background so the main app stays fast for the users.

---

## 8. Project Vulnerabilities & Pro-Fixes

As your project grows, you need to watch out for these "weak points" and know how to fix them.

### 1. Concurrency (Race Conditions)
*   **The Problem**: If two admins click "Approve" on the same Leave request at the exact same millisecond, the logic might run twice. This could lead to an employee having "negative" leave balance because the system subtracted the days two times.
*   **The Fix**: Use **MongoDB Transactions**. A transaction ensures that "Update Leave Status" and "Deduct Balance" happen as one single atomic step. If one fails, everything rolls back.

### 2. Data Inconsistency (Duplicates)
*   **The Problem**: Currently, the system allows you to create two attendance records for the same employee on the same day, or two designations with the same name in the same department.
*   **The Fix**: Use **Unique Compound Indexes** in your MongoDB Model.
    ```javascript
    // In attendance/model.js
    attendanceSchema.index({ employee_id: 1, date: 1, institution_id: 1 }, { unique: true });
    
    // In designation/model.js
    designationSchema.index({ institution_id: 1, department: 1, name: 1 }, { unique: true });
    ```

### 3. Security (Mass Assignment & Authorization)
*   **The Problem**: The backend trusts the frontend. A smart user could manually send a GraphQL request to `updateLeave` and set `status: "approved"` even if they aren't an admin.
*   **The Fix**: **Backend Role Validation**. Never trust the `input` from the frontend blindly.
    ```javascript
    // In leave/resolvers.js
    updateLeave: async (_, { id, input }, ctx) => {
      if (input.status === 'approved' && ctx.user.role !== 'ADMIN') {
        throw new Error("You are not authorized to approve leaves!");
      }
      // ... continue
    }
    ```

### 4. Direct Header Impersonation
*   **The Problem**: Anyone who knows a "College ID" can put it in the header and see all data.
*   **The Fix**: Use **JWT (JSON Web Tokens)**. Instead of a simple ID, the user should send a signed token that proves they actually belong to that college and are logged in.

### 5. Multi-tenancy "Leakage"
*   **The Problem**: If a developer forgets to add `{ institution_id }` in a single query, data from College A might show up in College B.
*   **The Fix**: Use a **Global Mongoose Plugin** that automatically adds the `institution_id` filter to every single database query.

---

## 9. Testing Your HRMS

Testing ensures that a "small change" today doesn't break a "big feature" tomorrow.

### 1. Unit Testing (Service Layer)
*   **What it is**: Testing a single function in `service.js`.
*   **Tool**: **Jest**.
*   **Example**: Testing Leave Calculation.
    ```javascript
    // leave.test.js
    test('Should calculate 3 days between Monday and Wednesday', () => {
      const days = calculateDays('2026-03-01', '2026-03-03');
      expect(days).toBe(3);
    });
    ```

### 2. Integration Testing (API Layer)
*   **What it is**: Testing the full flow from GraphQL request to Database.
*   **Tool**: **Supertest** + **Jest**.
*   **Example**: Testing `createEmployee` mutation.
    ```javascript
    // api.test.js
    const request = require('supertest');
    
    it('should create a new employee via GraphQL', async () => {
      const response = await request(app)
        .post('/graphql')
        .set('x-institution-id', 'COLLEGE_A')
        .send({
          query: `mutation { createEmployee(input: { first_name: "Test" ... }) { id } }`
        });
      expect(response.body.data.createEmployee).toHaveProperty('id');
    });
    ```

### 3. Recommended Tools
*   **Jest**: The "Engine" that runs your tests.
*   **Supertest**: The "Hand" that sends requests to your API.
*   **Apollo Server Testing**: Specialized tool for testing GraphQL schemas.
*   **Mongodb-Memory-Server**: A "Fake Pantry" (Database) that clears itself after every test so your real data stays clean.

### 4. Why Test?
*   **Confidence**: You can refactor code without fear.
*   **Documentation**: Tests show other developers how your code is *supposed* to work.
*   **Speed**: Catching a bug in a test takes 1 minute; catching it in production takes 1 day.

---

## 10. Logging and Monitoring

Once your HRMS is live, you need "eyes and ears" to know what's happening when you aren't looking.

### 1. What to Log (The Three Pillars)
*   **Errors**: Every time a GraphQL request fails, record the error message and the "Stack Trace" (the file/line where it broke).
*   **Audit Logs**: Record "Who did what and when." 
    *   Example: *"Admin Aditya approved Leave Request #501 at 10:45 AM."*
*   **Performance Logs**: Record how long the "Chef" takes to cook.
    *   Example: *"Employee List query took 450ms."*

### 2. Where to Store Logs
*   **Development**: Console (Standard Output).
*   **Production**: 
    *   **Files**: Save logs to `.log` files on the server using **Winston**.
    *   **Cloud Tools**: Tools like **Datadog** or **LogDNA** that let you search through thousands of logs instantly.

### 3. Tracking Errors in Production
Don't wait for a user to call you saying *"The screen is blank!"*
*   **Tool**: **Sentry**.
*   **How it works**: If an error occurs in the Backend OR Frontend, Sentry immediately sends you an email with the exact line of code that failed and which user was affected.

### 4. Monitoring Server Health
*   **Health Checks**: A simple API endpoint like `/api/health` that returns "OK." Monitoring tools call this every 30 seconds. If it stops responding, you get an alert.
*   **Dashboard Tools**: Tools like **New Relic** show you live charts of CPU usage, Memory usage, and how many people are using your app right now.

### 5. Why do this?
*   **Proactive**: Fix bugs before the user even notices.
*   **Security**: See if someone is trying to "guess" passwords (many failed login logs).
*   **Historical Proof**: If a manager says "I didn't reject that leave," the Audit Log will show the truth.

---

## 11. Deployment and Continuous Operation

Deployment is the process of moving your code from your laptop to a "Live Server" where the whole world can use it.

### 1. How to Deploy
*   **Backend (Node.js)**: 
    *   Deploy to a service like **Render**, **Railway**, or **AWS**.
    *   Use **PM2**: A tool that keeps your server running 24/7. If the server crashes, PM2 automatically restarts it in milliseconds.
*   **Frontend (React)**: 
    *   Deploy to **Vercel** or **Netlify**.
    *   These services "Build" your project into fast, static files and serve them from "Edge" locations close to your users.

### 2. Environment Variables (.env)
Never put passwords or college secret keys directly in your code!
*   **What they are**: A secret list of settings (like `DATABASE_URL` or `ADMIN_PASSWORD`) stored on the server.
*   **How it works**: Your code says `process.env.DATABASE_URL`. The server provides the real value. This keeps your secrets safe even if someone looks at your code on GitHub.

### 3. CI/CD (The "Automated Robot")
*   **CI (Continuous Integration)**: Every time you save code to GitHub, a "Robot" automatically runs all your **Tests**. If a test fails, it stops you from breaking the live site.
*   **CD (Continuous Deployment)**: If the tests pass, the same Robot automatically pushes the new code to the live server. No manual work needed!

### 4. Safe Updates (Zero-Downtime)
*   **Problem**: Usually, if you update the server, it has to turn off for a few seconds. 
*   **Solution**: **Blue-Green Deployment**. The Robot starts the *New* server while the *Old* one is still running. Once the New one is ready, it instantly switches all users over. Users never see a "Loading" or "Error" page during an update.

### 5. Summary Checklist for a Professional Launch:
1.  **GitHub**: Secure your code.
2.  **Env Variables**: Hide your secrets.
3.  **CI/CD**: Automate your testing and deployment.
4.  **Monitoring**: (From Section 10) Watch for errors live.

---

## 12. Real-World Edge Cases & Solutions

In a real company, things don't always go perfectly. Here is how to handle "Edge Cases" like a senior engineer.

### 1. The "Negative Balance" Trap
*   **The Scenario**: An employee has 1 day of leave left. They quickly click "Submit" twice, or two different managers approve two different requests at the same time.
*   **The Risk**: The balance becomes `-1`.
*   **The Solution**: Use **Conditional Updates**. In your `service.js`, tell MongoDB: "Only subtract the leave *if* the current balance is greater than or equal to the requested days."
    ```javascript
    // Better Update Logic
    await LeaveBalance.updateOne(
      { _id: bal._id, balance: { $gte: requestedDays } }, // Condition
      { $inc: { used: requestedDays, balance: -requestedDays } }
    );
    ```

### 2. The "Half-Finished" Operation (Database Failure)
*   **The Scenario**: You are approving a leave. The system updates the `Leave` status to "Approved," but just before it can subtract the balance, the power goes out or the database crashes.
*   **The Risk**: The employee got their leave approved but kept their full balance (Free leaves!).
*   **The Solution**: **ACID Transactions**. Wrap both operations in a "Session." If the second part fails, the first part is automatically "undone" by MongoDB so the data stays consistent.

### 3. The "Ghost Employee" Deletion
*   **The Scenario**: An HR admin deletes an employee who still has 50 pending payslips and 10 approved leaves in the system.
*   **The Risk**: You have "orphaned" data. Your reports will crash because they try to find an employee that no longer exists.
*   **The Solution**: 
    *   **Option A (Hard Delete)**: Automatically delete all their leaves/attendance when the employee is deleted.
    *   **Option B (Soft Delete)**: Instead of deleting, just set `is_active: false`. This keeps the history safe for your records. (Already implemented in all Master Data models like Departments and Designations).

### 4. The Midnight Shift Problem
*   **The Scenario**: An employee clocks in at 10 PM on Monday and clocks out at 6 AM on Tuesday.
*   **The Risk**: Does the attendance count for Monday or Tuesday? Does it show as "Absent" for Tuesday?
*   **The Solution**: Use **Shift-ID** or **Fixed Cut-off Times**. Define that any clock-out before 8 AM belongs to the previous day's shift.

---
*Last Updated: March 2026*
