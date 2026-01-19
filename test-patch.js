// using native fetch

async function test() {
    try {
        const listRes = await fetch('http://localhost:8080/api/v1/feedback');
        const list = await listRes.json();
        if (!list.feedbacks || list.feedbacks.length === 0) {
            console.log("No feedbacks to test");
            return;
        }
        const id = list.feedbacks[0].id;
        console.log('Testing ID:', id);

        const res = await fetch(`http://localhost:8080/api/v1/feedback/${id}/resolve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolved: !list.feedbacks[0].resolved })
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error(e);
    }
}

test();
