import type { Metadata } from "next";

export const SITE_NAME = "Kah-Kashaan";
export const SITE_URL = process.env.APP_URL?.trim() || "https://kah-kashaan.in";
export const SITE_DESCRIPTION =
  "Kah-Kashaan is a literary and cultural community for poetry, shayari, kavi sammelan, mushaira, music, mentorship, workshops, open mics, writers, and literary publication.";
export const SITE_ALTERNATE_NAMES = ["Kah Kashaan", "KahKashaan", "Kah Kashan", "Kah-Kashan"];
export const SITE_KEYWORDS = [
  "Kah-Kashaan",
  "Kah Kashaan",
  "literary community",
  "literature events",
  "poetry events",
  "poetry open mic",
  "shayari open mic",
  "kavi sammelan",
  "kavi sammel",
  "mushaira",
  "poetry recital",
  "spoken word poetry",
  "writers community",
  "literary workshops",
  "creative writing workshops",
  "Nasihat mentorship",
  "Nasihat Kah-Kashaan",
  "Open Mic Kah-Kashaan",
  "Shabd Sangam",
  "Sangeet Sangam",
  "literary publication",
  "poetry publication",
  "writers publication opportunities",
  "cultural events",
];

export function getProgramKeywords(slug: string, title = ""): string[] {
  const normalized = `${slug} ${title}`.toLowerCase();
  const keywords = [...SITE_KEYWORDS];
  if (normalized.includes("nasihat")) keywords.push("Nasihat poetry mentorship", "poetry mentorship program");
  if (normalized.includes("open-mic") || normalized.includes("open mic")) {
    keywords.push("open mic night", "poetry open mic night", "shayari open mic night");
  }
  if (normalized.includes("shabd")) keywords.push("Shabd Sangam literary gathering", "Hindi poetry gathering");
  if (normalized.includes("sangeet")) keywords.push("Sangeet Sangam music gathering", "poetry and music events");
  if (normalized.includes("workshop")) keywords.push("poetry writing workshop", "ghazal writing workshop");
  return [...new Set(keywords)];
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata(
  title: string,
  description: string,
  path: string,
  image?: string,
  keywords: string[] = SITE_KEYWORDS,
): Metadata {
  const canonical = absoluteUrl(path);
  const imageUrl = image ? absoluteUrl(image) : undefined;
  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: title }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export function cleanDescription(value: string, fallback = SITE_DESCRIPTION): string {
  const description = value.replace(/\s+/g, " ").trim();
  return (description || fallback).slice(0, 160);
}