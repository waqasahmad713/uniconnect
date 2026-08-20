"use client";

import { RefObject } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function useEnterMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-enter]", {
          y: 24,
          autoAlpha: 0,
          duration: 0.7,
          stagger: 0.09,
          ease: "power3.out",
        });
      });
      return () => mm.revert();
    },
    { scope },
  );
}
