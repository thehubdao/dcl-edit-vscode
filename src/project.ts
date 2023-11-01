import * as vscode from 'vscode';
import * as fs from 'fs';

export function isDecentralandProject():boolean{
    if(!vscode.workspace.workspaceFolders) {return false;}

    var path = vscode.workspace.workspaceFolders[0].uri.fsPath;
    var sceneJsonPath = path + "/scene.json";

    // check if the scene.json file exists
    if(!fs.existsSync(sceneJsonPath)) {return false;}

    // read the scene.json file
    var sceneJson = fs.readFileSync(sceneJsonPath, 'utf8');
    var scene = JSON.parse(sceneJson);
    if(!scene){return false;}

    // check if the scene.json file has scene scene->parcels and scene->base
    if(!scene.scene || !scene.scene.parcels || !scene.scene.base){return false;}

    return true;
}