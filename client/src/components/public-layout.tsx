import { Link, useLocation } from "wouter";
import { BookOpen, Search, Menu, X, Sun, Moon, User, Bookmark, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { SocialBarAd } from "@/components/ad-slot";
import { FaFacebook, FaXTwitter, FaInstagram, FaYoutube, FaTiktok, FaLinkedin, FaPinterest, FaTelegram, FaWhatsapp, FaSnapchat } from "react-icons/fa6";
import type { FooterPage } from "@shared/schema";

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook: FaFacebook,
  twitter: FaXTwitter,
  instagram: FaInstagram,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
  pinterest: FaPinterest,
  telegram: FaTelegram,
  whatsapp: FaWhatsapp,
  snapchat: FaSnapchat,
};

interface Category {
  id: string;
  name: string;
  slug: string;
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <Button size="icon" variant="ghost" onClick={toggle} data-testid="button-theme-toggle">
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}

function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/login">
          <Button variant="ghost" size="sm" data-testid="button-login-nav">
            Log In
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="sm" data-testid="button-signup-nav">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-user-menu">
          <User className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium truncate" data-testid="text-user-name">
          {user.name || user.email || user.username}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/dashboard")} data-testid="menu-dashboard">
          <LayoutDashboard className="w-4 h-4 mr-2" />
          My Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/dashboard?section=bookmarks")} data-testid="menu-bookmarks">
          <Bookmark className="w-4 h-4 mr-2" />
          Bookmarks
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/image")} data-testid="menu-admin">
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout().then(() => navigate("/"))} data-testid="menu-logout">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAdmin } = useAuth();

  const { data: allCategoryData } = useQuery<Category[]>({
    queryKey: ["/api/categories?type=all"],
  });

  const categoryData = allCategoryData?.filter(c => c.type === "story");
  const bookPage = allCategoryData?.find(c => c.type === "book");
  const motivationalPage = allCategoryData?.find(c => c.type === "motivational-story");
  const duaPage = allCategoryData?.find(c => c.type === "dua");

  const { data: publicSettings = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/settings/public"],
  });

  useEffect(() => {
    const root = document.documentElement;
    if (publicSettings.fontSizeTitle) root.style.setProperty("--font-title-size", `${publicSettings.fontSizeTitle}px`);
    if (publicSettings.fontSizeHeadline) root.style.setProperty("--font-headline-size", `${publicSettings.fontSizeHeadline}px`);
    if (publicSettings.fontSizeBody) root.style.setProperty("--font-body-size", `${publicSettings.fontSizeBody}px`);
    if (publicSettings.fontSizeSmall) root.style.setProperty("--font-small-size", `${publicSettings.fontSizeSmall}px`);
  }, [publicSettings]);

  const { data: footerPagesData = [] } = useQuery<FooterPage[]>({
    queryKey: ["/api/footer-pages"],
  });

  const siteName = publicSettings["siteName"] ?? "Stories of Light";
  const footerDescription = publicSettings["footerDescription"] ?? "Sharing authentic, inspiring stories from Islamic history. Our mission is to make the rich heritage of Islamic civilization accessible and engaging for English-speaking audiences worldwide.";
  let socialLinks: { platform: string; url: string }[] = [];
  try { socialLinks = JSON.parse(publicSettings["socialLinks"] ?? "[]"); } catch { socialLinks = []; }
  let footerCategoryIds: string[] = [];
  try { footerCategoryIds = JSON.parse(publicSettings["footerCategoryIds"] ?? "[]"); } catch { footerCategoryIds = []; }
  const footerCategories = footerCategoryIds.length > 0
    ? (categoryData ?? []).filter(c => footerCategoryIds.includes(c.id))
    : (categoryData ?? []);

  const navLinks = [
    { label: "Home", href: "/" },
    ...(categoryData ?? []).map((cat) => ({ label: cat.name, href: `/category/${cat.urlSlug || cat.slug}` })),
    { label: motivationalPage?.name || "Stories", href: "/motivational-stories" },
    { label: duaPage?.name || "Dua", href: "/duas" },
    { label: bookPage?.name || "Books", href: "/books" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/" className="flex items-center gap-2 shrink-0" data-testid="link-home">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight hidden sm:inline">
                {siteName}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={location === link.href ? "secondary" : "ghost"}
                    size="sm"
                    data-testid={`link-nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-1">
                  <Input
                    type="search"
                    placeholder="Search stories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 sm:w-60"
                    autoFocus
                    data-testid="input-search"
                  />
                  <Button size="icon" variant="ghost" type="button" onClick={() => setSearchOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <Button size="icon" variant="ghost" onClick={() => setSearchOpen(true)} data-testid="button-search">
                  <Search className="w-4 h-4" />
                </Button>
              )}
              <ThemeToggle />
              <UserMenu />
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={location === link.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              {!user && (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-login">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full justify-start" onClick={() => setMobileMenuOpen(false)} data-testid="link-mobile-signup">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-card mt-16" data-testid="section-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">

            {/* Col 1: Brand */}
            <div className="md:col-span-1 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-serif text-base font-semibold tracking-tight">{siteName}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {footerDescription}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {socialLinks.map(link => {
                    const Icon = SOCIAL_ICONS[link.platform];
                    if (!Icon) return null;
                    return (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`link-footer-social-${link.platform}`}
                        aria-label={link.platform}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Col 2: Categories */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Categories</h3>
              <ul className="space-y-2">
                {footerCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.urlSlug || cat.slug}`}
                      className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${cat.urlSlug || cat.slug}`}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Explore */}
            <div>
              <h3 className="font-semibold text-sm mb-4">Explore</h3>
              <ul className="space-y-2">
                {[
                  { href: "/motivational-stories", label: motivationalPage?.name || "Stories", testId: "explore-stories" },
                  { href: "/duas", label: duaPage?.name || "Dua", testId: "explore-duas" },
                  { href: "/books", label: bookPage?.name || "Books", testId: "explore-books" },
                ].map(({ href, label, testId }) => (
                  <li key={testId}>
                    <Link
                      href={href}
                      className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`link-footer-${testId}`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: About */}
            <div>
              <h3 className="font-semibold text-sm mb-4">About</h3>
              <ul className="space-y-2">
                {footerPagesData.length > 0 ? (
                  footerPagesData.map(page => (
                    <li key={page.id}>
                      <Link
                        href={`/page/${page.slug}`}
                        className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`link-footer-page-${page.slug}`}
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link href="/page/about-us" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-about">
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/page/privacy-policy" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors" data-testid="link-footer-privacy">
                        Privacy Policy
                      </Link>
                    </li>
                  </>
                )}
              </ul>
              <p className="mt-4 text-[12px] text-muted-foreground leading-relaxed">
                Content is presented with respect and care. All stories are sourced from authentic Islamic scholarship.
              </p>
            </div>

          </div>

          <div className="border-t pt-6 text-center text-xs text-muted-foreground">
            <span>{siteName}. All rights reserved.</span>
          </div>

        </div>
      </footer>
      <SocialBarAd />
    </div>
  );
}
