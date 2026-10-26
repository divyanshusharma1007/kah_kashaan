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
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );

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
        revealObserver.observe(element);
      });
    }

    observeReveals(document.body);

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
    };
  }, [pathname]);

  return null;
}
