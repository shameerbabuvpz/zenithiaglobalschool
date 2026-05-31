import { prisma } from "@/lib/prisma";
import { toggleMessageReadAction, deleteMessageAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">Messages</h1>
      <p className="mt-1 text-sm text-ink/60">
        Enquiries submitted through the contact form. {messages.length} total.
      </p>

      <div className="mt-6 space-y-4">
        {messages.length === 0 && (
          <p className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-ink/50">
            No messages yet.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border p-5 shadow-sm ${
              m.read ? "border-black/5 bg-white" : "border-brand/20 bg-brand-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-ink">{m.name}</h3>
                  {!m.read && (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">New</span>
                  )}
                </div>
                <p className="text-sm text-ink/60">
                  <a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>
                  {m.phone ? ` · ${m.phone}` : ""}
                </p>
                {m.subject && (
                  <p className="mt-1 text-sm font-medium text-ink">Subject: {m.subject}</p>
                )}
              </div>
              <span className="whitespace-nowrap text-xs text-ink/45">
                {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-ink/75">{m.message}</p>
            <div className="mt-4 flex items-center gap-3">
              <form action={toggleMessageReadAction}>
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="read" value={m.read ? "false" : "true"} />
                <button className="text-sm font-medium text-brand hover:underline">
                  {m.read ? "Mark as unread" : "Mark as read"}
                </button>
              </form>
              <form action={deleteMessageAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-sm text-red-600 hover:underline">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
