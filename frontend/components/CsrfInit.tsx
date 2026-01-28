"use client";

import { useEffect } from "react";
import { ensureCsrf } from "@/lib/csrf";

export default function CsrfInit() {
  useEffect(() => {
    ensureCsrf().catch(() => {});
  }, []);
  return null;
}

