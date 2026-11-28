import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { ApiError, useApi } from "../../lib/api";
import { useNavigate } from "react-router";
import "./onboarding.css";
import { useApiQuery } from "@/hooks/use-api-query";
import {Briefcase, Building2, GraduationCap, Laptop, HandCoins, Users, Award, Microscope, HeartHandshake, School, BookOpen,} from "lucide-react";

const categoryIcons: Record<string, typeof Briefcase> = {
    "career fair": Users,
    "fellowship": Award,
    "grant": HandCoins,
    "hackathon": Laptop,
    "internship": Building2,
    "new grad": Briefcase,
    "research": Microscope,
    "scholarship": GraduationCap,
    "volunteer": HeartHandshake,
};

const educationIcons: Record<string, typeof Briefcase> = {
    "high school": School,
    "undergraduate": GraduationCap,
    "graduate": BookOpen,
};

export function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const api = useApi();
    const navigate = useNavigate();
    const {
        data: lookups,
        isLoading: lookupsLoading,
        error: lookupsError,
    } = useApiQuery("lookups", (api, signal) =>
        api.lookups.list({ signal })
    );
    const [name, setName] = useState("");
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const [location, setLocation] = useState("");
    //const [school, setSchool] = useState("");
    const [educationLevel, setEducationLevel] = useState<number | null > (null);
    const [areaOfStudy, setAreaOfStudy] = useState<number | null > (null);
    const [lookingFor, setLookingFor] = useState<number | null > (null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1);


    useEffect(() => {
        if (isLoaded && user) {
            setName(user.fullName ?? "");
        }
    }, [isLoaded, user]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (step !== 3 || !name.trim()) return;

        setIsSaving(true);
        setError("");

        const [firstName, ...remainingNames] = name.trim().split(/\s+/);
        const lastName = remainingNames.join(" ");

        const changes = {
            firstName,
            lastName,
            locationIds: location ? [location] : undefined,
            educationLevelIds: educationLevel !== null
                ? [educationLevel] : undefined,
            fieldIds: areaOfStudy !== null
                ? [areaOfStudy] : undefined,
            categoryIds: lookingFor !== null
                ? [lookingFor] : undefined,
        };

        try {
            for (let attempt = 0; ; attempt++) {
                try {
                    await api.users.updateMe(changes);
                    break;
                } catch (error) {
                    if (!(error instanceof ApiError && error.status === 404) || attempt >= 30) throw error;
                    setError("Finishing your account setup. This can take a minute.");
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }
            }

        console.log("Onboarding saved successfully:");
        navigate("/", {replace: true});
        } catch (error) {
            console.error("Failed to save onboarding:", error);
            setError("Failed to save your information. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <section className="onboarding-overlay">
            <div className="onboarding-card">
                <div className="onboarding-progress">
                    {[1, 2, 3].map((number) => (
                        <span
                        key={number}
                        className={number <= step ? "active" : ""}
                        />
                    ))}
                </div>
            <h1>
                {step === 1 && "Welcome to Opportunity Radar!"}
                {step === 2 && "Tell us about your education."}
                {step === 3 && "Find your next opportunity."}
            </h1>
            <p>
                {step === 1 && "Personalize your experience."}
                {step === 2 && "Find opportunities to enrich your academic journey."}
                {step === 3 && "What kind of opportunities are you interested in?"}
            </p>

            <form onSubmit={handleSubmit}>
    {step === 1 && (
        <>
            <div>
                <label htmlFor = "name">Full Name</label>
                <input
                    id = "name"
                    type = "text"
                    value = {name}
                    onChange = {(event) => setName(event.target.value)}
                    placeholder = "Enter your full name"
                    required
                />
            </div>
            <div>
                <label htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    placeholder="Enter your email address"
                    readOnly
                />
            </div>
            <div>
                <label htmlFor="location">Location (Optional)</label>
                <select
                    id="location"
                    value = {location}
                    onChange = {(event) => setLocation(event.target.value)}
                    disabled = {lookupsLoading || !!lookupsError}
                >
                    <option value = "">Select a location</option>
                    {lookups?.data.locations.map((option) => (
                        <option key = {option.id} value = {option.id}>
                            {[option.city, option.stateRegion, option.country]
                            .filter(Boolean)
                            .join(", ")}
                        </option>
                    ))}
                </select>
            </div>
        </>
    )}
    {step === 2 && (
        <>
            <div>
                <div className="onboarding-options">
                    {lookups?.data.educationLevels.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className={`onboarding-option ${educationLevel === option.id ? "selected" : ""}`}
                            aria-pressed={educationLevel === option.id}
                            disabled={lookupsLoading || !!lookupsError}
                            onClick={() =>
                                setEducationLevel(
                                    educationLevel === option.id ? null : option.id
                                )
                            }
                        >
                            <span className="option-icon">
                                {(() => {
                                    const Icon =
                                        educationIcons[option.name.toLowerCase()]
                                        ?? GraduationCap;

                                    return <Icon size={22} />;
                                })()}
                            </span>
                            <span>{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="areaOfStudy">Area of Study (Optional)</label>
                <select
                    id="areaOfStudy"
                    value={areaOfStudy ?? ""}
                    onChange={(event) =>
                        setAreaOfStudy(
                            event.target.value === ""
                                ? null
                                : Number(event.target.value)
                        )
                    }
                    disabled={lookupsLoading || !!lookupsError}
                >
                    <option value="">Select an area of study</option>

                    {lookups?.data.fields.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </select>
            </div>
        </>
    )}
    {step === 3 && (
        <>
            <div>
                <p className="onboarding-field-label">
                    Looking for (Optional)
                </p>
                <div className="onboarding-options">
                    {lookups?.data.categories.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            className={`onboarding-option ${lookingFor === option.id ? "selected" : ""}`}
                            aria-pressed={lookingFor === option.id}
                            disabled={lookupsLoading || !!lookupsError}
                            onClick={() =>
                                setLookingFor(
                                    lookingFor === option.id ? null : option.id
                                )
                            }
                        >
                            <span className="option-icon">
                                {(() => {
                                    const Icon =
                                        categoryIcons[option.name.toLowerCase()]
                                        ?? Briefcase;

                                    return <Icon size={22} />;
                                })()}
                            </span>
                            <span>{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    )}
    {lookupsLoading && (
        <p role="status">Loading preference options...</p>
    )}

    {!!lookupsError && (
        <p role="alert">
            Unable to load preference options. Please refresh the page.
        </p>
    )}
                {error && <p role="alert">{error}</p>}

                <div className="onboarding-actions">
                    {step > 1 && (
                        <button type="button" onClick  = {() => setStep(step -1)}>
                            Back
                        </button>
                    )}

                    {step === 2 && (
                        <button type="button" onClick  = {() => setStep(3)}>
                            Skip
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            type="button"
                            className="onboarding-next"
                            disabled={step === 1 && !name.trim()}
                            onClick={() => setStep(step + 1)}
                        >
                            Continue →
                        </button>
                    ) : (
                        <button type="submit" disabled={isSaving || lookupsLoading || !!lookupsError}>
                            {isSaving ? "Saving..." : "Get Started"}
                        </button>
                    )}
                </div>
            </form>
            </div>
        </section>
    );
}