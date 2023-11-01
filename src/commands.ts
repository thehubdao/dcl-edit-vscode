import { Downloader } from "./downloader";
import { Version } from "./version";

export function download() {
    console.log('executing command: download');
    Downloader.download(Version.selectedVersion?.getVersionString());
}

export function start() {
    console.log('executing command: start');
    Downloader.start(Version.selectedVersion?.getVersionString());
}

export function clearCache() {
    console.log('executing command: clearCache');
    Downloader.clearDownloaded();
}