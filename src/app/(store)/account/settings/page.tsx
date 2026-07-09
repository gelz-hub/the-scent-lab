import { PushPreferences } from '@/components/notifications/push-preferences'
import { ProfileForm } from '@/components/account/profile-form'
import { ChangePasswordForm } from '@/components/account/change-password-form'
import { LogoutButton } from '@/components/account/logout-button'

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, security, and how The Scent Lab keeps you updated.
        </p>
      </div>
      <ProfileForm />
      <ChangePasswordForm />
      <PushPreferences />
      <div className="rounded-xl border border-border p-6">
        <h2 className="font-display text-lg font-medium">Account security</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign out of your account on this device.</p>
        <LogoutButton />
      </div>
    </div>
  )
}
