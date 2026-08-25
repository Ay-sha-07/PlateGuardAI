import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, ExternalLink, Sparkles } from "lucide-react";
import { NEWS_ARTICLES } from "@/lib/news";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Health news & AI insights — PlateGuard AI" },
      {
        name: "description",
        content: "Curated, plain-English health and nutrition reads on label literacy.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-24 pt-6">
        <header className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link to="/home">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Health news &amp; AI insights</h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Tailored to your profile
            </p>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {NEWS_ARTICLES.map((a) => (
            <a
              key={a.slug}
              href={a.url}
              target={a.url === "#" ? undefined : "_blank"}
              rel={a.url === "#" ? undefined : "noopener noreferrer"}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card/80 transition-transform active:scale-[0.99]"
            >
              <img src={a.image} alt="" className="h-36 w-full object-cover" />
              <div className="flex flex-1 flex-col p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {a.tag}
                </span>
                <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                  {a.title}
                </p>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{a.excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    {a.readMinutes} min · {a.source}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary">
                    Read
                    <ExternalLink className="size-3" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
