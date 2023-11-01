import * as vscode from 'vscode';
import { SidebarWebviewViewProvider } from './sidebar_webview_view_provider';
import { Downloader } from './downloader';
import * as commands from './commands';
import { Version } from './version';

export async function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension is now active!');

	// init downloader
	Downloader.init(context);

	await Version.init();

	// Create providers
	const webviewProvider = new SidebarWebviewViewProvider(context.extensionUri);

	// Register providers
	context.subscriptions.push(vscode.window.registerWebviewViewProvider('dcl-edit-view', webviewProvider));

	// create and register commands
	context.subscriptions.push(vscode.commands.registerCommand('dcl-edit-vscode.download', () => { commands.download(); }));
	context.subscriptions.push(vscode.commands.registerCommand('dcl-edit-vscode.start', () => { commands.start(); }));
	context.subscriptions.push(vscode.commands.registerCommand('dcl-edit-vscode.clearCache', () => { commands.clearCache(); }));
}

// This method is called when your extension is deactivated
export function deactivate() { }
