type PreferencesProps = {
    lookingFor?: string | null
    areaOfStudy?: string | null
    location?: string | null
    educationLevel?: string | null
    school?: string | null
}

const educationLabels: Record<string, string> = 
{
    highschool: "High School",
    undergraduate: "Undergraduate",
    graduate: "Graduate",
    doctoral: "Doctoral",
    other: "Other",
}

const opportunityLabels: Record<string, string> = 
{
    job: "Jobs",
    internship: "Internships",
    scholarship: "Scholarships",
    hackathons: "Hackathons",
    grants: "Grants",
}

export function Preferences({
    lookingFor,
    areaOfStudy,
    location,
    educationLevel,
    school,
}: PreferencesProps) {
    return (
        <section className="preferences">
            <h2>Preferences</h2>

            <p className="name">LOOKING FOR</p>
            <p className="value">
                {lookingFor ? opportunityLabels[lookingFor] || lookingFor : "Not specified"}
            </p>

            <p className="name">AREA OF STUDY</p>
            <p className="value">{areaOfStudy || "Not specified"}</p>

            <p className="name">LOCATION</p>
            <p className="value">{location || "Not specified"}</p>

            <p className="name">LEVEL OF EDUCATION</p>
            <p className="value">
                {educationLevel ? educationLabels[educationLevel] || educationLevel : "Not specified"}
            </p>
            
            <p className="name">SCHOOL NAME</p>
            <p className="value">{school || "Not specified"}</p>
        </section>
    )
}