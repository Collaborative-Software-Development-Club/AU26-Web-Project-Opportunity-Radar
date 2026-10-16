import './App.css'
import { OpportunityCard } from './OpportunityCard'
import { Preferences } from './Preferences'
import { ProfileCompletion } from './ProfileCompletion'
import { ResumeCard } from './ResumeCard'
import { UpcomingCard } from './Upcoming'
import { useState } from 'react'

export function ProfilePage() {
  const [activeCategory, setActiveCategory] = useState('all')

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

          <div className="sorting-opportunities">
            <button 
              className={activeCategory === 'all' ? 'all active-filter' : 'all'}
            onClick={() => setActiveCategory('all')}
            >
              All
            </button>

            <button 
              className={activeCategory === 'scholarship' ? 'scholarships active-filter' : 'scholarships'}
              onClick={() => setActiveCategory('scholarship')}
            >
              Scholarships
            </button>

            <button 
            className={activeCategory === 'competition' ? 'competitions active-filter' : 'competitions'}
            onClick={() => setActiveCategory('competition')}
            >
              Competitions
            </button>

            <button 
            className={activeCategory === 'event' ? 'events active-filter' : 'events'}
            onClick={() => setActiveCategory('event')}
            >
              Career Events
            </button>

            <button 
            className={activeCategory === 'job' ? 'jobs active-filter' : 'jobs'}
            onClick={() => setActiveCategory('job')}
            >
              Jobs & Internships
            </button>
          </div>

        {(activeCategory === 'all' || activeCategory === 'scholarship') && (
          <div className="opportunity-section">
            <h3>Scholarships</h3>

            <OpportunityCard
              title="Fulbright U.S. Student Program"
              organization="U.S. DEPARTMENT OF STATE"
              badge="Up To $50,000"
              date="Jan 16, 2026"
              category="scholarship"
            />
          </div>
        )}
          
        {(activeCategory === 'all' || activeCategory === 'competition') && (
          <div className="opportunity-section">
          <h3>Competitions</h3>

          <OpportunityCard
              title="MIT $100K Entrepreneurship Competition"
              organization="MIT SLOAN"
              badge="$100,000 Prize"
              date="Dec 23, 2026"
              category="competition"
          />
        </div>
        )}

      {(activeCategory === 'all' || activeCategory === 'event') && (
        <div className="opportunity-section">
          <h3>Career Events</h3>

          <OpportunityCard
              title="Fall Engineering Career Fair"
              organization="THE OHIO STATE UNIVERSITY"
              badge="In Person"
              date="Oct 1, 2026"
              category="event"
          />
        </div>
      )}
        
      {(activeCategory === 'all' || activeCategory === 'job') && (
        <div className="opportunity-section">
          <h3>Job & Internship</h3>

          <OpportunityCard
              title="Software Engineering Intern (NJUS)"
              organization="NETJETS"
              badge="$24/hr"
              date="Sept 6, 2027"
              category="job"
          />
        </div>
      )}

          </section>

        </div>

        <div className="right-section">
          <ProfileCompletion />
          <Preferences />

          <div className="upcoming-section">
            <h2>Upcoming</h2>
              <UpcomingCard
              title="Fulbright U.S. Student Program"
              organization="U.S. DEPARTMENT OF STATE"
              badge="Up To $50,000"
              date="Jan 16, 2026"
              category="scholarship"
            />
            
            <UpcomingCard 
              title="Fall Engineering Career Fair"
              organization="THE OHIO STATE UNIVERSITY"
              badge="In Person"
              date="Oct 1, 2026"
              category="event"
            />

            <UpcomingCard
              title="MIT $100K Entrepreneurship Competition"
              organization="MIT SLOAN"
              badge="$100,000 Prize"
              date="Dec 23, 2026"
              category="competition"
            />

            <UpcomingCard
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