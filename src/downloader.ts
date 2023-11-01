import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import axios from 'axios';
import * as targz from 'targz';
import { Version } from './version';

export class Downloader {
    private static _context: vscode.ExtensionContext;
    private static _selectedVersion: string;

    static init(context: vscode.ExtensionContext) {
        this._context = context;
    }

    private static getCurrentPlatform(): string | undefined {
        let platformName = '';
        let binaryName = '';

        const type = os.type();
        //const arch = os.arch();

        if (type === "Windows_NT") {
            platformName = "windows-x86";
            binaryName = "dcl-edit.exe";
        } else if (type === "Linux") {
            platformName = "linux";
            binaryName = "dcl-edit";
        } else if (type === "Darwin") {
            platformName = "macos";
            binaryName = "Contents/MacOS/dcl-edit";
        } else {
            console.error(`dcl-edit is not available for your platform (${type})`);
            return undefined;
        }

        return platformName;
    }

    private static getBinaryPath(): string {
        // get the path to the downloaded binary
        const binaryPath = this._context.globalStorageUri.fsPath;
        if (!fs.existsSync(binaryPath)) {
            fs.mkdirSync(binaryPath);
        }
        return binaryPath + '/';
    }

    private static getSpecificBinaryPath(version: string): string {
        // get the path to the downloaded binary
        const binaryPath = this.getBinaryPath();
        const folder = binaryPath + `dcl-edit-${version}-${this.getCurrentPlatform()}`;
        return folder + '/';
    }

    public static async getNewestVersion(): Promise<string> {
        // get the newest version from github
        return new Promise<string>((resolve, reject) => {
            const link = `https://api.github.com/repos/metagamehub/dcl-edit/releases/latest`;
            axios.get(link).then(response => {
                resolve(response.data.tag_name);
            }).catch(error => {
                reject(error);
            });
        });
    }

    public static isDownloaded(version: string): boolean {
        // check if the binary is already downloaded`;
        return fs.existsSync(this.getSpecificBinaryPath(version));
    }

    public static async download(version?: string) {
        if (!version) {throw new Error("Version not specified");}

        return new Promise<void>((resolve, reject) => {
            // gather platform information
            var platformName = Downloader.getCurrentPlatform();
            if (!platformName) { reject("Platform not supported"); }

            // download the binary without the binary install package
            const link = `https://github.com/metagamehub/dcl-edit/releases/download/${version}/dcl-edit-${version}-${platformName}.tar.gz`;
            const folder = Downloader.getBinaryPath();
            const filePath = folder + `dcl-edit-${version}-${platformName}.tar.gz`;

            console.log('Downloading ' + link + ' to ' + filePath);

            axios.get(link, { responseType: "arraybuffer" }).then(response => {
                fs.writeFileSync(filePath, response.data);
                targz.decompress({
                    src: filePath,
                    dest: folder
                }, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        fs.rmSync(filePath);
                        console.log("Downloaded dcl-edit version " + version + " to " + folder);
                        resolve();
                    }
                });
            }).catch(error => {
                reject(error);
            });
        });
    }

    public static async findAllAvailable(): Promise<Version[]> {
        const link = `https://api.github.com/repos/metagamehub/dcl-edit/releases`;
        return new Promise<Version[]>((resolve, reject) => {
            axios.get(link).then(response => {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                resolve(response.data.map((release: {tag_name:string}) => {return new Version(release.tag_name);}));
            }).catch(error => {
                reject(error);
            });
        });
    }

    public static async clearDownloaded() {
        return new Promise<void>((resolve, reject) => {
            // clear the downloaded binary
            const binaryPath = this.getBinaryPath();
            fs.rm(binaryPath, { recursive: true }, () => {
                this.getBinaryPath();
                resolve();
            });
        });
    }

    public static findAllDownloaded(): Version[] {
        const binaryPath = this.getBinaryPath();
        const folders = fs.readdirSync(binaryPath);
        const dclEditFolders = folders.filter(folder => {
            return folder.startsWith('dcl-edit-');
        });
        const versions = dclEditFolders.map(folder => {
            const parts = folder.split('-');
            return new Version(parts[2]);
        });
        return versions;
    }
}