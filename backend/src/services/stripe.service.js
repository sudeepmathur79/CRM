const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw Object.assign(new Error('Stripe not configured'), { status: 503 });
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10',
    timeout: 10000,
  });
}

async function getOrCreateCustomer(org, adminEmail) {
  const stripe = getStripe();
  if (org.stripeCustomerId) {
    return stripe.customers.retrieve(org.stripeCustomerId);
  }
  const customer = await stripe.customers.create({
    email: adminEmail,
    metadata: { orgId: org.id },
  });
  await prisma.organisation.update({
    where: { id: org.id },
    data: { stripeCustomerId: customer.id },
  });
  console.log(`[stripe] Created customer for orgId=${org.id} customerId=${customer.id}`);
  return customer;
}

async function createCheckoutSession(org, adminEmail, priceId, successUrl, returnUrl) {
  const stripe = getStripe();
  const targetPriceId = priceId || process.env.STRIPE_PRO_PRICE_ID;
  if (!targetPriceId) throw Object.assign(new Error('Stripe price ID not configured'), { status: 503 });

  const customer = await getOrCreateCustomer(org, adminEmail);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customer.id,
    line_items: [{ price: targetPriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: returnUrl,
    metadata: { orgId: org.id },
  });

  console.log(`[stripe] Checkout session created orgId=${org.id} sessionId=${session.id}`);
  return { url: session.url };
}

async function createPortalSession(org, returnUrl) {
  const stripe = getStripe();
  if (!org.stripeCustomerId) {
    throw Object.assign(new Error('No billing account found. Please subscribe first.'), { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });

  console.log(`[stripe] Portal session created orgId=${org.id}`);
  return { url: session.url };
}

async function handleWebhook(rawBody, sig) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw Object.assign(new Error('Webhook secret not configured'), { status: 503 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    throw Object.assign(new Error(`Webhook signature invalid: ${err.message}`), { status: 400 });
  }

  console.log(`[stripe] Webhook event=${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orgId = session.metadata?.orgId;
      if (!orgId) break;
      const subId = session.subscription;
      await prisma.organisation.update({
        where: { id: orgId },
        data: { plan: 'pro', stripeSubId: subId, planExpiresAt: null },
      });
      console.log(`[stripe] Org upgraded to pro orgId=${orgId}`);
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object;
      // Find org by customer ID — no PII in logs
      const org = await prisma.organisation.findFirst({
        where: { stripeCustomerId: sub.customer },
      });
      if (!org) break;
      const isActive = sub.status === 'active' || sub.status === 'trialing';
      const expiresAt = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null;
      await prisma.organisation.update({
        where: { id: org.id },
        data: {
          plan: isActive ? 'pro' : 'free',
          stripeSubId: sub.id,
          planExpiresAt: expiresAt,
        },
      });
      console.log(`[stripe] Subscription updated orgId=${org.id} status=${sub.status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const org = await prisma.organisation.findFirst({
        where: { stripeCustomerId: sub.customer },
      });
      if (!org) break;
      await prisma.organisation.update({
        where: { id: org.id },
        data: { plan: 'free', stripeSubId: null, planExpiresAt: null },
      });
      console.log(`[stripe] Subscription cancelled orgId=${org.id}`);
      break;
    }

    default:
      break;
  }

  return { received: true };
}

module.exports = { getOrCreateCustomer, createCheckoutSession, createPortalSession, handleWebhook };
