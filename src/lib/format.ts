export function formatPrice(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** USD → KHR conversion rate. Prices are stored in USD; KHR is a display-only conversion. */
export const KHR_RATE = 4100

export function formatKHR(usdValue: number) {
  const khr = Math.round(usdValue * KHR_RATE)
  return `៛${khr.toLocaleString("en-US")}`
}

export function discountPercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}
