import { Downloader } from "./downloader";
import { Version } from "./version";

export function download() {
    console.log('executing command: download');
    Downloader.download(Version.selectedVersion?.getVersionString());
}

export function start() {
    console.log('executing command: start');
    Downloader.getNewestVersion().then(version => {
        console.log('newest version: ' + version);
    });

    var downloaded = Downloader.findAllDownloaded();
    console.log('downloaded versions: [' + downloaded.map((v)=>v.get()).join(', ') + ']');

    Downloader.findAllAvailable().then(versions => {
        console.log('available versions: [' + versions.map((v)=>v.get()).join(', ') + ']');
    });
}

export function clearCache() {
    console.log('executing command: clearCache');
    Downloader.clearDownloaded();
}