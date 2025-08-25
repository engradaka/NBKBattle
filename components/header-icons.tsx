// components/header-icons.tsx
"use client";

import { Globe, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { useRouter } from "next/navigation";

export default function HeaderIcons() {
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-3 items-center">
      {/* Language Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="h-9 px-3 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <Globe className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-700">{language === "ar" ? "EN" : "AR"}</span>
      </Button>

      {/* Login Button */}
      <Button
        variant="default"
        size="sm"
        onClick={handleLogin}
        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <LogIn className="h-4 w-4 mr-2" />
        {t("login") ?? "Login"}
      </Button>
    </div>
  );
}