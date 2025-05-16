declare const bkclientjs: {
    downloadAssetToSoftware: typeof downloadAssetToSoftware;
    getClientsNow: typeof getClientsNow;
    getClients: typeof getClients;
    getSoftwares: typeof getSoftwares;
    startClientPolling: typeof startClientPolling;
    stopClientPolling: typeof stopClientPolling;
};
export default bkclientjs;
/** Holds all the data reported by Client about it status and currently connected softwares.
 * @property {string} clientVersion - version of the Client, e.g. 1.2.1
 * @property {string} port - port on which the Client runs, later used to select through which Client we want to download
 * @property {Software[]} softwares - array of connected softwares (with appropriate add-ons installed)
 */
interface ClientStatus {
    clientVersion: string;
    port: string;
    softwares: Software[];
}
/** Holds the data about Software with apropriate add-on connected to Client.
 * @property {string} name - Blender/Godot/etc.
 * @property {string} version - Version of the software, e.g.: 4.2.1
 * @property {string} appID - PID aka Process ID of the software
 * @property {string} addonVersion - Version of the add-on installed in the Software, e.g.: 3.12.3
 * @property {string} clientPort - port of the Client to which Software is connected
 * @property {string} project - name of the project opened in the Software, used to identify the Software in more detailed way
 */
interface Software {
    name: string;
    version: string;
    appID: number;
    addonVersion: string;
    clientPort: string;
    projectName: string;
}
/** How much the functions should be verbose.
 * - 0 = FATAL: only fatal and unexpected errors will be reported
 * - 1 = INFO: little bit unexpected errors will be reported
 * - 2 = DEBUG: even failed requests will be reported, all details for debugging
 */
type Verbosity = 0 | 1 | 2;
/** Scan for the Clients right now. Make requests iterating over all possible ports Client can have on the localhost
 * and get their ClientStatuses if possible. Use the statuses to update UI and inform user where they can download the asset from browser gallery.
 * @param verbosity
 * @returns first successful response from local Client or null if something went wrong.
 */
declare function getClientsNow(verbosity?: Verbosity): Promise<ClientStatus[]>;
/** Schedule download of an Asset to specified Software.
 * @param clientPort - port on which the Client is running (there can be multiple Clients in rare cases)
 * @param assetID - which asset to download
 * @param assetBaseID - which asset to download TODO: remove this or assetBaseID and require just one
 * @param resolution - resolution of the asset - user should probably select this in the gallery
 * @param apiKey - apiKey of the logged user on the webpage - no need to sync the keys between several softwares
 * @param appID - Process ID of the running software to which we will download - list of all softwares is part of the
 * @returns true if download was successfully scheduled, otherwise false.
 */
declare function downloadAssetToSoftware(clientPort: string, appID: number, assetID: string, assetBaseID: string, resolution: string, apiKey: string): Promise<boolean>;
/** Get the clients saved in connectedClients variable.
 * Variable is updated periodically if the startClientPolling was called before.
 * @returns array of connected clients.
 */
declare function getClients(): ClientStatus[];
/** Get all available softwares from all conected Clients.
 * This array is what the user cares of - software to which they can download.
 * @returns array of connected Softwares.
 */
declare function getSoftwares(): Software[];
/** Start periodic polling/search on localhost for available Clients (and Softwares connected to them).
 *
 * @param {number} [interval=5000] how often the bkclientjs should check for the running Clients and Softwares
 * @param {boolean} [verbosity=0] true it will print debug info about the request to Client
 * @returns
 */
declare function startClientPolling(interval?: number, verbosity?: Verbosity): Promise<void>;
declare function stopClientPolling(): void;
