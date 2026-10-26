"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageMotion() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function animatePage(element: HTMLElement) {
      element.classList.remove("page-enter");
      void element.offsetWidth;
      element.classList.add("page-enter");
    }

    document.querySelectorAll<HTMLElement>("main").forEach(animatePage);

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );

    function revealVisibleElements() {
      document.querySelectorAll<HTMLElement>(".motion-reveal:not(.is-visible), .scroll-reveal:not(.is-visible)").forEach((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight - 32 && bounds.bottom > 0) {
          element.classList.add("is-visible");
          revealObserver.unobserve(element);
        }
      });
    }

    function scheduleRevealCheck() {
      revealVisibleElements();
    }

    function observeReveals(root: Element) {
      const candidates: Element[] = [];
      if (root.matches("section, article")) candidates.push(root);
      candidates.push(...root.querySelectorAll("section, article"));

      candidates.forEach((element) => {
        if (
          element.classList.contains("motion-reveal") ||
          element.closest(".scroll-reveal") ||
          element.querySelector(".scroll-reveal")
        ) {
          return;
        }

        element.classList.add("motion-reveal");
        const bounds = element.getBoundingClientRect();
        if (bounds.top < window.innerHeight && bounds.bottom > 0) {
          element.classList.add("is-visible");
        } else {
          revealObserver.observe(element);
        }
      });
    }

    observeReveals(document.body);
    window.addEventListener("scroll", scheduleRevealCheck, { passive: true });
    window.addEventListener("resize", scheduleRevealCheck);

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches("main")) animatePage(node);
            node.querySelectorAll<HTMLElement>("main").forEach(animatePage);
            observeReveals(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      revealObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", scheduleRevealCheck);
      window.removeEventListener("resize", scheduleRevealCheck);
    };
  }, [pathname]);

  return null;
}
