import { provideVSCodeDesignSystem, vsCodeButton, Button , vsCodeDropdown, vsCodeOption} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), vsCodeOption());

const vscode = acquireVsCodeApi();

window.addEventListener("load", () => {
    // register buttons
    getElementOptional("button-start")?.addEventListener("click", handleButtonStart);
    getElementOptional("button-download")?.addEventListener("click", handleButtonDownload);
    getElementOptional("version-select")?.addEventListener("change", handleOptionVersionChange);
    getElementOptional("button-open")?.addEventListener("click", handleButtonOpen);
});

function getElement(id: string): HTMLElement {
    const button = document.getElementById(id);
    if (!button) {
        throw new Error(`Button with id ${id} not found`);
    }
    return button;
}

function getElementOptional(id: string): HTMLElement |undefined{
    const button = document.getElementById(id);
    if (!button) {
        return undefined;
    }
    return button;
}

function getVersionOption(): string{
    const option = getElement("version-select") as HTMLSelectElement;
    return option.value;
}

function handleButtonStart() {
    vscode.postMessage({
        command: "dcl-edit-vscode.start"
    });
}

function handleButtonDownload() {
    vscode.postMessage({
        command: "dcl-edit-vscode.download"
    });
}

function handleButtonOpen() {
    vscode.postMessage({
        command: "workbench.action.files.openFolder"
    });
}

function handleOptionVersionChange() {
    vscode.postMessage({
        version: getVersionOption()
    });
}

