import { useUser } from "@clerk/react";
import { useEffect, useState } from "react";
import { useApi } from "../../lib/api";
import { useNavigate } from "react-router";
import "./onboarding.css";

export function OnboardingPage() {
    const { user, isLoaded } = useUser();
    const api = useApi();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const [location, setLocation] = useState("");
    const [school, setSchool] = useState("");
    const [educationLevel, setEducationLevel] = useState("");
    const [areaOfStudy, setAreaOfStudy] = useState("");
    const [lookingFor, setLookingFor] = useState("");
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

        try {
            await api.users.completeOnboarding({
                firstName,
                lastName,
                location,
                educationLevel,
                school,
                areaOfStudy,
                lookingFor,
            });        

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
                <input
                    id="location"
                    type = "text"
                    value = {location}
                    onChange = {(event) => setLocation(event.target.value)}
                    placeholder = "e.g. Columbus, OH"
                />
            </div> 
        </>
    )}
    {step === 2 && (
        <>
            <div>
                <p className="onboarding-field-label">
                    Level of Education (Optional)
                </p>

                <div className="onboarding-options">
                    {[
                        { value: "highschool", label: "High School", icon: "📚" },
                        { value: "undergraduate", label: "Undergraduate", icon: "🎓" },
                        { value: "graduate", label: "Graduate", icon: "🏫" },
                        { value: "doctoral", label: "Doctoral", icon: "🔬" },
                        { value: "other", label: "Other", icon: "✨" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`onboarding-option ${educationLevel === option.value ? "selected" : ""}`}
                            aria-pressed={educationLevel === option.value}
                            onClick={() =>
                                setEducationLevel(
                                    educationLevel === option.value ? "" : option.value
                                )
                            }
                        >
                            <span className="option-icon">{option.icon}</span>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="school">School Name (Optional)</label>
                <input
                    id="school"
                    type = "text"
                    value = {school}
                    onChange = {(event) => setSchool(event.target.value)}
                    placeholder = "The Ohio State University"
                />
            </div>  
             <div>
                <label htmlFor="areaOfStudy">Area of Study (Optional)</label>
                <input
                    id="areaOfStudy"
                    type = "text"
                    value = {areaOfStudy}
                    onChange = {(event) => setAreaOfStudy(event.target.value)}
                    placeholder = "Computer Science and Engineering"
                />
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
                    {[
                        { value: "job", label: "Jobs", icon: "💼" },
                        { value: "internship", label: "Internships", icon: "🏢" },
                        { value: "scholarship", label: "Scholarships", icon: "🎓" },
                        { value: "hackathons", label: "Hackathons", icon: "💻" },
                        { value: "grants", label: "Grants", icon: "💰" },
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`onboarding-option ${lookingFor === option.value ? "selected" : ""}`}
                            aria-pressed={lookingFor === option.value}
                            onClick={() =>
                                setLookingFor(
                                    lookingFor === option.value ? "" : option.value
                                )
                            }
                        >
                            <span className="option-icon">{option.icon}</span>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
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
                        <button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Get Started"}
                        </button>
                    )}
                </div>
            </form>
            </div>
        </section>
    );
} 