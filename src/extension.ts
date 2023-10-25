import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import { FolderStructureAnalyzer } from "./Services/Project_Structure_Analysis"
import { CodeQualityAnalyzer } from "./Services/CodeQualityAnalysis"
import { PromptGenerator } from "./Services/PromptGenerator"
import { ApiAnalyzer } from "./Services/Apianalyzer"
// Adjust the path accordingly


// ccduwg65i4kksut2sfsmh56fn5kmlykocn4zpkwm5eft5d3l2smq
declare global {
  interface RegExpConstructor {
    escape(s: string): string
  }
}

if (!RegExp.escape) {
  RegExp.escape = function (s: string): string {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
  }
}

type FileAnalysisResult = {
  filePath: string
  codeQualityIssues: string
}
type ApiAnalysisResult = {
  filePath: string
  apiendpoint: string
}

class FlutterAppAnalyzer {
  private webViewPanel: vscode.WebviewPanel | undefined
  private fileStructure: Record<string, number>
  private folderStructureAnalyzer: FolderStructureAnalyzer
  private codequalityanalyzer: CodeQualityAnalyzer
  private codequalityissuesarr: Array<FileAnalysisResult>
  private apiAnalyzer: ApiAnalyzer
  private analysisReport: string

  //Initialize all Properties
  constructor() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

    this.fileStructure = {}
    this.folderStructureAnalyzer = new FolderStructureAnalyzer()
    this.codequalityanalyzer = new CodeQualityAnalyzer()
    this.codequalityissuesarr = []
    this.apiAnalyzer = new ApiAnalyzer()
    this.analysisReport = ""
  }

  //Functions to Format UI RESULT
  private formatFolders(category: string, folders: string[]): string {
    const folderList = folders
      .map((folder) => `<li class="folder-list-item">${folder}</li>`)
      .join("")

    return `
    <div class="folder-list">
      <strong>${category}</strong>
      <ul>${folderList}</ul>
    </div>
  `
  }

  //Functions to Format UI RESULT
  private formatFunction(apiFunction: string): string {
    return `<code>${apiFunction}</code>`
  }

  //loading indicator UI
  private displayLoadingWebview() {
    // Create and show a loading webview panel
    this.webViewPanel = vscode.window.createWebviewPanel(
      "loading",
      "Loading...",
      vscode.ViewColumn.One,
      {}
    )

    // Set the webview content with loading indicator
    this.webViewPanel.webview.html = this.getLoadingWebviewContent()

    this.webViewPanel.onDidDispose(() => {
      this.webViewPanel = undefined
    })
  }

  //Hide loading indicator UI
  private hideLoadingWebview() {
    // Dispose of the loading webview panel
    if (this.webViewPanel) {
      this.webViewPanel.dispose()
    }
  }

  //Calling loading indicator
  private getLoadingWebviewContent(): string {
    return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            background-color: #2d2d2d;
            color: #ffffff;
            margin: 20px;
          }

          h1 {
            color: #61dafb;
          }

          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }

          .loading-indicator {
            border: 8px solid #f3f3f3;
            border-top: 8px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loading-container">
          <div class="loading-indicator"></div>
        </div>
      </body>
    </html>
  `
  }

  //starts:Code base Analysis Task
  public runAnalysis() {
    //current working directory
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

    if (workspaceFolder) {
      //works only if workspace folder is present
      this.analyzeFiles(workspaceFolder)
    } else {
      vscode.window.showErrorMessage(
        "No workspace folder found. Please open a folder in VSCode."
      )
    }
  }

  //All Analysis services called and integrated here
  //All Service classes are Present in Services folder
  private async analyzeFiles(workspaceFolder: vscode.WorkspaceFolder) {
    const projectPath = workspaceFolder.uri.fsPath
    //Targeting lib folder for Flutter project analysis 
    const libFolderPath = path.join(projectPath, "lib")
    if (!fs.existsSync(libFolderPath)) {
      vscode.window.showErrorMessage(
        "No 'lib' folder found. Please make sure your Flutter project has a 'lib' folder."
      )
      return
    }

  
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(libFolderPath, "**/*.dart")
    )

    // Promise.all to wait for all file reading operations to complete
    await Promise.all(
      files.map(async (file) => {
        //Getting file content
        const content = await vscode.workspace.fs.readFile(file)

        //Calling Service Analyze API endpoints
        this.apiAnalyzer.analyzeApi(content.toString(), file.fsPath)

        //Calling Service Analyze folder structure
        this.updateFileStructure(file.fsPath)
        this.folderStructureAnalyzer.analyzeFolderStructure(this.fileStructure)

        //Calling Service Analyze code quality
        const codeQualityIssues =
          this.codequalityanalyzer.runCodeQualityAnalysis(content.toString())
        this.codequalityissuesarr.push({
          filePath: file.fsPath,
          codeQualityIssues: codeQualityIssues.toString(),
        })
      })
    )
    

    //After analysis of all files,genearte full analysis report
    const temparr = this.apiAnalyzer.getApiEndpoints()
    const promptGenerator = new PromptGenerator({
      apiEndpointsnum: temparr.length.toString(),
      apiCallingFunctions: Array.from(
        this.apiAnalyzer.getApiCallingFunctions()
      ),
      codeQualityIssues: this.codequalityissuesarr.map(
        (result) => result.codeQualityIssues
      ),
    })
    const activeEditor = vscode.window.activeTextEditor
    if (!activeEditor) {
      throw new Error("No active editor found.")
    }
    this.analysisReport = promptGenerator.generateAnalysisReport()


    //Display result in UI
    this.createWebviewPanel()
  }

  private updateFileStructure(filePath: string) {
    const relativePath = vscode.workspace.asRelativePath(filePath)
    this.fileStructure[relativePath] =
      (this.fileStructure[relativePath] || 0) + 1
  }

  //VSCODE ui
  private createWebviewPanel() {
    // Create and show a new webview panel
    this.webViewPanel = vscode.window.createWebviewPanel(
      "flutterAppAnalyzer",
      "Flutter App Analyzer",
      vscode.ViewColumn.One,
      {}
    )

    // Set the webview content
    this.webViewPanel.webview.html = this.getWebviewContent()

    this.webViewPanel.onDidDispose(() => {
      this.webViewPanel = undefined
    })
  }

  private getWebviewContent() {
    // In this function, you can generate the HTML content for your webview
    // You can use the data you collected during the analysis here
    const apiEndpoints = this.apiAnalyzer
      .getApiEndpoints()
      .map((ApiAnalysisResult) => {
        const filePath = ApiAnalysisResult.filePath
        const apiEndpoint = ApiAnalysisResult.apiendpoint

        // Format issues for display
        const formattedIssues = Array.isArray(apiEndpoint)
          ? apiEndpoint.map((apiendpoint) => `<li>${apiendpoint}</li>`).join("")
          : `<li>${apiEndpoint}</li>`
        return `
        <div class="code1">
          <strong>At path: ${filePath}:</strong>
          ${apiEndpoint}
        </div>
      `
      })
      .join("")

    const apiCallingFunctions = Array.from(
      this.apiAnalyzer.getApiCallingFunctions()
    )
      .map((apiFunction) => this.formatFunction(apiFunction))
      .join("<br>")

    const apicatchfunction = Array.from(
      this.apiAnalyzer.getErrorHandlingFunctions()
    )
      .map((catchFunction) => this.formatFunction(catchFunction))
      .join("<br>")

    const utilsFolders = this.formatFolders(
      "Utils Folders",
      this.folderStructureAnalyzer.getUtilsFolders()
    )
    const controllerFolders = this.formatFolders(
      "Controller Folders",
      this.folderStructureAnalyzer.getControllerFolders()
    )
    const uiFolders = this.formatFolders(
      "UI Folders",
      this.folderStructureAnalyzer.getUIFolders()
    )
    const widgetFolders = this.formatFolders(
      "Widget Folders",
      this.folderStructureAnalyzer.getWidgetFolders()
    )

    // Code Quality Analysis
    const codeQualityIssuesHTML = this.codequalityissuesarr
      .map((fileAnalysisResult) => {
        const filePath = fileAnalysisResult.filePath
        const issues = fileAnalysisResult.codeQualityIssues

        // Format issues for display
        const formattedIssues = Array.isArray(issues)
          ? issues.map((issue) => `<li>${issue}</li>`).join("")
          : `<li>${issues}</li>`
        return `
        <div class="code-quality">
          <strong>Code Quality Issues for ${filePath}:</strong>
          <ul>${formattedIssues}</ul>
        </div>
      `
      })
      .join("")

    return `
    <html>
      <head>
        <style>
          body {
            font-family: 'Courier New', monospace;
            background-color: #2d2d2d;
            color: #ffffff;
            margin: 20px;
          }

          h1 {
            color: #61dafb;
          }

          strong {
            color: #61dafb;
          }

          code {
            display: block;
            background-color: #333;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
          }

          .code1 {
            display: block;
            background-color: #333;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
          }

          .flex-container {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }

          .category {
            flex: 1;
            margin-right: 20px;
          }

          .category h2 {
            color: #61dafb;
            margin-bottom: 10px;
          }

          .folder-list {
            list-style-type: none;
            padding: 0;
          }

          .folder-list-item {
            background-color: #333;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
          }
          .code-quality {
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Flutter code Analysis</h1>
        
          <h2>Analysis Report</h2>
            ${this.analysisReport}
<br>

         <h2>1. Api Flow Analysis</h2>


         
        <div class="flex-container">
          <div class="category">
            <h2>API Endpoints</h2>
            ${apiEndpoints}
          </div>
          
          <div class="category">
            <h2>API Calling Functions</h2>
            ${apiCallingFunctions}
          </div>

          <div class="category">
            <h2>API Error Handling Functions</h2>
            ${apicatchfunction}
          </div>
        </div>
 <h2>2. Project-Structure Analysis</h2>
        <div class="flex-container">
          <div class="category">
            <h2>Utils Folders</h2>
            ${utilsFolders}
          </div>

          <div class="category">
            <h2>Controller Folders</h2>
            ${controllerFolders}
          </div>

          <div class="category">
            <h2>UI Folders</h2>
            ${uiFolders}
          </div>
        </div>

        <div class="flex-container">
          <div class="category">
            <h2>Widget Folders</h2>
            ${widgetFolders}
          </div>
        </div>
        <h2>3. Code Quality Analysis</h2>
        ${codeQualityIssuesHTML}
      
          
        
      </body>
    </html>
  `
  }

  //##Starts prompt generation process
  public async runFeatureAnalysis() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

    if (workspaceFolder) {
      const projectPath = workspaceFolder.uri.fsPath
      const libFolderPath = path.join(projectPath, "lib")
   
      if (!fs.existsSync(libFolderPath)) {
        vscode.window.showErrorMessage(
          "No 'lib' folder found. Please make sure your Flutter project has a 'lib' folder."
        )
        return
      }
      const temparr = this.apiAnalyzer.getApiEndpoints()
      const promptGenerator = new PromptGenerator({
        apiEndpointsnum: temparr.length.toString(),
        apiCallingFunctions: Array.from(
          this.apiAnalyzer.getApiCallingFunctions()
        ),
        codeQualityIssues: this.codequalityissuesarr.map(
          (result) => result.codeQualityIssues
        ),
      })

      const activeEditor = vscode.window.activeTextEditor
      if (!activeEditor) {
        throw new Error("No active editor found.")
      }

      // Display loading indicator
      this.displayLoadingWebview()

      try {
        const fileContent = activeEditor.document.getText()
        const promptAnswer = await promptGenerator.generateExtensionPrompt(
          fileContent
        )
        // Hide loading indicator and show the webview with the prompt answer
        this.hideLoadingWebview()
        this.createFeatureWebviewPanel(promptAnswer)
      } catch (error) {
        // Handle errors, e.g., show an error message
        this.hideLoadingWebview()
        vscode.window.showErrorMessage(`Error: ${(error as Error).message}`)
      }
    } else {
      vscode.window.showErrorMessage(
        "No workspace folder found. Please open a folder in VSCode."
      )
    }
  }

  private createFeatureWebviewPanel(featurePrompt: string) {
    // Create and show a new webview panel for the feature analysis
    const featureWebViewPanel = vscode.window.createWebviewPanel(
      "Promptgeneration",
      "Prompt Generation",
      vscode.ViewColumn.One,
      {}
    )

    // Set the webview content
    featureWebViewPanel.webview.html =
      this.getFeatureWebviewContent(featurePrompt)

    featureWebViewPanel.onDidDispose(() => {
      // Handle disposal if needed
    })
  }
  private getFeatureWebviewContent(featurePrompt: string): string {
    // Generate HTML content for the feature analysis webview
    return `
      <html>
        <head>
          <style>
            body {
              font-family: 'Courier New', monospace;
              background-color: #2d2d2d;
              color: #ffffff;
              margin: 20px;
            }

            h1 {
              color: #61dafb;
            }

            code {
              display: block;
              background-color: #333;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <h1>Prompt Generation</h1>
          <div>
            <h2>Feature Prompt suggestion:</h2>
            <code>${featurePrompt}</code>
          </div>
        </body>
      </html>
    `
  }
}

//Activate method for extension-command mapping with class
export function activate(context: vscode.ExtensionContext) {
  const analyzer = new FlutterAppAnalyzer()

  //command for code-base analysis
  let analysisdisposable = vscode.commands.registerCommand(
    "extension.analyzeFlutterApp",
    () => {
      analyzer.runAnalysis()
    
    }
  )

  // command for creating a new feature
  let createFeatureDisposable = vscode.commands.registerCommand(
    "extension.createFlutterFeature",
    () => {
      analyzer.runFeatureAnalysis()
    }
  )

  context.subscriptions.push(analysisdisposable, createFeatureDisposable)
}




