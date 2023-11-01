import * as vscode from "vscode";
import { getUri } from "./utilities/get_uri";
import { getNonce } from "./utilities/get_nonce";
import { Downloader } from "./downloader";
import { Version } from "./version";

export class SidebarWebviewViewProvider implements vscode.WebviewViewProvider {
	private extensionUri: vscode.Uri;
	private _view?: vscode.WebviewView;

	public constructor(extensionUri: vscode.Uri) {
		this.extensionUri = extensionUri;
	}

	public resolveWebviewView(webviewView: vscode.WebviewView): void {
		this._view = webviewView;

		this._view.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "out")]
		};

		this.updateWebview();

		// Handle messages from the webview
		this._view.webview.onDidReceiveMessage((message) => {
			console.log('Received message');

			if (message.command) {
				console.log('Received command: ' + message.command);
				vscode.commands.executeCommand(message.command);
			}

			if (message.version) {
				console.log('Received version: ' + message.version);
				Version.selectedVersion = new Version(message.version);
			}
		});

		// Handle version changes
		Version.onDidChangeVersion.event(() => {
			this.updateWebview();
		});
	}

	private updateWebview(): void {
		// Set the webview's HTML content
		this._view!.webview.html = this._getWebviewContent(this._view!.webview, this.extensionUri);
	}

	private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
		const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
		const nonce = getNonce();

		const additionalStyle = /*css*/`
			vscode-button {
				width: 100%;
				max-width: 300px;
				display: block;
				margin: 0 auto;
			}

			vscode-dropdown {
				width: 100%;
				max-width: 300px;
				display: block;
				margin: 3px auto;
			}

			vscode-button::part(control) {
				width: 100%;
			}

			.dropdown-container {
				box-sizing: border-box;
				display: flex;
				flex-flow: column nowrap;
				align-items: flex-start;
				justify-content: flex-start;
			  }
			  
			  .dropdown-container label {
				display: block;
				color: var(--vscode-foreground);
				cursor: pointer;
				font-size: var(--vscode-font-size);
				line-height: normal;
				margin-bottom: 2px;
			  }
        `;

		return /*html*/`
          	<!DOCTYPE html>
          	<html lang="en">
            	<head>
              		<meta charset="UTF-8">
              		<meta name="viewport" content="width=device-width, initial-scale=1.0">
              		<title>Hello World!</title>
              		<script type="module" nonce="${nonce}" src="${webviewUri}"></script>
			  		<style>
						${additionalStyle}
					</style>
            	</head>
            	<body>
					${this._getApp()}
            	</body>
          	</html>
        `;
	}

	private _getApp(): string {
		return /*html*/`
			${this._getVersionSelection()}
			${this._getDownloadStartButton()}
		`;
	}
	/*
	Example:
	<p>Select version:</p>
	<vscode-dropdown id="version-select">
		<vscode-option value="latest">latest</vscode-option>
		<vscode-option value="3.0.0" selected>3.0.0</vscode-option>
		<vscode-option value="2.0.0">2.0.0</vscode-option>
		<vscode-option value="1.0.0">1.0.0</vscode-option>
	</vscode-dropdown>
	*/
	private _getVersionSelection(): string {
		return /*html*/`
			<p>Select version:</p>
			<vscode-dropdown id="version-select">
				${this._getVersionOptions()}
	  		</vscode-dropdown>
		`;
	}

	/*
	Example:
	<vscode-option value="latest">latest</vscode-option>
	<vscode-option value="3.0.0" selected>3.0.0</vscode-option>
	<vscode-option value="2.0.0">2.0.0</vscode-option>
	<vscode-option value="1.0.0">1.0.0</vscode-option>
	*/
	private _getVersionOptions(): string {
		const selectedVersion = Version.selectedVersion;
		const versions = [new Version("latest")].concat(Version.availableVersions);
		return versions.map((version) => this._getVersionOption(version, selectedVersion)).join('');
	}

	/*
	Example for input: {version: "3.0.0", selectedVersion: "3.0.0"}
	<vscode-option value="3.0.0" selected>3.0.0</vscode-option>
	Example for input: {version: "latest", selectedVersion: "2.0.0"}
	<vscode-option value="latest">latest</vscode-option>
	*/
	private _getVersionOption(version: Version, selectedVersion?: Version): string {
		const isSelected = selectedVersion && version.isStringEqual(selectedVersion);
		const isSelectedTag = isSelected ? "selected" : "";
		const isDownloaded = Downloader.isDownloaded(version.getVersionString());
		const isDownloadedTag = isDownloaded ? "(downloaded)" : "";
		
		return /*html*/`
		<vscode-option value="${version.get()}" ${isSelectedTag}>${version.get()} ${isDownloadedTag}</vscode-option>
		`;
	}

	/*
	Example if downloaded:
	<p>The selected version of dcl-edit ready to start</p>
	<vscode-button id="button-start">Start</vscode-button>
	Example if not downloaded:
	<p>The selected version of dcl-edit needs to be downloaded</p>
	<vscode-button id="button-download">Download</vscode-button>
	*/
	private _getDownloadStartButton(): string {
		if(Version.selectedVersion && Downloader.isDownloaded( Version.selectedVersion.getVersionString())){
			return /*html*/`
				<p>The selected version of dcl-edit ready to start</p>
				<vscode-button id="button-start">Start</vscode-button>
			`;
		}else{
			return /*html*/`
				<p>The selected version of dcl-edit needs to be downloaded</p>
				<vscode-button id="button-download">Download</vscode-button>
			`;
		}
	}
}