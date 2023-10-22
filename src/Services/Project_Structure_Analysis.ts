import * as path from "path"

export class FolderStructureAnalyzer {
  //Claffication of folders into 4 categories
  private utilsFolders: string[]
  private controllerFolders: string[]
  private uiFolders: string[]
  private widgetFolders: string[]

  constructor() {
    this.utilsFolders = []
    this.controllerFolders = []
    this.uiFolders = []
    this.widgetFolders = []
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
        this.utilsFolders.push(filePath)
      } else if (
        this.containsKeyword(fileName, ["controller"]) ||
        this.containsKeyword(folderName, ["controller"])
      ) {
        this.controllerFolders.push(filePath)
      } else if (
        this.containsKeyword(fileName, ["presentation", "screen", "page"]) ||
        this.containsKeyword(folderName, ["presentation", "screen", "page"])
      ) {
        this.uiFolders.push(filePath)
      }

      // Check if the folder or file name contains "widget"
      if (
        this.containsKeyword(fileName, ["widget"]) ||
        this.containsKeyword(folderName, ["widget"])
      ) {
        this.widgetFolders.push(filePath)
      }
    }
  
  }

  private containsKeyword(fileName: string, keywords: string[]): boolean {
    const lowerCaseFileName = fileName.toLowerCase()
    return keywords.some((keyword) => lowerCaseFileName.includes(keyword))
  }


  //Getter functions to return the 4 categories of folders
  public getUtilsFolders(): string[] {
    return this.utilsFolders
  }

  public getControllerFolders(): string[] {
    return this.controllerFolders
  }

  public getUIFolders(): string[] {
    return this.uiFolders
  }

  public getWidgetFolders(): string[] {
    return this.widgetFolders
  }
}
