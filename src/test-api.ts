import { api } from "./lib/api";

async function testAPI() {
  try {
    console.log("Testing login...");
    const loginResponse = await api.login("sr@conversate.us", "Demo123456!");
    console.log("Login successful:", loginResponse);

    console.log("Accounts:", loginResponse.data.data.accounts);
    const account = loginResponse.data.data.accounts.find(
      (account) => account.name === "Conversate Sales Demo Account",
    );
    if (!account) {
      throw new Error("Could not find Conversate Sales Demo Account");
    }
    console.log("Using account:", account);

    console.log("\nTesting getInboxes...");
    let inboxes = await api.getInboxes(account.id);
    console.log("Inboxes:", inboxes);

    if (!inboxes || inboxes.length === 0) {
      console.log("No inboxes found - creating one...");
      const inbox = await api.createInbox(account.id, "Import Test Inbox");
      console.log("Created inbox:", inbox);
      inboxes = [inbox];
    }

    console.log("\nTesting createContact...");

    // Test creating a contact with a random phone number (should succeed)
    const contact1 = {
      inbox_id: inboxes[0].id,
      name: "Test Contact 1",
      email: "test1@example.com",
      phone_number: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      custom_attributes: {
        source: "API Test",
        test_date: new Date().toISOString(),
      },
    };
    const result1 = await api.createContact(account.id, contact1);
    console.log("Create contact result 1:", result1);

    // Test creating a contact with the same phone number (should fail)
    const contact2 = {
      ...contact1,
      name: "Test Contact 2",
      email: "test2@example.com",
    };
    const result2 = await api.createContact(account.id, contact2);
    console.log("Create contact result 2:", result2);

    // Test creating a contact with the same email (should fail)
    const contact3 = {
      inbox_id: inboxes[0].id,
      name: "Test Contact 3",
      email: "test1@example.com", // Same as contact1
      phone_number: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      custom_attributes: {
        source: "API Test",
        test_date: new Date().toISOString(),
      },
    };
    const result3 = await api.createContact(account.id, contact3);
    console.log("Create contact result 3:", result3);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testAPI();
