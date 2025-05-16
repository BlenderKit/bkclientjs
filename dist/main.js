var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const bkclientjs = {
    downloadAssetToSoftware,
    getClientsNow,
    getClients,
    getSoftwares,
    startClientPolling,
    stopClientPolling,
};
export default bkclientjs;
/** As defined in CLIENT_PORTS in https://github.com/BlenderKit/BlenderKit/blob/main/global_vars.py */
let CLIENT_PORTS = ["62485", "65425", "55428", "49452", "35452", "25152", "5152", "1234"];
let pollingInterval;
let connectedClients;
/** Scan for the Clients right now. Make requests iterating over all possible ports Client can have on the localhost
 * and get their ClientStatuses if possible. Use the statuses to update UI and inform user where they can download the asset from browser gallery.
 * @param verbosity
 * @returns first successful response from local Client or null if something went wrong.
 */
function getClientsNow() {
    return __awaiter(this, arguments, void 0, function* (verbosity = 0) {
        let statuses = [];
        for (const port of CLIENT_PORTS) {
            /** Defined in bkclientjsStatusHandler in https://github.com/BlenderKit/BlenderKit/blob/main/client/main.go. */
            const url = `http://localhost:${port}/bkclientjs/status`;
            let clientStatus = yield _tryClientStatus(url, verbosity);
            if (clientStatus === null) {
                continue;
            }
            clientStatus.port = port;
            statuses.push(clientStatus);
        }
        return statuses;
    });
}
/** Try to get the ClientStatus on selected address. This can fail as we are not sure if Client is available there.
 * Returns the status if Client runs on the URL, or null if the request has failed or response is not OK (could be another software running there).
 * @param url Address where to check if Client replies
 * @returns response of the Client or null if something went wrong
 */
function _tryClientStatus(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, verbosity = 0) {
        let clientStatus;
        try {
            const resp = yield fetch(url);
            if (resp.status !== 200) {
                if (verbosity > 0)
                    console.log(`Wrong status code: ${resp.status}`);
                return null;
            }
            console.log("Client response:", resp);
            clientStatus = (yield resp.json());
        }
        catch (err) {
            if (verbosity > 1)
                console.error("Error getting response:", err);
            return null;
        }
        if (clientStatus.softwares === null) {
            clientStatus.softwares = [];
        }
        return clientStatus;
    });
}
/** Schedule download of an Asset to specified Software.
 * @param clientPort - port on which the Client is running (there can be multiple Clients in rare cases)
 * @param assetID - which asset to download
 * @param assetBaseID - which asset to download TODO: remove this or assetBaseID and require just one
 * @param resolution - resolution of the asset - user should probably select this in the gallery
 * @param apiKey - apiKey of the logged user on the webpage - no need to sync the keys between several softwares
 * @param appID - Process ID of the running software to which we will download - list of all softwares is part of the
 * @returns true if download was successfully scheduled, otherwise false.
 */
function downloadAssetToSoftware(clientPort, appID, assetID, assetBaseID, resolution, apiKey) {
    return __awaiter(this, void 0, void 0, function* () {
        /** Defined in bkclientjsGetAssetHandler in https://github.com/BlenderKit/BlenderKit/blob/main/client/main.go. */
        const url = `http://localhost:${clientPort}/bkclientjs/get_asset`;
        const data = JSON.stringify({
            "api_key": apiKey,
            "asset_id": assetID,
            "asset_base_id": assetBaseID,
            "resolution": resolution,
            "app_id": Number(appID),
        });
        try {
            const resp = yield fetch(url, {
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
    });
}
// MARK: GET FUNCTIONS
/** Get the clients saved in connectedClients variable.
 * Variable is updated periodically if the startClientPolling was called before.
 * @returns array of connected clients.
 */
function getClients() {
    return connectedClients;
}
/** Get all available softwares from all conected Clients.
 * This array is what the user cares of - software to which they can download.
 * @returns array of connected Softwares.
 */
function getSoftwares() {
    let connectedSoftwares = [];
    for (var client of connectedClients) {
        for (var software of client.softwares) {
            connectedSoftwares.push(software);
        }
    }
    return connectedSoftwares;
}
// MARK: POLLING
/** Start periodic polling/search on localhost for available Clients (and Softwares connected to them).
 *
 * @param {number} [interval=5000] how often the bkclientjs should check for the running Clients and Softwares
 * @param {boolean} [verbosity=0] true it will print debug info about the request to Client
 * @returns
 */
function startClientPolling() {
    return __awaiter(this, arguments, void 0, function* (interval = 5000, verbosity = 0) {
        if (pollingInterval) {
            console.log("Polling is already running");
            return;
        }
        try { // Start polling right away
            connectedClients = yield getClientsNow();
            console.log("Updated clients:", connectedClients);
        }
        catch (error) {
            if (verbosity > 0) {
                console.error("Error while fetching clients (immediate):", error);
            }
        }
        pollingInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            try {
                connectedClients = yield getClientsNow();
                if (verbosity > 0)
                    console.log("Updated clients:", connectedClients);
            }
            catch (error) {
                if (verbosity > 1)
                    console.error("Error while fetching clients:", error);
            }
        }), interval);
        console.log(`Polling started with interval: ${interval}ms, verbosity: ${verbosity}`);
    });
}
function stopClientPolling() {
    if (!pollingInterval) {
        console.log("No polling is running.");
        return;
    }
    clearInterval(pollingInterval);
    pollingInterval = undefined;
    console.log("Polling stopped.");
}
