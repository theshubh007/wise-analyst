"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderStructureAnalyzer = void 0;
const path = require("path");
class FolderStructureAnalyzer {
    constructor() {
        this.utilsFolders = [];
        this.controllerFolders = [];
        this.uiFolders = [];
        this.widgetFolders = [];
    }
    analyzeFolderStructure(fileStructure) {
        for (const filePath in fileStructure) {
            const fileName = path.basename(filePath).toLowerCase();
            const folderName = path.basename(path.dirname(filePath)).toLowerCase();
            if (this.containsKeyword(fileName, ["utils", "asset"]) ||
                this.containsKeyword(folderName, ["utils", "widget"])) {
                this.utilsFolders.push(filePath);
            }
            else if (this.containsKeyword(fileName, ["controller"]) ||
                this.containsKeyword(folderName, ["controller"])) {
                this.controllerFolders.push(filePath);
            }
            else if (this.containsKeyword(fileName, ["presentation", "screen", "page"]) ||
                this.containsKeyword(folderName, ["presentation", "screen", "page"])) {
                this.uiFolders.push(filePath);
            }
            // Check if the folder or file name contains "widget"
            if (this.containsKeyword(fileName, ["widget"]) ||
                this.containsKeyword(folderName, ["widget"])) {
                this.widgetFolders.push(filePath);
            }
        }
    }
    containsKeyword(fileName, keywords) {
        const lowerCaseFileName = fileName.toLowerCase();
        return keywords.some((keyword) => lowerCaseFileName.includes(keyword));
    }
    getUtilsFolders() {
        return this.utilsFolders;
    }
    getControllerFolders() {
        return this.controllerFolders;
    }
    getUIFolders() {
        return this.uiFolders;
    }
    getWidgetFolders() {
        return this.widgetFolders;
    }
}
exports.FolderStructureAnalyzer = FolderStructureAnalyzer;
//# sourceMappingURL=Project_Structure_Analysis.js.map