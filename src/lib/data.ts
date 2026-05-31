import { prisma } from "./prisma";
import type { SiteSetting } from "@prisma/client";

export const SETTINGS_ID = 1;

/** Always returns a settings row, creating defaults on first run. */
export async function getSiteSettings(): Promise<SiteSetting> {
  const existing = await prisma.siteSetting.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing;
  return prisma.siteSetting.create({ data: { id: SETTINGS_ID } });
}

export async function getFacilities(onlyPublished = true) {
  return prisma.facility.findMany({
    where: onlyPublished ? { published: true } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getFeatures(onlyPublished = true) {
  return prisma.feature.findMany({
    where: onlyPublished ? { published: true } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getGallery(onlyPublished = true) {
  return prisma.galleryImage.findMany({
    where: onlyPublished ? { published: true } : undefined,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
}

export async function getPrograms(onlyPublished = true) {
  return prisma.program.findMany({
    where: onlyPublished ? { published: true } : undefined,
    orderBy: [{ date: "asc" }, { createdAt: "desc" }],
  });
}
