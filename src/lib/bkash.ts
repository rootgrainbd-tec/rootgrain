import prisma from "./prisma";

const BKASH_BASE_URL = process.env.BKASH_BASE_URL!;
const BKASH_APP_KEY = process.env.BKASH_APP_KEY!;
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET!;
const BKASH_USERNAME = process.env.BKASH_USERNAME!;
const BKASH_PASSWORD = process.env.BKASH_PASSWORD!;

/**
 * Ensures a valid bKash Auth Token using PostgreSQL caching.
 */
export async function getBkashToken(): Promise<string> {
  // 1. Check DB Cache
  const cached = await prisma.bkashToken.findUnique({
    where: { id: "bkash_singleton" },
  });

  // If token exists and has more than 5 minutes until expiration
  if (cached && cached.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return cached.id_token;
  }

  // 2. Fetch New Token
  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: BKASH_USERNAME,
      password: BKASH_PASSWORD,
    },
    body: JSON.stringify({
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to grant bKash token");
  }

  const data = await res.json();
  
  if (data.statusCode !== "0000") {
    throw new Error(`bKash Token Error: ${data.statusMessage}`);
  }

  // Expires in usually 3600s, let's parse from response
  const expiresInMs = (data.expires_in || 3600) * 1000;
  
  // 3. Update DB Cache
  await prisma.bkashToken.upsert({
    where: { id: "bkash_singleton" },
    update: {
      id_token: data.id_token,
      expiresAt: new Date(Date.now() + expiresInMs),
    },
    create: {
      id: "bkash_singleton",
      id_token: data.id_token,
      expiresAt: new Date(Date.now() + expiresInMs),
    },
  });

  return data.id_token;
}

/**
 * Creates a bKash Payment URL for the user to visit.
 * @param amount The amount in BDT (String format, e.g. "20000.00")
 * @param orderId Our internal Order ID
 */
export async function createBkashPayment(amount: string, orderId: string) {
  const token = await getBkashToken();

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
      "x-app-key": BKASH_APP_KEY,
    },
    body: JSON.stringify({
      mode: "0011",
      payerReference: "RootGrain",
      callbackURL: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/bkash/callback`,
      amount,
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: orderId,
    }),
  });

  const data = await res.json();

  if (data.statusCode !== "0000") {
    throw new Error(`bKash Create Payment Error: ${data.statusMessage}`);
  }

  // Returns bkashURL and paymentID
  return data;
}

/**
 * Executes the payment after the user is redirected back.
 */
export async function executeBkashPayment(paymentID: string) {
  const token = await getBkashToken();

  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
      "x-app-key": BKASH_APP_KEY,
    },
    body: JSON.stringify({ paymentID }),
  });

  const data = await res.json();
  
  // 0000 = Successful
  // 2023 = Insufficient Balance
  return data;
}
