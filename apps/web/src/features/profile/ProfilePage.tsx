import './App.css'
import { OpportunityCard } from './OpportunityCard'
import { Preferences } from './Preferences'
import { ProfileCompletion } from './ProfileCompletion'
import { SavedOpportunities } from './SavedOpportunities'

export function ProfilePage() {
  return (
  
    <div className="profile-main">

      <div className="profile-content">
        <div className="left-section">
          <section className="profile-card">
            <div className="profile-picture">
            JS
            </div>

            <div className="profile-info">
              <h1>Jordan Smith</h1>
              <p>Major • School</p>
              <p>Location • Email or Phone Number</p>
            </div>

              <button className="edit-profile">
              Edit Profile
              </button>
          </section>
        
          <section className="saved-opportunities">
          <h2>Saved Opportunities</h2>

          <SavedOpportunities />
          </section>

        </div>

        <div className="right-section">
          <ProfileCompletion />
          <Preferences />

          <div className="upcoming-section">
            <h2>Upcoming</h2>
              <OpportunityCard
              title="Fulbright U.S. Student Program"
              organization="U.S. DEPARTMENT OF STATE"
              badge="Up To $50,000"
              date="Jan 16, 2026"
              category="scholarship"
            />
            
            <OpportunityCard 
              title="Fall Engineering Career Fair"
              organization="THE OHIO STATE UNIVERSITY"
              badge="In Person"
              date="Oct 1, 2026"
              category="event"
            />

            <OpportunityCard
              title="MIT $100K Entrepreneurship Competition"
              organization="MIT SLOAN"
              badge="$100,000 Prize"
              date="Dec 23, 2026"
              category="competition"
            />

            <OpportunityCard
              title="Software Engineering Intern (NJUS)"
              organization="NETJETS"
              badge="$24/hr"
              date="Sept 6, 2027"
              category="job"
            />
          </div>

        </div>
        
      </div>

    </div>
  )
}