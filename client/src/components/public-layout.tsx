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
import { cn } from "@/lib/utils";

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
  urlSlug?: string;
  type?: string;
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
    <button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
      data-testid="button-theme-toggle"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

function UserMenu() {
  const { user, logout, isAdmin } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Link href="/login">
          <button
            className="text-sm font-medium text-foreground/70 hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted transition-colors"
            data-testid="button-login-nav"
          >
            Log In
          </button>
        </Link>
        <Link href="/signup">
          <button
            className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:opacity-90 transition-opacity"
            data-testid="button-signup-nav"
          >
            Sign Up
          </button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
          data-testid="button-user-menu"
        >
          <User className="w-4 h-4" />
        </button>
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
  const { user } = useAuth();

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
  const footerDescription = publicSettings["footerText"] ?? publicSettings["footerDescription"] ?? "Discover inspiring stories of Islamic history, inspiring biographies, books, and teachings that strengthen the heart and mind.";
  let socialLinks: { platform: string; url: string }[] = [];
  try { socialLinks = JSON.parse(publicSettings["socialLinks"] ?? "[]"); } catch { socialLinks = []; }
  let footerCategoryIds: string[] = [];
  try { footerCategoryIds = JSON.parse(publicSettings["footerCategoryIds"] ?? "[]"); } catch { footerCategoryIds = []; }
  const footerCategories = footerCategoryIds.length > 0
    ? (categoryData ?? []).filter(c => footerCategoryIds.includes(c.id))
    : (categoryData ?? []);

  const navLinks = [
    { label: "Home", href: "/" },
    ...(categoryData ?? []).map((cat) => ({ label: cat.name, href: `/${cat.urlSlug || cat.slug}` })),
    ...(!allCategoryData || motivationalPage ? [{ label: motivationalPage?.name || "Stories", href: "/motivational-stories" }] : []),
    ...(!allCategoryData || duaPage ? [{ label: duaPage?.name || "Duas", href: "/duas" }] : []),
    ...(!allCategoryData || bookPage ? [{ label: bookPage?.name || "Books", href: "/books" }] : []),
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

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-[68px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0" data-testid="link-home">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-serif text-[1.05rem] font-semibold tracking-tight hidden sm:inline text-foreground">
                {siteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={cn("public-nav-link", location === link.href && "active")}
                    data-testid={`link-nav-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-1">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-1">
                  <Input
                    type="search"
                    placeholder="Search stories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 sm:w-56 h-8 text-sm bg-muted/60 border-border/60"
                    autoFocus
                    data-testid="input-search"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-foreground/60 hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                  data-testid="button-search"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
              <ThemeToggle />
              <div className="hidden md:block">
                <UserMenu />
              </div>
              {/* Mobile hamburger */}
              <button
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/60 bg-background/98 shadow-lg">
            <nav className="flex flex-col px-4 py-3 gap-0.5">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      location === link.href
                        ? "text-primary bg-primary/8 font-semibold"
                        : "text-foreground/70 hover:text-foreground hover:bg-muted"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              {!user && (
                <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border/50">
                  <Link href="/login" className="flex-1">
                    <button
                      className="w-full text-sm font-medium py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-login"
                    >
                      Log In
                    </button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <button
                      className="w-full text-sm font-semibold py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      onClick={() => setMobileMenuOpen(false)}
                      data-testid="link-mobile-signup"
                    >
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
              {user && (
                <div className="pt-2 border-t border-border/50">
                  <UserMenu />
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-card mt-16" data-testid="section-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">

            {/* Col 1: Brand — spans 2 on lg */}
            <div className="col-span-2 md:col-span-1 lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                  <BookOpen className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-serif text-base font-semibold tracking-tight">{siteName}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                {footerDescription}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                  {socialLinks.map(link => {
                    const Icon = SOCIAL_ICONS[link.platform];
                    if (!Icon) return null;
                    return (
                      <a
                        key={link.platform}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        data-testid={`link-footer-social-${link.platform}`}
                        aria-label={link.platform}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Col 2: Categories */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-4 text-foreground/80">Categories</h3>
              <ul className="space-y-2.5">
                {footerCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/${cat.urlSlug || cat.slug}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-4 text-foreground/80">Explore</h3>
              <ul className="space-y-2.5">
                {[
                  { href: "/motivational-stories", label: motivationalPage?.name || "Stories", testId: "explore-stories" },
                  { href: "/duas", label: duaPage?.name || "Duas", testId: "explore-duas" },
                  { href: "/books", label: bookPage?.name || "Books", testId: "explore-books" },
                  { href: "/", label: "Home", testId: "explore-home" },
                  { href: "/search", label: "Latest Stories", testId: "explore-latest" },
                ].map(({ href, label, testId }) => (
                  <li key={testId}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
              <h3 className="font-semibold text-sm uppercase tracking-wide mb-4 text-foreground/80">About</h3>
              <ul className="space-y-2.5">
                {footerPagesData.length > 0 ? (
                  footerPagesData.map(page => (
                    <li key={page.id}>
                      <Link
                        href={`/page/${page.slug}`}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        data-testid={`link-footer-page-${page.slug}`}
                      >
                        {page.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <>
                    <li>
                      <Link href="/page/about-us" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-about">
                        About Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/page/our-mission" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-mission">
                        Our Mission
                      </Link>
                    </li>
                    <li>
                      <Link href="/page/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-privacy">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/page/contact-us" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid="link-footer-contact">
                        Contact Us
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground order-2 sm:order-1">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </span>
            {/* Quran verse — bottom right */}
            <div className="order-1 sm:order-2 text-right flex flex-col items-center sm:items-end gap-1">
              <p className="font-serif text-lg text-primary font-semibold leading-snug" dir="rtl" lang="ar">
                رَبِّ زِدْنِي عِلْمًا
              </p>
              <p className="text-xs text-muted-foreground italic">
                "My Lord, increase me in knowledge." — Qur'an 20:114
              </p>
            </div>
          </div>

        </div>
      </footer>

      <SocialBarAd />
    </div>
  );
}
