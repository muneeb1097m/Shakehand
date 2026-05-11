import { PageHeader } from "@/components/page-header";
import { Flame, ExternalLink, Sparkles } from "lucide-react";

export default function WarmupPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Warm-up"
        subtitle="Build sender reputation before launching cold campaigns"
      />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-50 border border-orange-100 mb-5">
            <Flame className="h-7 w-7 text-orange-500" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <Sparkles className="h-3 w-3 text-blue-600" />
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
              Coming Soon
            </span>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">
            Native warm-up is on the way
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-md mx-auto">
            We&apos;re building an in-platform warm-up engine so you can grow
            inbox reputation without leaving Shakehand. In the meantime, we
            recommend connecting your mailboxes to a trusted third-party
            service.
          </p>

          <div className="mt-7 p-5 rounded-xl bg-zinc-50 border border-zinc-100 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
                Recommended Provider
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  TrulyInbox
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Use TrulyInbox as your warm-up service for now &mdash; it
                  pairs cleanly with any mailbox connected here.
                </p>
              </div>
              <a
                href="https://trulyinbox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                Visit
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <p className="mt-6 text-[11px] text-zinc-400">
            You&apos;ll be notified here as soon as native warm-up is available.
          </p>
        </div>
      </div>
    </div>
  );
}
