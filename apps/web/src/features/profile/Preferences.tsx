import type { UserPreferencesView } from '@radar/contracts'

type PreferencesProps = {
    preferences: UserPreferencesView
}

export function Preferences({ preferences }: PreferencesProps) {
    return (
        <section className="preferences">
            <h2>Preferences</h2>

            <p className="name">LOOKING FOR</p>
            <p className="value">
                {preferences.categories.map(
                    (category) => category.name
                ).join(", ") || "Not specified"}
            </p>

            <p className="name">AREA OF STUDY</p>
            <p className="value">
                {preferences.fields.map(
                    (field) => field.name
                ).join(", ") || "Not specified"}
            </p>

            <p className="name">LOCATION</p>
            <p className="value">
                {preferences.locations.map(
                    (location) =>
                        [location.city, location.stateRegion, location.country]
                            .filter(Boolean)
                            .join(", ")
                ).join("; ") || "Not specified"}
            </p>

            <p className="name">LEVEL OF EDUCATION</p>
            <p className="value">
                {preferences.educationLevels.map(
                    (level) => level.name
                ).join(", ") || "Not specified"}
            </p>
        </section>
    )
}