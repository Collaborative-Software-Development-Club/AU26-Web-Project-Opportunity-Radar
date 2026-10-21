import './App.css'
import { Show, SignInButton } from '@clerk/react'
import { Button } from '@/components/ui/button'
import { FeedMessage } from '@/features/opportunities/components/feed-message'
import { useApiQuery } from '@/hooks/use-api-query'
import { Preferences } from './Preferences'
import { ProfileCompletion } from './ProfileCompletion'
import { SavedOpportunities, UpcomingDeadlines } from './SavedOpportunities'

export function ProfilePage() {
  return (
  
    <div className="profile-main">
      <Show when="signed-in">
        <ProfileContent />
      </Show>
      <Show when="signed-out">
        <FeedMessage
          title="Sign in to see your profile"
          description="Your saved opportunities and upcoming deadlines live here."
          action={
            <SignInButton mode="modal">
              <Button>Sign in</Button>
            </SignInButton>
          }
        />
      </Show>
    </div>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

// Loaded once here so the saved list and Upcoming share one request.
function ProfileContent() {
  const { data: user, error: userError } = useApiQuery('me', (api, signal) => api.users.me({ signal }))
  // shortcut: tabs, sections and Upcoming use the newest 100 saves; add a category filter to /api/saved when users save more.
  const saved = useApiQuery('saved', (api, signal) => api.saved.list({ limit: 100 }, { signal }))
  const opportunities = saved.data?.data.map((item) => item.opportunity)
  const name = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : ''

  return (
      <div className="profile-content">
        <div className="left-section">
          <section className="profile-card">
            <div className="profile-picture" aria-hidden>
            {initials(name)}
            </div>

            <div className="profile-info">
              <h1>{userError ? "Couldn't load your profile" : name}</h1>
              <p>{user?.email}</p>
            </div>

              <button className="edit-profile">
              Edit Profile
              </button>
          </section>
        
          <section className="saved-opportunities">
          <h2>Saved Opportunities</h2>

          <SavedOpportunities opportunities={opportunities} error={saved.error} retry={saved.retry} />
          </section>

        </div>

        <div className="right-section">
          <ProfileCompletion />
          <Preferences />

          <div className="upcoming-section">
            <h2>Upcoming</h2>
            <UpcomingDeadlines opportunities={opportunities} />
          </div>

        </div>
        
      </div>
  )
}
