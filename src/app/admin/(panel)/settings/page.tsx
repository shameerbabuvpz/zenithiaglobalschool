import { getSiteSettings } from "@/lib/data";
import { updateSettingsAction } from "@/lib/actions";
import ImageField from "@/components/admin/ImageField";

export const dynamic = "force-dynamic";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  textarea,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {textarea ? (
        <textarea id={name} name={name} rows={rows} defaultValue={defaultValue} placeholder={placeholder} className="input" />
      ) : (
        <input id={name} name={name} defaultValue={defaultValue} placeholder={placeholder} className="input" />
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const s = await getSiteSettings();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">Site Content</h1>
      <p className="mt-1 text-sm text-ink/60">
        Edit the main text, contact details and images shown across the website.
      </p>

      {searchParams.saved && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          ✅ Changes saved successfully.
        </p>
      )}

      <form action={updateSettingsAction} className="mt-6 space-y-6">
        <Card title="General">
          <Field label="School name" name="schoolName" defaultValue={s.schoolName} />
          <Field label="Tagline" name="tagline" defaultValue={s.tagline} />
        </Card>

        <Card title="Hero (home top section)">
          <Field label="Hero title" name="heroTitle" defaultValue={s.heroTitle} textarea rows={2} />
          <Field label="Hero subtitle" name="heroSubtitle" defaultValue={s.heroSubtitle} textarea rows={2} />
          <ImageField
            label="Hero / About image"
            fileName="heroImageFile"
            currentName="currentHeroImageUrl"
            currentUrl={s.heroImageUrl}
          />
        </Card>

        <Card title="About, Vision & Mission">
          <Field label="About title" name="aboutTitle" defaultValue={s.aboutTitle} />
          <Field label="About body" name="aboutBody" defaultValue={s.aboutBody} textarea rows={5} placeholder="Tell your school's story. Use blank lines to separate paragraphs." />
          <Field label="Vision" name="visionBody" defaultValue={s.visionBody} textarea rows={3} />
          <Field label="Mission" name="missionBody" defaultValue={s.missionBody} textarea rows={3} />
        </Card>

        <Card title="Statistics (home highlights)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Students" name="statStudents" defaultValue={s.statStudents} />
            <Field label="Teachers" name="statTeachers" defaultValue={s.statTeachers} />
            <Field label="Years of excellence" name="statYears" defaultValue={s.statYears} />
            <Field label="Awards" name="statAwards" defaultValue={s.statAwards} />
          </div>
        </Card>

        <Card title="Contact details">
          <Field label="Address" name="address" defaultValue={s.address} textarea rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" name="phone" defaultValue={s.phone} />
            <Field label="Email" name="email" defaultValue={s.email} />
            <Field label="WhatsApp number" name="whatsapp" defaultValue={s.whatsapp} placeholder="+91..." />
          </div>
          <Field
            label="Google Maps embed code"
            name="mapEmbed"
            defaultValue={s.mapEmbed}
            textarea
            rows={3}
            placeholder='Paste the <iframe ...> embed code from Google Maps > Share > Embed a map'
          />
        </Card>

        <Card title="Social links">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Facebook URL" name="facebook" defaultValue={s.facebook} />
            <Field label="Instagram URL" name="instagram" defaultValue={s.instagram} />
            <Field label="YouTube URL" name="youtube" defaultValue={s.youtube} />
            <Field label="Twitter / X URL" name="twitter" defaultValue={s.twitter} />
          </div>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <button type="submit" className="btn-primary shadow-lg">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
