"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      root.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggle = () => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={toggle}
      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-800"
    >
      {darkMode ? "🌙 Dark Mode" : "🌞 Light Mode"}
    </button>
  );
}
