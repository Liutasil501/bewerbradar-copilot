export const STRIPE_CONFIG = {
  // Replace these with actual Price IDs from the Stripe Dashboard
  prices: {
    pro: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || 'price_1TcOg0D0cevOfghZBZMitg30',
      yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || 'price_1TcOg6D0cevOfghZ8bc5Q4PJ',
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY || 'price_1TcOgBD0cevOfghZo1XlQcjO',
      yearly: process.env.STRIPE_PRICE_ID_PREMIUM_YEARLY || 'price_1TcOgFD0cevOfghZnDIGi73j',
    }
  },
  // Optional: Coupon ID for a first-month discount if you still want to offer it on Premium
  coupons: {
    firstMonthDiscount: process.env.STRIPE_COUPON_FIRST_MONTH || '',
  }
};
