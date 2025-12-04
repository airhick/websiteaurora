import { createFileRoute } from '@tanstack/react-router'
import { BusinessSetup } from '@/features/aurora-dashboard/components/business-setup'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore((state) => state.auth)

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!loading && user) {
      navigate({ to: '/dashboard' })
    }
  }, [user, loading, navigate])

  const handleSetupComplete = () => {
    navigate({ to: '/dashboard' })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // If user is authenticated, they will be redirected by useEffect
  return (
    <>
      <Header showSidebarTrigger={false}>
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <BusinessSetup onComplete={handleSetupComplete} />
      </Main>
    </>
  )
}

