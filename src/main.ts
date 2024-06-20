const CLIENT_PORTS = ["65425", "55428", "49452", "35452", "25152", "5152", "1234", "62485"];
let socket: WebSocket | null = null;

window.onload = OnLoad; // Correctly assign the OnLoad function to the window.onload event


async function ClientIsOnline(): Promise<boolean> {
    const resp = await GetClientStatus();
    return resp!== null;
}

async function GetClientStatus(): Promise<Response|null> {
    for (const port of CLIENT_PORTS) {
        const resp = await TryClientStatus(`http://localhost:${port}/bkclientjs/status`)
        if (resp!== null) {
            return resp;
        }
    }
    return null;
}

async function TryClientStatus(url: string): Promise<Response|null> {
    try {
        const resp = await fetch(url);
        if (resp.status === 200) {
            return resp
        }
        console.log(`Bad status code: ${resp.status}`);

    } catch (err) {
        console.error(err);
    }

    return null;
}

async function OnLoad() {
    const resp = await GetClientStatus();
    console.log(resp);
    if (resp === null) {
        return;
    }

    const test = await resp.text();
    console.log(test);
}
