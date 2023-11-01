import * as vscode from 'vscode';
import * as os from 'os';
import * as fs from 'fs';
import axios from 'axios';
import * as targz from 'targz';
import { Version } from './version';
import * as cp from 'child_process';

export class Downloader {
    private static _context: vscode.ExtensionContext;

    public static onDidChangeDownload: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

    static init(context: vscode.ExtensionContext) {
        this._context = context;
    }

    private static getCurrentPlatform(): { platform: string, binary: string } | undefined {
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

        return { platform: platformName, binary: binaryName };
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
        const folder = binaryPath + `dcl-edit-${version}-${this.getCurrentPlatform()?.platform}`;
        return folder + '/';
    }

    private static getBinary(version: string): string {
        // get the path to the downloaded binary
        return this.getSpecificBinaryPath(version) + this.getCurrentPlatform()?.binary;
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
        if (!version) { throw new Error("Version not specified"); }

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Downloading dcl-edit version " + version,
            cancellable: false
        }, async (progress, token) => {
            // gather platform information
            var platformName = Downloader.getCurrentPlatform()?.platform;
            if (!platformName) {
                console.error("Platform not supported");
                return;
            }

            // download the binary without the binary install package
            const link = `https://github.com/metagamehub/dcl-edit/releases/download/${version}/dcl-edit-${version}-${platformName}.tar.gz`;
            const folder = Downloader.getBinaryPath();
            const filePath = folder + `dcl-edit-${version}-${platformName}.tar.gz`;

            progress.report({ increment: 40, message: "Downloading ..." });

            console.log('Downloading ' + link + ' to ' + filePath);

            const response = await axios.get(link, { responseType: "arraybuffer" });

            progress.report({ increment: 40, message: "Decompressing ..." });

            fs.writeFileSync(filePath, response.data);

            await new Promise<void>((resolve, reject) => {
                targz.decompress({
                    src: filePath,
                    dest: folder
                }, (err) => {
                    if (err) {
                        this.onDidChangeDownload.fire();
                        console.error(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

            progress.report({ increment: 10, message: "Cleaning up ..." });
            fs.rmSync(filePath);
            console.log("Downloaded dcl-edit version " + version + " to " + folder);
            this.onDidChangeDownload.fire();
        });


    }

    public static start(version?: string) {
        if (!version) { throw new Error("Version not specified"); }

        // get the path to the downloaded binary
        var binaryPath = this.getBinary(version);

        // start the binary
        console.log("Starting " + binaryPath + " with project path " + vscode.workspace.workspaceFolders![0].uri.fsPath);
        cp.execFile(binaryPath, ["--projectPath", vscode.workspace.workspaceFolders![0].uri.fsPath], (error: cp.ExecFileException | null, stdout: string, stderr: string) => {
            if (error) {
                console.error(`dcl-edit error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`dcl-edit stderr: ${stderr}`);
                return;
            }
            if (stdout) {
                console.log(`dcl-edit stdout: ${stdout}`);
                return;
            }
        });
    }

    public static async findAllAvailable(): Promise<Version[]> {
        const link = `https://api.github.com/repos/metagamehub/dcl-edit/releases`;
        return new Promise<Version[]>((resolve, reject) => {
            axios.get(link).then(response => {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                resolve(response.data.map((release: { tag_name: string }) => { return new Version(release.tag_name); }));
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
                this.onDidChangeDownload.fire();
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