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
const CLIENT_PORTS = ["62485", "65425", "55428", "49452", "35452", "25152", "5152", "1234"];
const DISCOVERY_TIMEOUT_MS = 250;
let pollingInterval;
let connectedClients = [];
/** Lock to prevent overlapping polling cycles. */
let _pollingBusy = false;
function normalizeDiscoveryTimeoutMs(timeoutMs) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return DISCOVERY_TIMEOUT_MS;
    }
    return timeoutMs;
}
/** Scan for the Clients right now. Make requests iterating over all possible ports Client can have on the localhost
 * and get their ClientStatuses if possible. Use the statuses to update UI and inform user where they can download the asset from browser gallery.
 * @param verbosity
 * @param timeoutMs timeout for each discovery request in milliseconds
 * @returns discovered local Clients or empty array if none responded.
 */
function getClientsNow() {
    return __awaiter(this, arguments, void 0, function* (verbosity = 0, timeoutMs = DISCOVERY_TIMEOUT_MS) {
        const effectiveTimeoutMs = normalizeDiscoveryTimeoutMs(timeoutMs);
        const statuses = yield Promise.all(CLIENT_PORTS.map((port) => __awaiter(this, void 0, void 0, function* () {
            /** Defined in bkclientjsStatusHandler in https://github.com/BlenderKit/BlenderKit/blob/main/client/main.go. */
            const url = `http://localhost:${port}/bkclientjs/status`;
            let clientStatus = yield _tryClientStatus(url, verbosity, effectiveTimeoutMs);
            if (clientStatus === null) {
                return null;
            }
            clientStatus.port = port;
            return clientStatus;
        })));
        return statuses.filter((status) => status !== null);
    });
}
/** Try to get the ClientStatus on selected address. This can fail as we are not sure if Client is available there.
 * Returns the status if Client runs on the URL, or null if the request has failed or response is not OK (could be another software running there).
 * @param url Address where to check if Client replies
 * @param timeoutMs Timeout for a single discovery request in milliseconds
 * @returns response of the Client or null if something went wrong
 */
function _tryClientStatus(url_1) {
    return __awaiter(this, arguments, void 0, function* (url, verbosity = 0, timeoutMs = DISCOVERY_TIMEOUT_MS) {
        let clientStatus;
        let controller;
        let timeoutHandle;
        if (typeof AbortController === "function") {
            controller = new AbortController();
            timeoutHandle = setTimeout(() => controller === null || controller === void 0 ? void 0 : controller.abort(), timeoutMs);
        }
        else if (verbosity > 1) {
            console.debug("AbortController not available, discovery timeout disabled for:", url);
        }
        try {
            const resp = yield fetch(url, controller ? { signal: controller.signal } : undefined);
            if (resp.status !== 200) {
                if (verbosity > 0)
                    console.log(`Wrong status code: ${resp.status}`);
                return null;
            }
            if (verbosity > 1)
                console.log("Client response:", resp);
            clientStatus = (yield resp.json());
        }
        catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                if (verbosity > 1)
                    console.debug(`Discovery timeout (${timeoutMs}ms): ${url}`);
                return null;
            }
            if (verbosity > 1)
                console.error("Error getting response:", err);
            return null;
        }
        finally {
            if (timeoutHandle !== undefined) {
                clearTimeout(timeoutHandle);
            }
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
/** Start periodic polling/search on localhost for available Clients (and Softwares connected to them).
 *
 * @param {number} [interval=5000] how often the bkclientjs should check for the running Clients and Softwares
 * @param {number} [verbosity=0] how verbose the logging should be (0=fatal, 1=info, 2=debug)
 * @param {UpdateCallback | PollingOptions} [onUpdateOrOptions] options object, or a bare UpdateCallback for backward compat
 */
function startClientPolling() {
    return __awaiter(this, arguments, void 0, function* (interval = 5000, verbosity = 0, onUpdateOrOptions) {
        var _a;
        const onUpdate = typeof onUpdateOrOptions === 'function'
            ? onUpdateOrOptions
            : onUpdateOrOptions === null || onUpdateOrOptions === void 0 ? void 0 : onUpdateOrOptions.onUpdate;
        const timeoutMs = typeof onUpdateOrOptions === 'object'
            ? ((_a = onUpdateOrOptions === null || onUpdateOrOptions === void 0 ? void 0 : onUpdateOrOptions.timeoutMs) !== null && _a !== void 0 ? _a : DISCOVERY_TIMEOUT_MS)
            : DISCOVERY_TIMEOUT_MS;
        if (pollingInterval) {
            console.log("Polling is already running");
            return;
        }
        try { // Start polling right away
            _pollingBusy = true;
            connectedClients = yield getClientsNow(verbosity, timeoutMs);
            if (verbosity > 0)
                console.log("Updated clients:", connectedClients);
        }
        catch (error) {
            if (verbosity > 0)
                console.error("Error while fetching clients (immediate):", error);
        }
        finally {
            _pollingBusy = false;
        }
        // Fire callback after the initial fetch
        try {
            if (onUpdate)
                yield onUpdate(connectedClients);
        }
        catch (callbackError) {
            if (verbosity > 0)
                console.error("onUpdate (initial) failed:", callbackError);
        }
        // Recurring polling
        pollingInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (_pollingBusy) {
                if (verbosity > 1)
                    console.log("Skip poll: previous cycle still running.");
                return;
            }
            _pollingBusy = true;
            try {
                connectedClients = yield getClientsNow(verbosity, timeoutMs);
                if (verbosity > 0)
                    console.log("Updated clients:", connectedClients);
                if (onUpdate)
                    yield onUpdate(connectedClients); // <- runs AFTER cycle finishes
            }
            catch (error) {
                if (verbosity > 1)
                    console.error("Error while fetching clients:", error);
            }
            finally {
                _pollingBusy = false;
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
