import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"

class FlutterAppAnalyzer {
  private apiEndpoints: Set<string>
  private apiCallingFunctions: Set<string>
  private fileStructure: Record<string, number>

  constructor() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

    this.apiEndpoints = new Set()
    this.apiCallingFunctions = new Set()
    this.fileStructure = {}
  }

  private analyzeFiles(workspaceFolder: vscode.WorkspaceFolder) {
    const projectPath = workspaceFolder.uri.fsPath
    const libFolderPath = path.join(projectPath, "lib")
    console.log("Analyzing files") // Add this line for debugging
    console.log("Analyzing files in:", projectPath) // Add this line for debugging
    if (!fs.existsSync(libFolderPath)) {
      vscode.window.showErrorMessage(
        "No 'lib' folder found. Please make sure your Flutter project has a 'lib' folder."
      )
      return
    }

    console.log("Analyzing files in:", libFolderPath)
    vscode.workspace
      .findFiles(new vscode.RelativePattern(libFolderPath, "**/*.dart"))
      .then((files) => {
        //print file names
        // console.log(
        //   "Files found:",
        //   files.map((file) => file.fsPath)
        // )

        files.forEach((file) => {
          vscode.workspace.fs.readFile(file).then((content) => {
            this.extractApiEndpoints(content.toString())
            this.extractApiCallingFunctions(content.toString())
            this.updateFileStructure(file.fsPath)
          })
        })
      })

    console.log("Found API Endpoints:", this.apiEndpoints)
  }

  private extractApiEndpoints(content: string) {
    const apiEndpointRegex = /(?:http|https):\/\/[^"\s]+/g

    // Extract potential API endpoints from the content
    const matches = content.match(apiEndpointRegex)

    if (matches) {
      // Add the matched endpoints to the set
      matches.forEach((endpoint) => {
        this.apiEndpoints.add(endpoint)
      })
    }
  }

  private extractApiCallingFunctions(content: string) {
    // Implement logic to extract API calling functions from Dart files
    // Example: Use abstract syntax trees (AST) parsing
  }

  private updateFileStructure(filePath: string) {
    const relativePath = vscode.workspace.asRelativePath(filePath)
    this.fileStructure[relativePath] =
      (this.fileStructure[relativePath] || 0) + 1
  }

  public runAnalysis() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

    if (workspaceFolder) {
      this.analyzeFiles(workspaceFolder)
      vscode.window.showInformationMessage(
        `Flutter App Analysis Summary:\nAPI Endpoints: ${Array.from(
          this.apiEndpoints
        )}\nAPI Calling Functions: ${Array.from(
          this.apiCallingFunctions
        )}\nFile Structure: ${JSON.stringify(this.fileStructure, null, 2)}`
      )
    } else {
      vscode.window.showErrorMessage(
        "No workspace folder found. Please open a folder in VSCode."
      )
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  const analyzer = new FlutterAppAnalyzer()

  let disposable = vscode.commands.registerCommand(
    "extension.analyzeFlutterApp",
    () => {
      analyzer.runAnalysis()
      provideSuggestion(analyzer)
    }
  )

  context.subscriptions.push(disposable)
}

function provideSuggestion(analyzer: FlutterAppAnalyzer) {
  // ... Implement logic to provide code suggestions based on the analysis
  const suggestion = `Consider adding error handling for API calls.`
  vscode.window.showInformationMessage(suggestion)
}

export function deactivate() {}
