import { useAuth } from '../hooks/useAuth.js'
import { useAccount } from '../hooks/useAccount.js'
import { useMyProfile } from '../hooks/useMyProfile.js'
import PageShell from '../components/PageShell.jsx'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import AccountForm from '../components/AccountForm.jsx'
import RoleProfilePanel from '../components/RoleProfilePanel.jsx'
import PortfolioManager from '../components/PortfolioManager.jsx'
import LoadingState from '../components/LoadingState.jsx'
import ErrorState from '../components/ErrorState.jsx'

// Settings: account details for everyone, plus the role profile and (for
// artists) the portfolio. The steps 13–16 editors live here.
export default function Profile() {
  const { user, role, refreshProfile } = useAuth()
  const account = useAccount(user.id)
  const roleProfile = useMyProfile(user.id)

  const isArtist = role === 'artist'

  return (
    <PageShell title="Your" highlight="Profile" width="max-w-4xl"
      actions={isArtist && roleProfile.roleProfile && (
        <Button to={`/artists/${user.id}`} variant="secondary">View public page</Button>
      )}>
      <div className="space-y-6">
        <Card title="Account">
          {account.isLoading ? <LoadingState /> : account.error ? (
            <ErrorState error={account.error} onRetry={account.reload} />
          ) : (
            <AccountForm userId={user.id} role={role} account={account.data}
              onSaved={() => { refreshProfile(); roleProfile.reload() }} />
          )}
        </Card>

        {(role === 'artist' || role === 'organizer') && (
          <Card title={isArtist ? 'Artist' : 'Organizer'} highlight="Details">
            {roleProfile.isLoading ? <LoadingState /> : roleProfile.error ? (
              <ErrorState error={roleProfile.error} onRetry={roleProfile.reload} />
            ) : (
              <RoleProfilePanel userId={user.id} role={role} roleProfile={roleProfile.roleProfile} onChanged={roleProfile.reload} />
            )}
          </Card>
        )}

        {isArtist && roleProfile.roleProfile && (
          <Card title="Your" highlight="Portfolio">
            <PortfolioManager userId={user.id} />
          </Card>
        )}
      </div>
    </PageShell>
  )
}
