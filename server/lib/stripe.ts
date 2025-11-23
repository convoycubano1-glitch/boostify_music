import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const PLATFORM_FEE_PERCENTAGE = 20; // 20% for Boostify, 80% for artist

export function calculatePaymentAmounts(totalAmount: number) {
  const platformAmount = Math.round(totalAmount * (PLATFORM_FEE_PERCENTAGE / 100));
  const artistAmount = totalAmount - platformAmount;

  return {
    totalAmount,
    platformAmount,
    artistAmount,
    platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
  };
}

export async function createPaymentIntent(
  amount: number,
  description: string,
  clientEmail?: string
) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // Already in cents
    currency: "usd",
    description,
    ...(clientEmail && { receipt_email: clientEmail }),
  });

  return paymentIntent;
}

export async function confirmPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return paymentIntent;
}

export async function createConnectAccount(
  artistEmail: string,
  displayName: string
) {
  const account = await stripe.accounts.create({
    type: "express",
    email: artistEmail,
    business_profile: {
      name: displayName,
      product_category: "music_production",
    },
  });

  return account;
}

export async function createAccountLink(accountId: string, refreshUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: refreshUrl,
    return_url: refreshUrl,
  });

  return accountLink;
}

export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  description: string
) {
  const transfer = await stripe.transfers.create({
    amount, // In cents
    currency: "usd",
    destination: destinationAccountId,
    description,
  });

  return transfer;
}

export async function getAccountBalance(accountId: string) {
  const balance = await stripe.balance.retrieve(
    {},
    {
      stripeAccount: accountId,
    }
  );

  return balance;
}
