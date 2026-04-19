import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-12-18.acacia"
});

export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
  annual: process.env.STRIPE_PRICE_ANNUAL ?? ""
};

export const FREE_VERDICTS_PER_MONTH = 3;
