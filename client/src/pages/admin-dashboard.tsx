import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, FileEdit, FolderOpen, Plus, Clock } from "lucide-react";
import type { StoryWithCategory } from "@shared/schema";
import { format } from "date-fns";

interface Stats {
  total: number;
  published: number;
  drafts: number;
  categories: number;
}

function StatsCards({ stats, isLoading }: { stats?: Stats; isLoading: boolean }) {
  const cards = [
    { label: "Total Stories", value: stats?.total ?? 0, icon: FileText, color: "text-primary" },
    { label: "Published", value: stats?.published ?? 0, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Drafts", value: stats?.drafts ?? 0, icon: FileEdit, color: "text-amber-600 dark:text-amber-400" },
    { label: "Categories", value: stats?.categories ?? 0, icon: FolderOpen, color: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-5" data-testid={`card-stat-${card.label.toLowerCase().replace(" ", "-")}`}>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 mb-3">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
            </>
          )}
        </Card>
      ))}
    </div>
  );
}

function RecentStoriesTable({ stories, isLoading }: { stories?: StoryWithCategory[]; isLoading: boolean }) {
  return (
    <Card className="mt-8" data-testid="card-recent-stories">
      <div className="flex items-center justify-between gap-4 p-5 border-b">
        <h2 className="font-semibold text-lg">Recent Stories</h2>
        <Link href="/image/stories/new">
          <Button size="sm" data-testid="button-new-story-quick">
            <Plus className="w-4 h-4 mr-1" />
            New Story
          </Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="table-recent-stories">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Title</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">Category</th>
              <th className="text-left p-3 font-medium hidden md:table-cell">Status</th>
              <th className="text-left p-3 font-medium hidden lg:table-cell">Date</th>
              <th className="text-right p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="p-3 hidden sm:table-cell"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
                  <td className="p-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3 text-right"><Skeleton className="h-8 w-12 ml-auto" /></td>
                </tr>
              ))
            ) : stories && stories.length > 0 ? (
              stories.map((story) => (
                <tr key={story.id} className="border-b" data-testid={`row-story-${story.id}`}>
                  <td className="p-3">
                    <span className="font-medium line-clamp-1">{story.title}</span>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    {story.category ? (
                      <Badge variant="secondary">{story.category.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge variant={story.status === "published" ? "default" : "secondary"}>
                      {story.status}
                    </Badge>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {story.createdAt ? format(new Date(story.createdAt), "MMM d") : "-"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/image/stories/${story.id}/edit`}>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${story.id}`}>
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No stories yet. Create your first story to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stories/stats"],
  });

  const { data: recentStories, isLoading: storiesLoading } = useQuery<StoryWithCategory[]>({
    queryKey: ["/api/stories?limit=5"],
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to Stories of Light admin panel</p>
      </div>
      <StatsCards stats={stats} isLoading={statsLoading} />
      <RecentStoriesTable stories={recentStories} isLoading={storiesLoading} />
    </AdminLayout>
  );
}
