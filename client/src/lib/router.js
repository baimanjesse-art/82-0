import { useEffect, useState, useCallback } from "react";

function parseHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash.split("/").filter(Boolean);
}

export function useHashRoute() {
  const [segments, setSegments] = useState(parseHash);

  useEffect(() => {
    const onChange = () => setSegments(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((path) => {
    window.location.hash = path.startsWith("/") ? path : `/${path}`;
  }, []);

  return [segments, navigate];
}
