export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
  description?: string;
  processing?: boolean;
}

export interface NewsItemUpdate {
  index: number;
  item: NewsItem;
}

export interface NewsData {
  items: NewsItem[];
  lastUpdate: string;
}
