const Stripe = require('stripe');
const stripe = Stripe('process.env.STRIPE_SECRET_KEY');

async function main() {
  try {
    const starterProduct = await stripe.products.create({
      name: 'Starter Plan',
      description: 'Ideal para freelancers empezando',
    });
    
    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 19900, // 199.00
      currency: 'mxn',
      recurring: { interval: 'month' },
    });

    const proProduct = await stripe.products.create({
      name: 'Pro Plan',
      description: 'Para profesionales con alto volumen',
    });
    
    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 49900, // 499.00
      currency: 'mxn',
      recurring: { interval: 'month' },
    });

    console.log('STRIPE_PRICE_STARTER=' + starterPrice.id);
    console.log('STRIPE_PRICE_PRO=' + proPrice.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
