import './EditProfile.css'
import { useState } from 'react'
import { useApi } from "../../lib/api"
import type { UserProfileView } from '@radar/contracts'
import { useApiQuery } from '@/hooks/use-api-query'

type EditProfileProps = {
    onClose: () => void
    onSaved: () => void
    user: UserProfileView
}

export function EditProfile({ onClose, onSaved, user }: EditProfileProps) {
    const api = useApi()
    const {
        data: lookups,
        isLoading: lookupsLoading,
        error: lookupsError,
    } = useApiQuery("lookups", (api, signal) =>
        api.lookups.list({ signal })
    )
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const [name, setName] = useState(
        `${user.firstName} ${user.lastName}`.trim()
    )
    const [locationIds, setLocationIds] = useState(
        user.preferences.locations.map((location) => location.id))
    const [educationLevelIds, setEducationLevelIds] = useState(
        user.preferences.educationLevels.map((level) => level.id))
    const [fieldIds, setFieldIds] = useState(
        user.preferences.fields.map((field) => field.id))
    const [categoryIds, setCategoryIds] = useState(
        user.preferences.categories.map((category) => category.id))

    async function handleSave() {
        if (!name.trim() || isSaving || lookupsLoading || lookupsError || !lookups) return

        setIsSaving(true)
        setError("")

        const [firstName, ...remainingNames] = name.trim().split(/\s+/)
        const lastName = remainingNames.join(" ")

        try {
            await api.users.updateMe({
                firstName,
                lastName,
                locationIds,
                educationLevelIds,
                fieldIds,
                categoryIds,
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
                <p>Hold Cmd (Mac) or Ctrl (Windows) to select multiple preferences.</p>
                {lookupsLoading && <p>Loading preference options...</p>}

                {!!lookupsError && (
                    <p role="alert">
                        Unable to load preference options. Please try again.
                    </p>
                )}
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
                        <select
                            id="edit-location"
                            multiple
                            value={locationIds}
                            disabled={lookupsLoading || !!lookupsError || isSaving}
                            onChange={(event) =>
                                setLocationIds(
                                    Array.from(
                                        event.currentTarget.selectedOptions,
                                        (option) => option.value
                                    )
                                )
                            }
                        >
                            {lookups?.data.locations.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {[option.city, option.stateRegion, option.country]
                                        .filter(Boolean)
                                        .join(", ")}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-education">Level of Education</label>
                        <select
                            id="edit-education"
                            multiple
                            value={educationLevelIds.map(String)}
                            disabled={lookupsLoading || !!lookupsError || isSaving}
                            onChange={(event) =>
                                setEducationLevelIds(
                                    Array.from(
                                        event.currentTarget.selectedOptions,
                                        (option) => Number(option.value)
                                    )
                                )
                            }
                        >
                            {lookups?.data.educationLevels.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-study">Area of Study</label>
                        <select
                            id="edit-study"
                            multiple
                            value={fieldIds.map(String)}
                            disabled={lookupsLoading || !!lookupsError || isSaving}
                            onChange={(event) =>
                                setFieldIds(
                                    Array.from(
                                        event.currentTarget.selectedOptions,
                                        (option) => Number(option.value)
                                    )
                                )
                            }
                        >
                            {lookups?.data.fields.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="edit-looking-for">Looking For</label>
                        <select
                            id="edit-looking-for"
                            multiple
                            value={categoryIds.map(String)}
                            disabled={lookupsLoading || !!lookupsError || isSaving}
                            onChange={(event) =>
                                setCategoryIds(
                                    Array.from(
                                        event.currentTarget.selectedOptions,
                                        (option) => Number(option.value)
                                    )
                                )
                            }
                        >
                            {lookups?.data.categories.map((option) => (
                                <option key={option.id} value={option.id}>
                                    {option.name}
                                </option>
                            ))}
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
                        disabled={
                            isSaving ||
                            !name.trim() ||
                            lookupsLoading ||
                            !!lookupsError ||
                            !lookups
                        }
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </section>
    )
}