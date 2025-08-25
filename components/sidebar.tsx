// components/sidebar.tsx
"use client";

import { useState } from "react";
import { Globe, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export default function Sidebar() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  const toggleSidebar = () => {
    setOpen((prev) => !prev);
  };

  return (
    <>
      {/* Hamburger Menu (Mobile) */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="p-2"
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed top-0 left-0 w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 space-y-4 z-40 h-screen"
        )}
      >

        {/* Login Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogin}
          className="w-12 h-12 p-0 hover:bg-gray-100"
          title={t("login") ?? "Login"}
        >
          <LogIn className="h-5 w-5 text-gray-600" />
        </Button>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="w-12 h-12 p-0 hover:bg-gray-100"
          title={t("language") ?? "Language"}
        >
          <Globe className="h-5 w-5 text-gray-600" />
        </Button>
      </div>

      {/* Overlay for mobile when menu is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
