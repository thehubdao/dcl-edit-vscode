import { Downloader } from "./downloader";

export function download(){
    console.log('executing command: download');
    Downloader.download("3.0.0");
}

export function start(){
    console.log('executing command: start');
    Downloader.getNewestVersion().then(version => {
        console.log('newest version: ' + version);
    });
}

export function clearCache(){
    console.log('executing command: clearCache');
    Downloader.clearDownloaded();
}