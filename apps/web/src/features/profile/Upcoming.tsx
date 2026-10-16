type UpcomingCardProps =
{
    title: string;
    organization: string;
    badge: string;
    date: string;
    category: "scholarship" | "competition" | "event" | "job";

}

export function UpcomingCard(props: UpcomingCardProps)
{
const icons: Record<string, string> =
{
    scholarship: "🎓",
    competition: "🏆",
    event: "📅",
    job: "💼"
}


return (
    <article className="upcoming">
         <div className={`upcoming-icon ${props.category}-icon`}>
            {icons[props.category]}
        </div>
        <div className="upcoming-details">
            <p className="upcoming-organization">
                {props.organization}
            </p>

            <h3 className="upcoming-title">
                {props.title}
            </h3>

            <span className={`upcoming-badge ${props.category}`}>
                {props.badge}
            </span>

            <p className="upcoming-date">
            {props.date}
            </p>
        </div>
            
    </article>

)
}