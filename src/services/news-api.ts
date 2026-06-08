export interface NewsArticle {
  externalId: string;
  title: string;
  summary: string | null;
  url: string | null;
}

interface NewsApiResponse {
  status: string;
  articles?: Array<{
    title: string;
    description: string | null;
    url: string;
    publishedAt: string;
  }>;
  message?: string;
}

export async function fetchNewsForKeywords(
  keywords: string[]
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    console.warn("[NewsAPI] NEWSAPI_KEY not set — skipping news fetch");
    return [];
  }

  const query = keywords.join(" OR ");
  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "20");
  url.searchParams.set("language", "en");

  const response = await fetch(url.toString(), {
    headers: { "X-Api-Key": apiKey },
  });

  const data = (await response.json()) as NewsApiResponse;

  if (!response.ok || data.status !== "ok") {
    throw new Error(data.message ?? `NewsAPI error: ${response.status}`);
  }

  return (data.articles ?? []).map((article) => ({
    externalId: article.url,
    title: article.title,
    summary: article.description,
    url: article.url,
  }));
}
