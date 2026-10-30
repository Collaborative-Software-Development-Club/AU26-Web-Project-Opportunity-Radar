
async function inspectDevpostApi(): Promise<void> {
    const url = 'https://devpost.com/api/hackathons?status=open';

    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));

        const body = await response.text();
        console.log('Response preview:', body.slice(0, 2000));
    } catch (error) {
        console.error('Request failed:', error);
    }
}

inspectDevpostApi();
