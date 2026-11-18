import './EditProfile.css'
import { useState } from 'react'
import { useApi } from "../../lib/api"

type EditProfileProps = {
    onClose: () => void
    onSaved: () => void
    user: {
        firstName: string
        lastName: string
        email: string
        location?: string | null
        educationLevel?: string | null
        school?: string | null
        areaOfStudy?: string | null
        lookingFor?: string | null
    }
}

export function EditProfile({ onClose, onSaved, user }: EditProfileProps) {
    const api = useApi()
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const [name, setName] = useState(
        `${user.firstName} ${user.lastName}`.trim()
    )
    const [location, setLocation] = useState(user.location ?? "")
    const [educationLevel, setEducationLevel] = useState(user.educationLevel ?? "")
    const [school, setSchool] = useState(user.school ?? "")
    const [areaOfStudy, setAreaOfStudy] = useState(user.areaOfStudy ?? "")
    const [lookingFor, setLookingFor] = useState(user.lookingFor ?? "")

    async function handleSave() {
        if (!name.trim() || isSaving) return

        setIsSaving(true)
        setError("")

        const [firstName, ...remainingNames] = name.trim().split(/\s+/)
        const lastName = remainingNames.join(" ")

        try {
            await api.users.updateMe({
                firstName,
                lastName,
                location,
                educationLevel,
                school,
                areaOfStudy,
                lookingFor,
            })
            onSaved()
            onClose()
        } catch (error) {
            console.error("Failed to update profile:", error)
            setError("Failed to save your changes. Please try again.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section className="edit-profile-overlay">
            <div className="edit-profile-card">
                <h1>Edit Profile</h1>
                <p>Update your personal information and preferences.</p>
                <div className="edit-profile-fields">
                    <div>
                        <label htmlFor="edit-name">Full Name</label>
                        <input
                            id="edit-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-email">Email</label>
                        <input
                            id="edit-email"
                            type="email"
                            value={user.email}
                            readOnly
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-location">Location</label>
                        <input
                            id="edit-location"
                            type="text"
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            placeholder="e.g. Columbus, OH"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-education">Level of Education</label>
                        <select
                            id="edit-education"
                            value={educationLevel}
                            onChange={(event) => setEducationLevel(event.target.value)}
                        >
                            <option value="">Select education level</option>
                            <option value="highschool">High School</option>
                            <option value="undergraduate">Undergraduate</option>
                            <option value="graduate">Graduate</option>
                            <option value="doctoral">Doctoral</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-school">School Name</label>
                        <input
                            id="edit-school"
                            type="text"
                            value={school}
                            onChange={(event) => setSchool(event.target.value)}
                            placeholder="The Ohio State University"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-study">Area of Study</label>
                        <input
                            id="edit-study"
                            type="text"
                            value={areaOfStudy}
                            onChange={(event) => setAreaOfStudy(event.target.value)}
                            placeholder="Computer Science and Engineering"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-looking-for">Looking For</label>
                        <select
                            id="edit-looking-for"
                            value={lookingFor}
                            onChange={(event) => setLookingFor(event.target.value)}
                        >
                            <option value="">Select opportunity type</option>
                            <option value="job">Jobs</option>
                            <option value="internship">Internships</option>
                            <option value="scholarship">Scholarships</option>
                            <option value="hackathons">Hackathons</option>
                            <option value="grants">Grants</option>
                        </select>
                    </div>

                </div>

                {error && <p role="alert">{error}</p>}
                <div className="edit-profile-actions">
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </section>
    )
}