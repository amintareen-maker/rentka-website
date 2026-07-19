import { ReactNode } from "react";

export interface ArticleSection {
  id: string;
  heading: string;
  content: ReactNode[];
}

export interface FAQ {
  question: ReactNode;
  answer: ReactNode;
}

export interface ArticleContent {
  introduction: ReactNode;
  sections: ArticleSection[];
  faq: FAQ[];
}

export interface Article {
  slug: string;
  category: string;
  title: string;
  description: string;
  image: string;
  accent: string;
  author: string;
  date: string;
  readTime: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
}