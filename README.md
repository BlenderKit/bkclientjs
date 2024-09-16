# bkclientjs
JavaScript library for communication between Server and locally running BlenderKit-Client.
Library allows to order in browser the asset downloads to the softwares connected to BlenderKit-Client.

## Usage

### Get running Clients
With the library you can easily scan localhost for all currently running BlenderKit-Clients.
Library returns found Clients as array of ClientStatus - array is empty if no Client responded.
Normally there should be 1 Client, but can be more in rare cases.
Every Client status contains array of softwares connected to it - there could be Blender or more of them, Godot or more of them.
Use the returned array of Client statuses to show download options to user.
Save it into a variable so it can be later used to schedule download.

Client is uniquely identified by its Port.
Software is uniquely identified by its PID (Process ID).

### Schedule download
User is presented with download options on the asset they are previewing in the browser asset gallery.
E.g.: they see they have 2 Blenders and 1 Godot connected. They choose download to Godot.
You can ask for the download with this library specifying the AssetID, software PID, apiToken and clientPort.
Library will then send request to Client which will schedule the download.

Downloads will differ based on target software - for Blender we might do some mambo jumbo like preview it in search results.
For Godot and other softwares we might just download the asset into specified directory - these are simple yet effective add-ons.

### Example:

If you want to get the Clients on demand right now:
```javascript
let client = await bkclientjs.getClientsNow()
if (client.length === 0) {
    return
}
const ok = bkclientjs.downloadAssetToSoftware(client.port, assetID, assetBaseID, resolution, apiKey, client.software[0].appID)
```

Or you can start a polling and then get the Clients from variable filled by the polling:
```javascript
bkclientjs.startClientPolling(500); // library will check for the Clients every 500ms

// later - ideally in your own Timeout update function
// results are available without need for await via:
let clients = bkclientjs.getClients()

// or you can get the list of all software - this is what cares of:
let softwares = bkclientjs.getSoftwares()
```

## Developing
1. `npm run build` - compile TS to JS in ./dist
2. `http-server` - serve the example index.html file
3. navigate to localhost:8080, on refresh browser tries to fetch data from locally running BlenderKit-client, prints to console
