import * as path from "path"

export class FolderStructureAnalyzer {
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

  public analyzeFolderStructure(fileStructure: Record<string, number>) {
    for (const filePath in fileStructure) {
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
