"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SidebarProvider } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, Shield, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const { language, t } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Log successful login
        try {
          await supabase
            .from('login_logs')
            .insert([{
              admin_email: email,
              login_time: new Date().toISOString(),
              user_agent: navigator.userAgent
            }])
        } catch (loginLogError) {
          console.log('Login logging failed:', loginLogError)
        }
        
        // Route based on email
        if (email === 'engradaka@gmail.com') {
          router.push("/master-dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error. Please check your connection and try again.')
    }

    setLoading(false)
  }

  const handleBack = () => {
    router.push("/")
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setError(error.message)
      } else {
        alert('✅ Password reset email sent! Check your inbox and follow the instructions.')
        setShowResetPassword(false)
        setResetEmail('')
      }
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Network error. Please try again.')
    }

    setResetLoading(false)
  }



  return (
    <div className="flex min-h-screen bg-white">
      <SidebarProvider>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8 md:ml-16">
          <div className="max-w-md w-full">
            {/* Back Button - Mobile */}
            <div className="mb-6 sm:mb-8 md:hidden">
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-gray-200 hover:bg-gray-50 rounded-xl bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="text-sm">{language === "ar" ? "العودة للرئيسية" : "Back to Home"}</span>
              </Button>
            </div>

            <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="text-center py-8 sm:py-12">
                {/* Shield Icon with Gradient */}
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
                <p className="text-gray-600 text-sm sm:text-base px-4">Access the quiz management dashboard</p>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                  {error && (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertDescription className="text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Email</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="h-10 sm:h-12"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-10 sm:h-12 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                        ) : (
                          <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 rounded-xl text-base sm:text-lg font-semibold"
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>

                {/* Reset Password Link */}
                <div className="mt-4 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:bg-transparent"
                  >
                    Forgot your password?
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Reset Password Modal */}
            {showResetPassword && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md bg-white rounded-2xl">
                  <CardHeader className="text-center py-6">
                    <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                    <p className="text-gray-600 text-sm">Enter your email to receive reset instructions</p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      {error && (
                        <Alert variant="destructive" className="rounded-xl">
                          <AlertDescription className="text-sm">{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900">Email Address</label>
                        <Input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="h-10"
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowResetPassword(false)
                            setResetEmail('')
                            setError('')
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={resetLoading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {resetLoading ? 'Sending...' : 'Send Reset Email'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </SidebarProvider>
    </div>
  )
}
