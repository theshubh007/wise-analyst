"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderStructureAnalyzer = void 0;
const path = require("path");
class FolderStructureAnalyzer {
    constructor() {
        this.utilsFolders = new Set();
        this.controllerFolders = new Set();
        this.uiFolders = new Set();
        this.widgetFolders = new Set();
    }
    //Function to analyze folder structure
    analyzeFolderStructure(fileStructure) {
        for (const filePath in fileStructure) {
            // Extract the file name and folder name from the file path and based on name, classify the folder into 4 categories
            const fileName = path.basename(filePath).toLowerCase();
            const folderName = path.basename(path.dirname(filePath)).toLowerCase();
            if (this.containsKeyword(fileName, ["utils", "asset"]) ||
                this.containsKeyword(folderName, ["utils", "widget"])) {
                this.utilsFolders.add(filePath);
            }
            else if (this.containsKeyword(fileName, ["controller"]) ||
                this.containsKeyword(folderName, ["controller"])) {
                this.controllerFolders.add(filePath);
            }
            else if (this.containsKeyword(fileName, ["presentation", "screen", "page"]) ||
                this.containsKeyword(folderName, ["presentation", "screen", "page"])) {
                this.uiFolders.add(filePath);
            }
            // Check if the folder or file name contains "widget"
            if (this.containsKeyword(fileName, ["widget"]) ||
                this.containsKeyword(folderName, ["widget"])) {
                this.widgetFolders.add(filePath);
            }
        }
    }
    containsKeyword(fileName, keywords) {
        const lowerCaseFileName = fileName.toLowerCase();
        return keywords.some((keyword) => lowerCaseFileName.includes(keyword));
    }
    //Getter functions to return the 4 categories of folders
    getUtilsFolders() {
        return Array.from(this.utilsFolders);
    }
    getControllerFolders() {
        return Array.from(this.controllerFolders);
    }
    getUIFolders() {
        return Array.from(this.uiFolders);
    }
    getWidgetFolders() {
        return Array.from(this.widgetFolders);
    }
}
exports.FolderStructureAnalyzer = FolderStructureAnalyzer;
//# sourceMappingURL=Project_Structure_Analysis.js.map