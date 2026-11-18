export function ProfileCompletion({ percentage }: { percentage: number }) {
    return (
            <section className="profile-completion">
                <div className="completion-heading">
                    <h2>Profile Completion</h2>
                    <span>{percentage}%</span>
                </div>

                <div className="progress-bar">
                    <div 
                        className="progress"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>

                <p className="blurb">
                    Complete your profile to unlock 100% completion
                </p>
            </section>
    )
}