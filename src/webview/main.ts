import { provideVSCodeDesignSystem, vsCodeButton, Button } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(vsCodeButton());

const vscode = acquireVsCodeApi();

window.addEventListener("load", () => {
    // register buttons

    const howdyButton = document.getElementById("howdy") as Button;
    howdyButton?.addEventListener("click", handleHowdyClick);
});

function handleHowdyClick() {
    vscode.postMessage({
        command: "hello",
        text: "Howdy from the webview!"
    });
}
