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

			if(message.command){
				console.log('Received command: ' + message.command);
				vscode.commands.executeCommand(message.command);
			}

			if(message.version){
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

	private _getApp():string{
		return /*html*/`
			<p>This is a very cool text. I hope every body is doing fine</p>
			<vscode-button id="button-start">Start</vscode-button>
			${this._getVersionSelection()}
		`;
	}

	private _getVersionSelection():string{
		return /*html*/`
			<p>Select version:</p>
			<vscode-dropdown id="version-select">
				${this._getVersionOptions()}
	  		</vscode-dropdown>
		`;
	}

	private _getVersionOptions():string{
		const selectedVersion = Version.selectedVersion;
		const versions = Version.availableVersions;
		return versions.map((version) => this._getVersionOption(version, selectedVersion)).join('');
	}

	private _getVersionOption(version:Version, selectedVersion?: Version):string{
		return /*html*/`
		<vscode-option value="${version.get()}" ${ selectedVersion && version.isVersionStringEqual(selectedVersion)?"selected":""}>${version.get()}</vscode-option>
		`;
	}

	private _getDownloadStartButton():string{
		//Downloader.isDownloaded()
		return /*html*/`
			<vscode-button id="button-start">Start</vscode-button>
		`;
	}
}