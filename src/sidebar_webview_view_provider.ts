import * as vscode from "vscode";
import { getUri } from "./utilities/get_uri";
import { getNonce } from "./utilities/get_nonce";

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

		// Set the webview's HTML content
		this._view.webview.html = this._getWebviewContent(this._view.webview, this.extensionUri);

		// Handle messages from the webview
		this._view.webview.onDidReceiveMessage((message) => {
			console.log('Received message from webview: ' + message);
		});
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

			vscode-button::part(control) {
				width: 100%;
			}
        `;

		return /*html*/ `
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
              		<p>This is a very cool text. I hope every body is doing fine</p>
              		<vscode-button id="howdy">Initialize Repository</vscode-button> 
            	</body>
          	</html>
        `;
	}
}