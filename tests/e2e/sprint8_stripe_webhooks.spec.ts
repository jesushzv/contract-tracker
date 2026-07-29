import { test, expect } from "@playwright/test";

test.describe("Sprint 8: Stripe Webhooks Suite", () => {
  test("should process checkout.session.completed webhook", async ({ request }) => {
    const mockPayload = {
      id: "evt_test_123",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          customer: "cus_test_123",
          subscription: "sub_test_123",
          metadata: {
            userId: "demo-freelancer-uuid",
            tier: "starter",
          },
          customer_details: {
            email: "monetization-test@example.com",
            name: "Héctor J. Guerrero",
          },
        },
      },
    };

    const response = await request.post("/api/webhooks/stripe", {
      data: JSON.stringify(mockPayload),
      headers: {
        "stripe-signature": "test_signature",
        "x-e2e-bypass": "true",
      },
    });

    // In E2E environment, the signature verification is bypassed, so it should succeed.
    if (!response.ok()) {
      console.log(await response.json());
    }
    expect(response.ok()).toBeTruthy();
  });
});
