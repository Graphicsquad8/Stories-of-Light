import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md p-12 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-serif text-3xl font-bold mb-3" data-testid="text-404-title">Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you are looking for does not exist or has been moved.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">Return Home</Button>
          </Link>
        </Card>
      </div>
    </PublicLayout>
  );
}
