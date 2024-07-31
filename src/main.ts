let CLIENT_PORTS = ["65425", "55428", "49452", "35452", "25152", "5152", "1234", "62485"];
let activePort = "";
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
            activePort = port;
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

async function Download (assetID: string, assetBaseID: string, resolution: string, apiKey: string, appID: number): Promise<boolean> {
    const url = `http://localhost:${activePort}/bkclientjs/get_asset`;
    const data = JSON.stringify({
        "api_key": apiKey,
        "asset_id": assetID,
        "asset_base_id": assetBaseID,
        "resolution": resolution,
        "app_id": Number(appID),
    });

    try {
        const resp = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: data,
        });
        if (resp.status === 200) {
            return true;
        }
    }
    catch (err) {
        console.error(err);
    }

    return false;
}

interface Software {
    name: string; // Blender/Godot/etc.
    version: string; // Version of the software, e.g. 4.2.1
    appID: number; // PID aka Process ID
    addonVersion: string; // Version of the add-on, e.g. 3.12.2
}

interface ClientStatus {
    clientVersion: string; // 1.2.1
    softwares: Software[]; // List of connected softwares with communicating add-ons
}

async function OnLoad() {
    const resp = await GetClientStatus();
    if (resp === null) {
        return;
    }

    const data = await resp.text();
    let jsonObj = JSON.parse(data);

    let clientStatus = jsonObj as ClientStatus;
    console.log("Client version:", clientStatus.clientVersion);
    
    for(let i=0; i<clientStatus.softwares.length; i++){
        console.log(clientStatus.softwares[i]);
    };
}
