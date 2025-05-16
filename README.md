# bkclientjs
JavaScript library for communication between Server and locally running BlenderKit-Client.
Library allows to order in browser the asset downloads to the softwares connected to BlenderKit-Client.

## Usage

### Install

For usage on devel and production server, the library build is released into `dev` and `prod` branches.
`dev` branch is build every time there is a push to `main` branch, the `prod` branch build needs to be triggered manually.
Files are located in `dist` folder. 
(For archival reasons, or when exact version control is needed, the library is also released via GitHub Releases with semantic versioning.)

Production files:
- https://raw.githubusercontent.com/BlenderKit/bkclientjs/refs/heads/prod/dist/main.js
- https://raw.githubusercontent.com/BlenderKit/bkclientjs/refs/heads/prod/dist/main.d.ts

Development files:
- https://raw.githubusercontent.com/BlenderKit/bkclientjs/refs/heads/dev/dist/main.js
- https://raw.githubusercontent.com/BlenderKit/bkclientjs/refs/heads/dev/dist/main.d.ts

You can also access the files via jsDelivr CDN:
- https://cdn.jsdelivr.net/gh/BlenderKit/bkclientjs@prod/dist/main.js
- https://cdn.jsdelivr.net/gh/BlenderKit/bkclientjs@prod/dist/main.d.ts
- https://cdn.jsdelivr.net/gh/BlenderKit/bkclientjs@dev/dist/main.js
- https://cdn.jsdelivr.net/gh/BlenderKit/bkclientjs@dev/dist/main.d.ts


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
const ok = bkclientjs.downloadAssetToSoftware(client.port, client.software[0].appID, assetID, assetBaseID, resolution, apiKey)
```

Or you can start a polling and then get the Clients from variable filled by the polling:
```javascript
bkclientjs.startClientPolling(1000); // library will check for the Clients every 1000ms,

// later - ideally in your own Timeout update function
// results are available without need for await via:
let clients = bkclientjs.getClients()

// or you can get the list of all software - this is what cares of:
let softwares = bkclientjs.getSoftwares()

const ok = bkclientjs.downloadAssetToSoftware(softwares[0].clientPort, softwares[0].appID, assetID, assetBaseID, resolution, apiKey)
```

### Verbosity

You can make the library more verbose by calling the with verbosity 1 (INFO) or 2 (DEBUG): `bkclientjs.startClientPolling(1000, 2);`.

## Developing
1. `npm install`
1. `npm run build` - compile TS to JS in ./dist
2. `http-server` - serve the example index.html file
3. navigate to localhost:8080, on refresh browser tries to fetch data from locally running BlenderKit-client, prints to console

## Release

Start the release workflow in GitHub Actions: https://github.com/BlenderKit/bkclientjs/actions/workflows/release.yml.
Bump the version in package.json, and optionally set the `production` input to `true` to create a production release.
