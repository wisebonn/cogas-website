// Centralised image paths — maps friendly names to /public/img files
export const IMG = {
  heroField: '/img/hero-field.jpg',
  heroFieldFallback: '/img/field-rows.svg',
  tractorField: '/img/tractor-field.jpg',
  sproutCoins: '/img/sprout-coins.jpg',
  seedlingsCoins: '/img/seedlings-coins.jpg',
  greenhouse: '/img/greenhouse.jpg',
  hexWheat: '/img/hex-wheat.jpg',
  valueChain: '/img/value-chain.jpg',
  moneyBag: '/img/money-bag.jpg',
  hexGrid: '/img/hex-grid.svg',
  fieldRows: '/img/field-rows.svg',
} as const;

export type ImageKey = keyof typeof IMG;