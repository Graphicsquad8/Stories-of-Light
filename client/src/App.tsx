import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { useRealtime } from "@/hooks/use-realtime";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ViewAsProvider } from "@/lib/view-as";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import StoryPage from "@/pages/story";
import CategoryPage from "@/pages/category";
import SearchPage from "@/pages/search";
import BooksPage from "@/pages/books";
import BookDetailPage from "@/pages/book-detail";
import BookReaderPage from "@/pages/book-reader";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import ProfilePage from "@/pages/profile";
import DashboardPage from "@/pages/dashboard";
import BookmarksPage from "@/pages/bookmarks";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboardPage from "@/pages/admin-dashboard";
import AdminStoriesPage from "@/pages/admin-stories";
import AdminStoryEditorPage from "@/pages/admin-story-editor";
import AdminStoryManagePage from "@/pages/admin-story-manage";
import AdminCategoriesPage from "@/pages/admin-categories";
import AdminBooksPage from "@/pages/admin-books";
import AdminBookEditorPage from "@/pages/admin-book-editor";
import AdminSettingsPage from "@/pages/admin-settings";
import MotivationalStoriesPage from "@/pages/motivational-stories";
import MotivationalStoryDetailPage from "@/pages/motivational-story-detail";
import AdminMotivationalStoriesPage from "@/pages/admin-motivational-stories";
import AdminMotivationalStoryManagePage from "@/pages/admin-motivational-story-manage";
import AdminMotivationalStoryEditPage from "@/pages/admin-motivational-story-edit";
import AdminTrashPage from "@/pages/admin-trash";
import AdminUsersPage from "@/pages/admin-users";
import AdminModeratorsPage from "@/pages/admin-moderators";
import AdminFooterPage from "@/pages/admin-footer";
import FooterPageView from "@/pages/page";
import DuasPage from "@/pages/duas";
import DuaDetailPage from "@/pages/dua-detail";
import AdminDuasPage from "@/pages/admin-duas";
import AdminDuaEditorPage from "@/pages/admin-dua-editor";
import AdminDuaEditPage from "@/pages/admin-dua-edit";
import AdminBookEditPage from "@/pages/admin-book-edit";
import AdminOverviewPage from "@/pages/admin-overview";
import AdminHomePagePage from "@/pages/admin-home-page";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  useRealtime();
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/stories/:slug" component={StoryPage} />
      <Route path="/sahaba/:slug" component={StoryPage} />
      <Route path="/awliya/:slug" component={StoryPage} />
      <Route path="/history/:slug" component={StoryPage} />
      <Route path="/karamat/:slug" component={StoryPage} />
      <Route path="/prophets-companions/:slug" component={StoryPage} />
      <Route path="/category/:slug" component={CategoryPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/books" component={BooksPage} />
      <Route path="/books/:slug/read" component={BookReaderPage} />
      <Route path="/books/:slug" component={BookDetailPage} />
      <Route path="/motivational-stories" component={MotivationalStoriesPage} />
      <Route path="/motivational-stories/:slug" component={MotivationalStoryDetailPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/bookmarks" component={BookmarksPage} />
      <Route path="/image/login" component={AdminLoginPage} />
      <Route path="/image" component={AdminDashboardPage} />
      <Route path="/image/stories" component={AdminStoriesPage} />
      <Route path="/image/stories/category/:slug" component={AdminStoriesPage} />
      <Route path="/image/stories/new" component={AdminStoryEditorPage} />
      <Route path="/image/stories/:id/manage" component={AdminStoryManagePage} />
      <Route path="/image/stories/:id/edit" component={AdminStoryEditorPage} />
      <Route path="/image/categories" component={AdminCategoriesPage} />
      <Route path="/image/books" component={AdminBooksPage} />
      <Route path="/image/books/:id/edit" component={AdminBookEditorPage} />
      <Route path="/image/settings" component={AdminSettingsPage} />
      <Route path="/image/motivational-stories" component={AdminMotivationalStoriesPage} />
      <Route path="/image/motivational-stories/:id/manage" component={AdminMotivationalStoryManagePage} />
      <Route path="/image/motivational-stories/:id/edit" component={AdminMotivationalStoryEditPage} />
      <Route path="/image/books/:id/edit-details" component={AdminBookEditPage} />
      <Route path="/image/trash" component={AdminTrashPage} />
      <Route path="/image/users" component={AdminUsersPage} />
      <Route path="/image/moderators" component={AdminModeratorsPage} />
      <Route path="/image/footer" component={AdminFooterPage} />
      <Route path="/image/duas" component={AdminDuasPage} />
      <Route path="/image/duas/:id/edit" component={AdminDuaEditorPage} />
      <Route path="/image/duas/:id/edit-details" component={AdminDuaEditPage} />
      <Route path="/image/overview" component={AdminOverviewPage} />
      <Route path="/image/home-page" component={AdminHomePagePage} />

      <Route path="/duas" component={DuasPage} />
      <Route path="/duas/:slug" component={DuaDetailPage} />
      <Route path="/page/:slug" component={FooterPageView} />
      <Route path="/:slug" component={CategoryPage} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ViewAsProvider>
            <Toaster />
            <Router />
          </ViewAsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
