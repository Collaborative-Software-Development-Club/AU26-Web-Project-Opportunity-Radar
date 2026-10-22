import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { OrganizationDetail } from "@radar/contracts"
import { OpportunityCard } from "@/features/opportunities/components/opportunity-card";
import { Button } from "@/components/ui/button";

const formateDate = (data: OrganizationDetail) => {
    let created: string = "";
    let updated: string = "";
    if(data.createdAt !== null){
        let dCreated: Date = new Date(Date.parse(data.createdAt));
        created = `Created ${dCreated.getMonth()+1}/${dCreated.getDate()}/${dCreated.getFullYear()}`;
    }
    if(data.updatedAt !== null){
        created += " - ";
        let dUpdated: Date = new Date(Date.parse(data.updatedAt));
        updated = `Last Updated ${dUpdated.getMonth()+1}/${dUpdated.getDate()}/${dUpdated.getFullYear()}`;
    }
    return <p className="align-middle">{created + updated}</p>;
}

export function OragnizationPageDetails(data: OrganizationDetail){
    return(
        <section>
            {data.logoUrl === null ? <h1 className="text-teal-800 font-serif text-lg leading-snug text-5xl font-bold"> {data.name} </h1>:<img src={data.logoUrl} alt={data.name} />}
            <span className="flex gap-6 items-center m-6">
                {
                    data.websiteUrl !== null && 
                    <Button className="button button-secondary" onClick={() =>{window.open(data.websiteUrl!, "_blank", "noopener,noreferrer")}}>Visit Website</Button>
                }
                
                {formateDate(data)}
            </span>
            

            <Card >
                {data.opportunities !== null && <CardHeader><h2>Opportunities</h2></CardHeader>}
                <CardContent className="grid gap-3">
                    {data.opportunities.map(opportunity => (
                        <OpportunityCard
                            opportunity={opportunity}
                            badgeClass={""}
                            key={opportunity.id}
                        />
                        ))
                    }
                </CardContent> 
            </Card>
        </section>
    )
}