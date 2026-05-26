import ChangePasswordForm from '@/components/admin/profile/ChangePasswordForm'

type Props = {
  fullName: string
  email: string
  role: string
}

export default function AdminProfilePageClient({ fullName, email, role }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Profile</h1>
        <p className="mt-1 font-body text-sm text-[#5A5A7A]">
          Manage your admin account and password.
        </p>
      </div>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Account</h2>
        <dl className="mt-4 space-y-3 font-body text-sm">
          <div>
            <dt className="text-[#9898B8]">Name</dt>
            <dd className="font-medium text-[#1A1A2E]">{fullName}</dd>
          </div>
          <div>
            <dt className="text-[#9898B8]">Email</dt>
            <dd className="font-medium text-[#1A1A2E]">{email}</dd>
          </div>
          <div>
            <dt className="text-[#9898B8]">Role</dt>
            <dd className="font-medium capitalize text-[#1A1A2E]">{role}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="font-body text-base font-semibold text-[#1A1A2E]">Change password</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  )
}
