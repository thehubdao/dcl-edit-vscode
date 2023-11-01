import { provideVSCodeDesignSystem, vsCodeButton, Button , vsCodeDropdown, vsCodeOption} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeDropdown(), vsCodeOption());

const vscode = acquireVsCodeApi();

window.addEventListener("load", () => {
    // register buttons
    getElement("button-start").addEventListener("click", handleButtonStart);
    getElement("version-select").addEventListener("change", handleOptionVersionChange);
});

function getElement(id: string): HTMLElement {
    const button = document.getElementById(id);
    if (!button) {
        throw new Error(`Button with id ${id} not found`);
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

function handleOptionVersionChange() {
    vscode.postMessage({
        version: getVersionOption()
    });
}

