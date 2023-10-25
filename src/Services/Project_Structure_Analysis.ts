import * as path from "path"

export class FolderStructureAnalyzer {
  //Claffication of folders into 4 categories
  private utilsFolders: Set<string>
  private controllerFolders: Set<string>
  private uiFolders: Set<string>
  private widgetFolders: Set<string>

  constructor() {
    this.utilsFolders = new Set()
    this.controllerFolders = new Set()
    this.uiFolders = new Set()
    this.widgetFolders = new Set()
  }

  //Function to analyze folder structure
  public analyzeFolderStructure(fileStructure: Record<string, number>) {
    for (const filePath in fileStructure) {
      // Extract the file name and folder name from the file path and based on name, classify the folder into 4 categories
      const fileName = path.basename(filePath).toLowerCase()
      const folderName = path.basename(path.dirname(filePath)).toLowerCase()

      if (
        this.containsKeyword(fileName, ["utils", "asset"]) ||
        this.containsKeyword(folderName, ["utils", "widget"])
      ) {
        this.utilsFolders.add(filePath)
      } else if (
        this.containsKeyword(fileName, ["controller"]) ||
        this.containsKeyword(folderName, ["controller"])
      ) {
        this.controllerFolders.add(filePath)
      } else if (
        this.containsKeyword(fileName, ["presentation", "screen", "page"]) ||
        this.containsKeyword(folderName, ["presentation", "screen", "page"])
      ) {
        this.uiFolders.add(filePath)
      }

      // Check if the folder or file name contains "widget"
      if (
        this.containsKeyword(fileName, ["widget"]) ||
        this.containsKeyword(folderName, ["widget"])
      ) {
        this.widgetFolders.add(filePath)
      }
    }
  }

  private containsKeyword(fileName: string, keywords: string[]): boolean {
    const lowerCaseFileName = fileName.toLowerCase()
    return keywords.some((keyword) => lowerCaseFileName.includes(keyword))
  }

  //Getter functions to return the 4 categories of folders
  public getUtilsFolders(): string[] {
    return Array.from(this.utilsFolders)
  }

  public getControllerFolders(): string[] {
    return Array.from(this.controllerFolders)
  }

  public getUIFolders(): string[] {
    return Array.from(this.uiFolders)
  }

  public getWidgetFolders(): string[] {
    return Array.from(this.widgetFolders)
  }
}
