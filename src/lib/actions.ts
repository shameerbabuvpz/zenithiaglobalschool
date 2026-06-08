"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import {
  verifyPin,
  setAdminPin,
  isValidPin,
  DEFAULT_PIN,
  createSession,
  destroySession,
  getSession,
} from "./auth";
import { saveUploadedImage, deleteUploadedImage, isUploadedFile } from "./upload";
import { SETTINGS_ID } from "./data";

async function assertAuthed() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

function int(formData: FormData, key: string, fallback = 0): number {
  const n = parseInt(str(formData, key), 10);
  return Number.isNaN(n) ? fallback : n;
}

/**
 * Resolve an image URL for a record: if a new file is uploaded, store it and
 * delete the previous managed file; otherwise keep the existing URL.
 */
async function resolveImage(
  formData: FormData,
  fileKey = "imageFile",
  currentKey = "currentImageUrl",
): Promise<string | null> {
  const file = formData.get(fileKey);
  const current = str(formData, currentKey) || null;

  if (isUploadedFile(file) && file.size > 0) {
    const saved = await saveUploadedImage(file);
    if (current) await deleteUploadedImage(current);
    return saved.url;
  }
  return current;
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

/* ----------------------------- Auth ----------------------------- */

export async function loginAction(formData: FormData) {
  const pin = str(formData, "pin");
  const user = await verifyPin(pin);
  if (!user) {
    redirect("/admin/login?error=1");
  }
  await createSession({ uid: user.id, email: user.email, name: user.name });
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

/** Change the admin login PIN to a new 6-digit value. */
export async function changePinAction(formData: FormData) {
  await assertAuthed();
  const pin = str(formData, "newPin");
  const confirm = str(formData, "confirmPin");
  if (!isValidPin(pin)) {
    redirect("/admin/settings?pin=invalid");
  }
  if (pin !== confirm) {
    redirect("/admin/settings?pin=mismatch");
  }
  await setAdminPin(pin);
  redirect("/admin/settings?pin=changed");
}

/** Reset the admin login PIN back to the default (345678). */
export async function resetPinAction() {
  await assertAuthed();
  await setAdminPin(DEFAULT_PIN);
  redirect("/admin/settings?pin=reset");
}

/* --------------------------- Settings --------------------------- */

export async function updateSettingsAction(formData: FormData) {
  await assertAuthed();
  const heroImageUrl = await resolveImage(
    formData,
    "heroImageFile",
    "currentHeroImageUrl",
  );

  await prisma.siteSetting.upsert({
    where: { id: SETTINGS_ID },
    update: {
      schoolName: str(formData, "schoolName"),
      tagline: str(formData, "tagline"),
      heroTitle: str(formData, "heroTitle"),
      heroSubtitle: str(formData, "heroSubtitle"),
      heroImageUrl,
      aboutTitle: str(formData, "aboutTitle"),
      aboutBody: str(formData, "aboutBody"),
      visionBody: str(formData, "visionBody"),
      missionBody: str(formData, "missionBody"),
      address: str(formData, "address"),
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      whatsapp: str(formData, "whatsapp"),
      mapEmbed: str(formData, "mapEmbed"),
      facebook: str(formData, "facebook"),
      instagram: str(formData, "instagram"),
      youtube: str(formData, "youtube"),
      twitter: str(formData, "twitter"),
      statStudents: str(formData, "statStudents"),
      statTeachers: str(formData, "statTeachers"),
      statYears: str(formData, "statYears"),
      statAwards: str(formData, "statAwards"),
    },
    create: { id: SETTINGS_ID },
  });

  revalidateAll();
  redirect("/admin/settings?saved=1");
}

/* --------------------------- Facilities --------------------------- */

export async function saveFacilityAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const imageUrl = await resolveImage(formData);
  const data = {
    title: str(formData, "title"),
    description: str(formData, "description"),
    icon: str(formData, "icon") || null,
    order: int(formData, "order"),
    published: bool(formData, "published"),
    imageUrl,
  };
  if (id) {
    await prisma.facility.update({ where: { id }, data });
  } else {
    await prisma.facility.create({ data });
  }
  revalidateAll();
  redirect("/admin/facilities");
}

export async function deleteFacilityAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const existing = await prisma.facility.findUnique({ where: { id } });
  if (existing) {
    await deleteUploadedImage(existing.imageUrl);
    await prisma.facility.delete({ where: { id } });
  }
  revalidateAll();
  redirect("/admin/facilities");
}

/* --------------------------- Features --------------------------- */

export async function saveFeatureAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const data = {
    title: str(formData, "title"),
    description: str(formData, "description"),
    icon: str(formData, "icon") || null,
    order: int(formData, "order"),
    published: bool(formData, "published"),
  };
  if (id) {
    await prisma.feature.update({ where: { id }, data });
  } else {
    await prisma.feature.create({ data });
  }
  revalidateAll();
  redirect("/admin/features");
}

export async function deleteFeatureAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  await prisma.feature.delete({ where: { id } }).catch(() => {});
  revalidateAll();
  redirect("/admin/features");
}

/* --------------------------- Gallery --------------------------- */

export async function saveGalleryAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const imageUrl = await resolveImage(formData);

  if (id) {
    await prisma.galleryImage.update({
      where: { id },
      data: {
        title: str(formData, "title"),
        category: str(formData, "category") || "Campus",
        order: int(formData, "order"),
        published: bool(formData, "published"),
        ...(imageUrl ? { imageUrl } : {}),
      },
    });
  } else {
    if (!imageUrl) {
      redirect("/admin/gallery?error=image");
    }
    await prisma.galleryImage.create({
      data: {
        title: str(formData, "title"),
        category: str(formData, "category") || "Campus",
        order: int(formData, "order"),
        published: bool(formData, "published"),
        imageUrl: imageUrl as string,
      },
    });
  }
  revalidateAll();
  redirect("/admin/gallery");
}

export async function deleteGalleryAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const existing = await prisma.galleryImage.findUnique({ where: { id } });
  if (existing) {
    await deleteUploadedImage(existing.imageUrl);
    await prisma.galleryImage.delete({ where: { id } });
  }
  revalidateAll();
  redirect("/admin/gallery");
}

/**
 * Create a gallery record from an already-uploaded image URL (e.g. a framed
 * program photo from the Photo Frame tool that was uploaded via /api/upload).
 * Takes a small payload so it stays well under the Server Action body limit.
 * Returns a result object instead of redirecting so it can be called from a
 * client component.
 */
export async function addImageToGalleryAction(
  imageUrl: string,
  title = "",
  category = "Events",
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!imageUrl) return { ok: false, error: "No image provided" };

  try {
    await prisma.galleryImage.create({
      data: {
        title: title.trim(),
        category: category.trim() || "Events",
        order: 0,
        published: true,
        imageUrl,
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not add to gallery";
    return { ok: false, error: msg };
  }
}

/* ----------------------- Report staff (signatures) ----------------------- */

export type ReportStaffDTO = { id: string; name: string; signature: string | null };

function toStaffDTO(s: { id: string; name: string; signatureUrl: string | null }): ReportStaffDTO {
  return { id: s.id, name: s.name, signature: s.signatureUrl };
}

/**
 * List the saved class-teacher and principal presets (name + signature image)
 * for the Progress Report tool. Stored in the database so they persist across
 * devices and browsers.
 */
export async function listReportStaffAction(): Promise<{
  teachers: ReportStaffDTO[];
  principals: ReportStaffDTO[];
}> {
  const session = await getSession();
  if (!session) return { teachers: [], principals: [] };
  const all = await prisma.reportStaff.findMany({ orderBy: { name: "asc" } });
  return {
    teachers: all.filter((s) => s.role === "teacher").map(toStaffDTO),
    principals: all.filter((s) => s.role === "principal").map(toStaffDTO),
  };
}

/**
 * Save (or update) a teacher/principal preset with their signature URL.
 * The signature image must already be uploaded via /api/upload. Presets are
 * de-duplicated by role + name (case-insensitive); re-saving the same name
 * replaces the record and removes the previous signature file.
 */
export async function saveReportStaffAction(
  role: "teacher" | "principal",
  name: string,
  signatureUrl: string | null,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (role !== "teacher" && role !== "principal") return { ok: false, error: "Invalid role" };
  const cleanName = name.trim();
  if (!cleanName) return { ok: false, error: "Enter a name first" };

  try {
    const existing = await prisma.reportStaff.findFirst({
      where: { role, name: { equals: cleanName, mode: "insensitive" } },
    });
    if (existing) {
      if (existing.signatureUrl && existing.signatureUrl !== signatureUrl) {
        await deleteUploadedImage(existing.signatureUrl);
      }
      const updated = await prisma.reportStaff.update({
        where: { id: existing.id },
        data: { name: cleanName, signatureUrl: signatureUrl || null },
      });
      revalidateAll();
      return { ok: true, id: updated.id };
    }
    const created = await prisma.reportStaff.create({
      data: { role, name: cleanName, signatureUrl: signatureUrl || null },
    });
    revalidateAll();
    return { ok: true, id: created.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not save";
    return { ok: false, error: msg };
  }
}

/** Delete a saved teacher/principal preset and its signature image. */
export async function deleteReportStaffAction(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  if (!id) return { ok: false, error: "No id provided" };
  try {
    const existing = await prisma.reportStaff.findUnique({ where: { id } });
    if (existing) {
      if (existing.signatureUrl) await deleteUploadedImage(existing.signatureUrl);
      await prisma.reportStaff.delete({ where: { id } });
    }
    revalidateAll();
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not delete";
    return { ok: false, error: msg };
  }
}

/* --------------------------- Programs --------------------------- */

export async function saveProgramAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const imageUrl = await resolveImage(formData);
  const dateStr = str(formData, "date");
  const data = {
    title: str(formData, "title"),
    description: str(formData, "description"),
    location: str(formData, "location"),
    date: dateStr ? new Date(dateStr) : null,
    published: bool(formData, "published"),
    imageUrl,
  };
  if (id) {
    await prisma.program.update({ where: { id }, data });
  } else {
    await prisma.program.create({ data });
  }
  revalidateAll();
  redirect("/admin/programs");
}

export async function deleteProgramAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const existing = await prisma.program.findUnique({ where: { id } });
  if (existing) {
    await deleteUploadedImage(existing.imageUrl);
    await prisma.program.delete({ where: { id } });
  }
  revalidateAll();
  redirect("/admin/programs");
}

/* --------------------------- Messages --------------------------- */

export async function toggleMessageReadAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  const read = bool(formData, "read");
  await prisma.contactMessage
    .update({ where: { id }, data: { read } })
    .catch(() => {});
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(formData: FormData) {
  await assertAuthed();
  const id = str(formData, "id");
  await prisma.contactMessage.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/messages");
  redirect("/admin/messages");
}
