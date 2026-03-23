import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/public-layout";
import { Skeleton } from "@/components/ui/skeleton";
import type { FooterPage } from "@shared/schema";

export default function FooterPageView() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useQuery<FooterPage>({
    queryKey: ["/api/footer-pages", slug],
    queryFn: async () => {
      const res = await fetch(`/api/footer-pages/${slug}`);
      if (!res.ok) throw new Error("Page not found");
      return res.json();
    },
    enabled: !!slug,
  });

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
        {isError && (
          <div className="text-center py-16">
            <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        )}
        {page && (
          <article>
            <h1 className="text-3xl font-serif font-bold mb-8">{page.title}</h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed">
              {(page.content ?? "").split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="mb-4">{para}</p>
              ))}
            </div>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
