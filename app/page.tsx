"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/language-context"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleStartChallenge = () => {
    router.push("/team-setup")
  }

  if (!isMounted) {
    return (
      <div className="h-screen bg-white flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white relative overflow-hidden">
      {/* Building Image as background */}
      <div 
        className="hidden md:block absolute left-0 top-0 h-full w-1/3"
        style={{ 
          backgroundImage: 'url(/nbk-building.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'left center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* NBK Logo - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <Image
          src="/nbk-logo.png"
          alt="NBK Logo"
          width={150}
          height={60}
          priority
          className="w-[150px] h-[60px]"
        />
      </div>
      
      {/* Main Content Area */}
      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="flex flex-col items-center w-full max-w-md">
          {/* Diamond Image - Above Card */}
          <div className="mb-4">
            <Image
              src="/diamond.webp"
              alt="Diamond"
              width={300}
              height={300}
              priority
              className="w-[500px] h-[300px] mx-auto"
            />
          </div>
          
          {/* Card */}
          <Card className="w-full shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <h1 className="text-2xl font-bold text-blue-900 mb-3">{t("welcome")}</h1>
              <p className="text-gray-600 mb-6">{t("description")}</p>
              <Button
                onClick={handleStartChallenge}
                className="w-full h-12 bg-blue-800 hover:bg-blue-700 text-white font-semibold"
              >
                {t("start_challenge")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}