import { SignInButton, SignUpButton } from "@clerk/react";
import { ChevronDown } from "lucide-react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { DISCOVERY_CATEGORIES } from "@/features/opportunities/discovery-categories";
import { cn } from "@/lib/utils";
import { useHideHeaderWhileVisible } from "../hooks/use-hide-header-while-visible";

export function LandingHero({ exploreId }: { exploreId: string }) {
  const ref = useHideHeaderWhileVisible<HTMLElement>();

  function scrollToExplore(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(exploreId);
    if (!target) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <section
      ref={ref}
      className="mb-16 flex min-h-screen-inset flex-col items-center gap-4 rounded-3xl bg-brand-subtle px-5 pt-8 pb-4 text-center text-brand"
      aria-labelledby="landing-heading"
    >
      <div className="flex max-w-4xl flex-1 flex-col items-center justify-center gap-6">
        <h1
          id="landing-heading"
          className="font-serif text-4xl font-bold md:text-6xl"
        >
          Every opportunity,
          <br />
          <span className="text-teal-700">on your radar.</span>
        </h1>
        <p className="max-w-2xl text-base text-brand/75 md:text-lg">
          Opportunity Radar gathers scholarships, grants, hackathons, and
          internships into one feed, so you spend less time searching and more
          time applying.
        </p>
        <ul
          className="flex flex-wrap justify-center gap-2"
          aria-label="What you'll find"
        >
          {DISCOVERY_CATEGORIES.map(
            ({ slug, label, icon: Icon, badgeClass }) => (
              <li
                key={slug}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
                  badgeClass,
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </li>
            ),
          )}
        </ul>
        <div className="flex flex-col items-center gap-3">
          <SignUpButton mode="modal">
            <Button variant="brand" className="h-11 px-6 text-base font-semibold">
              Sign up for free
            </Button>
          </SignUpButton>
          <p className="text-sm text-brand/75">
            Already have an account?{" "}
            <SignInButton mode="modal">
              <Button
                variant="link"
                className="h-auto px-0 font-semibold text-brand"
              >
                Sign in
              </Button>
            </SignInButton>
          </p>
        </div>
      </div>
      <a
        href={`#${exploreId}`}
        onClick={scrollToExplore}
        className="flex flex-col items-center gap-1 text-sm font-medium text-brand/75 transition-colors hover:text-brand"
      >
        Try it out
        <ChevronDown className="size-5 animate-bounce" aria-hidden />
      </a>
    </section>
  );
}
