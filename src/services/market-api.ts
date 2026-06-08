import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export interface MarketMovement {
  externalId: string;
  title: string;
  summary: string | null;
  url: string | null;
  percentChange: number;
}

export async function checkMarketMovement(
  ticker: string,
  threshold: number
): Promise<MarketMovement | null> {
  const symbol = ticker.toUpperCase();
  const quote = await yahooFinance.quote(symbol);

  const price = quote.regularMarketPrice;
  const changePercent = quote.regularMarketChangePercent;

  if (price == null || changePercent == null) {
    return null;
  }

  const absChange = Math.abs(changePercent);
  if (absChange < threshold) {
    return null;
  }

  const direction = changePercent >= 0 ? "up" : "down";
  const timestamp = quote.regularMarketTime
    ? new Date(quote.regularMarketTime).toISOString()
    : new Date().toISOString();

  return {
    externalId: `${symbol}:${timestamp}`,
    title: `${symbol} moved ${changePercent.toFixed(2)}% (${direction})`,
    summary: `Price: $${price.toFixed(2)}. Threshold: ${threshold}%`,
    url: `https://finance.yahoo.com/quote/${symbol}`,
    percentChange: changePercent,
  };
}
