import { Downloader } from "./downloader";
import * as vscode from 'vscode';

export class Version {
    private static _selectedVersion?: Version;
    private static _newestVersion?: Version;
    private static _availableVersions: Version[];

    public static set selectedVersion(version: Version) {
        Version._selectedVersion = version;
        Version.onDidChangeVersion.fire();
    }

    public static get selectedVersion(): Version | undefined {
        return Version._selectedVersion;
    }

    public static set newestVersion(version: Version) {
        Version._newestVersion = version;
        Version.onDidChangeVersion.fire();
    }

    public static get newestVersion(): Version | undefined {
        return Version._newestVersion;
    }

    public static set availableVersions(versions: Version[]) {
        Version._availableVersions = versions;
        Version.onDidChangeVersion.fire();
    }

    public static get availableVersions(): Version[] {
        return Version._availableVersions;
    }

    public static onDidChangeVersion: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

    private latest: boolean;
    private major: number;
    private minor: number;
    private patch: number;

    constructor(version: string) {
        if (version === 'latest') {
            this.latest = true;
            [this.major, this.minor, this.patch] =
                Version.parse(Version.newestVersion!.getVersionString());
        } else {
            this.latest = false;
            [this.major, this.minor, this.patch] =
                Version.parse(version);
        }
    }

    public get(): string {
        return this.latest ? "latest" : `${this.major}.${this.minor}.${this.patch}`;
    }

    public getVersionString(): string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

    public getMajor(): number {
        return this.major;
    }

    public getMinor(): number {
        return this.minor;
    }

    public getPatch(): number {
        return this.patch;
    }

    public isGreaterThan(version: Version): boolean {
        if (this.getMajor() > version.getMajor()) {
            return true;
        } else if (this.getMajor() < version.getMajor()) {
            return false;
        } else if (this.getMinor() > version.getMinor()) {
            return true;
        } else if (this.getMinor() < version.getMinor()) {
            return false;
        } else if (this.getPatch() > version.getPatch()) {
            return true;
        } else if (this.getPatch() < version.getPatch()) {
            return false;
        }

        return false;
    }


    isVersionStringEqual(selectedVersion: Version): boolean {
        return this.getVersionString() === selectedVersion.getVersionString();
    }

    public static parse(version: string): number[] {
        var parts = version.split('.');
        if (parts.length !== 3) {
            throw new Error(`Invalid version: ${version}`);
        }
        return [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])];
    }

    public static async init() {
        // find all downloaded versions
        this.availableVersions = Downloader.findAllDownloaded();

        // find newest downloaded version
        this.newestVersion = this.findNewestInAvailable();
        this.onDidChangeVersion.fire();

        // find all available versions (from github)
        this.availableVersions = await Downloader.findAllAvailable();

        // find newest available version
        this.newestVersion = this.findNewestInAvailable();
        this.onDidChangeVersion.fire();
    }

    private static findNewestInAvailable(): Version {
        var newest = this.availableVersions[0];
        for (var i = 1; i < this.availableVersions.length; i++) {
            if (this.availableVersions[i].isGreaterThan(newest)) {
                newest = this.availableVersions[i];
            }
        }
        return newest;
    }
}