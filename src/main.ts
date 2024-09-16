export { DownloadAssetToSoftware, GetClientStatuses, OnLoad };

let CLIENT_PORTS = ["65425", "55428", "49452", "35452", "25152", "5152", "1234", "62485"];


async function ClientIsOnline(): Promise<boolean> {
    const resp = await GetClientStatuses();
    return resp!== null;
}

/** Iterate over all possible ports Client can have on the localhost.
 * 
 * @returns first successful response from local Client or null if something went wrong.
 */
async function GetClientStatuses(): Promise<ClientStatus[]> {
    let statuses: ClientStatus[] = []
    for (const port of CLIENT_PORTS) {
        const clientStatus = await TryClientStatus(`http://localhost:${port}/bkclientjs/status`)
        if (clientStatus === null) {
            continue
        }
        statuses.push(clientStatus);
    }
    return statuses;
}

/**
 * 
 * @param url Address where to check if Client replies
 * @returns response of the Client or null if something went wrong
 */
async function TryClientStatus(url: string): Promise<ClientStatus|null> {
    try {
        const resp = await fetch(url);
        if (resp.status === 200) {
            console.log("Client response:", resp)
            let clientStatus = await resp.json() as ClientStatus;

            return clientStatus
        }
        console.log(`Bad status code: ${resp.status}`);
    } catch (err) {
        console.error(err);
    }

    return null;
}

/** Schedule download of an Asset by its AssetID and AssetBaseID in specified resolution.
* Target software is specified by appID - browser gets the appID as part of the ClientStatus-Softwares.
* apiKey has to be provided so we do not need to sync the logins between web and local Client/Blender/etc.
* TODO: remove AssetBaseID and use just AssetID.
*/

/** Schedule download of an Asset to specified Software.
 * @param clientPort - port on which the Client is running (there can be multiple Clients in rare cases)
 * @param assetID - which asset to download
 * @param assetBaseID - which asset to download TODO: remove this or assetBaseID and require just one
 * @param resolution - resolution of the asset - user should probably select this in the gallery
 * @param apiKey - apiKey of the logged user on the webpage - no need to sync the keys between several softwares
 * @param appID - Process ID of the running software to which we will download - list of all softwares is part of the 
 * @returns 
 */
async function DownloadAssetToSoftware (clientPort: string, assetID: string, assetBaseID: string, resolution: string, apiKey: string, appID: number): Promise<boolean> {
    const url = `http://localhost:${clientPort}/bkclientjs/get_asset`;
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
    clientVersion: string; // e.g. 1.2.1
    softwares: Software[]; // List of connected softwares with communicating add-ons
}

async function OnLoad() {
    const clientStatuses = await GetClientStatuses();
    if (clientStatuses === null) {
        return;
    }
    console.log("Clients available:", clientStatuses)
    for(let i=0; i<clientStatuses.length; i++) {
        console.log(`${i}. Client (version=${clientStatuses[i].clientVersion})`);   
        for(let x=0; x<clientStatuses[i].softwares.length; x++){
            console.log(`- ${x}. Software: ${clientStatuses[i].softwares[x]}`);
        };
    };
}
