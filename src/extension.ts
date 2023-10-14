import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"
import { exec } from "child_process"
import { ApiFunctionDetails, ErrorHandlingDetails } from "./Interfaces" // Adjust the path accordingly
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


class FlutterAppAnalyzer {
  private webViewPanel: vscode.WebviewPanel | undefined
  private apiEndpoints: Set<string>
  private apiEndpointsarr: Array<string>
  private apiEndpointsVariables: Set<string>
  private apiCallingFunctions: Set<string>
  private errorhandlingarr: Array<string>
  private fileStructure: Record<string, number>

  constructor() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

    this.apiEndpoints = new Set()
    this.apiEndpointsarr = []
    this.apiEndpointsVariables = new Set()
    this.apiCallingFunctions = new Set()
    this.errorhandlingarr = []
    this.fileStructure = {}
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

    // Handle disposal of the webview panel
    this.webViewPanel.onDidDispose(() => {
      this.webViewPanel = undefined
    })
  }

  private getWebviewContent() {
    // In this function, you can generate the HTML content for your webview
    // You can use the data you collected during the analysis here
    const apiEndpoints = this.apiEndpointsarr
      .map((apiFunction) => this.formatFunction(apiFunction))
      .join("<br>")
    const apiCallingFunctions = Array.from(this.apiCallingFunctions)
      .map((apiFunction) => this.formatFunction(apiFunction))
      .join("<br>")
    
       const apicatchfunction = Array.from(this.errorhandlingarr)
         .map((catchFunction) => this.formatFunction(catchFunction))
         .join("<br>")

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
        </style>
      </head>
      <body>
        <h1>Flutter App Analysis Summary</h1>
        <p><strong>API Endpoints:</strong></p>
        ${apiEndpoints}
        <p><strong>API Calling Functions:</strong></p>
        ${apiCallingFunctions}
           <p><strong>API Error Handling Functions:</strong></p>
        ${apicatchfunction}
      </body>
    </html>
  `
  }

  private formatFunction(apiFunction: string): string {
    return `<code>${apiFunction}</code>`
  }


  //Main Analyze function

  private async analyzeFiles(workspaceFolder: vscode.WorkspaceFolder) {
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
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(libFolderPath, "**/*.dart")
    )

    // Use Promise.all to wait for all file reading operations to complete
    await Promise.all(
      files.map(async (file) => {
        const content = await vscode.workspace.fs.readFile(file)
        this.extractApiEndpoints(content.toString())
        this.updateFileStructure(file.fsPath)
        this.analyzeApiFlow(content.toString())
      })
    )

    this.createWebviewPanel()
    // console.log("API Endpoints:", this.apiEndpointsarr)
  }

  //API endpoint overflow
  private extractApiEndpoints(content: string) {
    this.extractApiEndpoints_regx(content)
    this.extractApiEndpoints_subEndPoints(content)

    this.apiEndpointsarr = Array.from(this.apiEndpoints)
    // console.log("API Endpointsarr:", this.apiEndpointsarr)
  }

  private extractApiEndpoints_regx(content: string) {
    const apiEndpointRegex = /(?:http|https):\/\/[^"\s]+/g

    // Extract potential API endpoints from the content
    const matches = content.matchAll(apiEndpointRegex)

    for (const match of matches) {
      const endpoint = match[0]

      // Extract the variable name preceding the URL without including equal sign and surrounding spaces
      const variableMatch = content
        .substring(0, match.index)
        .match(/\b(\w+)\s*=\s*["'`]$/)

      if (variableMatch) {
        // Use the captured group (variable name) and add it to the set
        const variableName = variableMatch[1].trim()
        this.apiEndpoints.add(endpoint)
        this.apiEndpointsVariables.add(variableName)
      }
    }
  }

  private extractApiEndpoints_subEndPoints(content: string) {
    // Iterate through the base URLs and find associated sub-URLs
    console.log("extractapiendpoints_subendpoints entered")

    this.apiEndpointsVariables.forEach((baseUrl) => {
      // Create a regex pattern for matching lines containing the base URL
      const lineRegex = new RegExp(
        `\\b${RegExp.escape(baseUrl)}(?:/[^"'\s]+)?\\b`,
        "g"
      )

      // Extract lines from the content that contain the base URL
      const lines = content.split("\n")

      // Filter lines that contain the base URL or its sub-URLs
      const linesWithBaseUrl = lines.filter((line) => line.match(lineRegex))

      // Add the matching lines to the set
      linesWithBaseUrl.forEach((matchingLine) => {
        this.apiEndpoints.add(matchingLine.trim())
      })
    })
  }

  //apiCallingFunctions overflow
  private async analyzeApiFlow(content: string) {
    // Identify API calls within functions
    console.log("analyzeapiflow entered")

    this.GetRequestFlow(content)
    this.PostRequestFlow(content)
    this.PutRequestFlow(content)
    this.DeleteRequestFlow(content)

    const functionsWithCatch = this.detectFunctionsWithCatchDart(content)
    console.log("Functions with catch:", this.errorhandlingarr)
    console.log("Functions with catch length:", this.errorhandlingarr.length)
  }

  private GetRequestFlow(content: string) {
    const lineRegexget = new RegExp(
      `\\b(\\w+<.*?>)?\\s*\\.get\\([^)]*\\)[^}]*}`,
      "g"
    )

    const apiFunctionMatches = new Set<string>() // Use a Set to store unique matches

    // Use matchAll instead of match
    const matches = content.matchAll(lineRegexget)

    if (!matches) {
      return
    }

    console.log("apifunctionmatches: ")
    for (const match of matches) {
      const apiFunctionMatch = match[0]
      console.log("apifunctionmatch: ", apiFunctionMatch)
      apiFunctionMatches.add(apiFunctionMatch)
      this.apiCallingFunctions.add(apiFunctionMatch)
    }

    // If you need to convert the Set back to an array:
    const uniqueMatchesArray = Array.from(apiFunctionMatches)
    console.log("Unique Matches Array: ", uniqueMatchesArray)
  }

  private PostRequestFlow(content: string) {
    const lineRegexpost = new RegExp(
      `\\b(\\w+<.*?>)?\\s*\\.post\\([^)]*\\)[^}]*}`,
      "g"
    )
    const apiFunctionMatches = new Set<string>() // Use a Set to store unique matches

    // Use matchAll instead of match
    const matches = content.matchAll(lineRegexpost)

    if (!matches) {
      return
    }

    console.log("apifunctionmatches: ")
    for (const match of matches) {
      const apiFunctionMatch = match[0]
      console.log("apifunctionmatch: ", apiFunctionMatch)
      apiFunctionMatches.add(apiFunctionMatch)
      this.apiCallingFunctions.add(apiFunctionMatch)
    }

    // If you need to convert the Set back to an array:
    const uniqueMatchesArray = Array.from(apiFunctionMatches)
    console.log("Unique Matches Array: ", uniqueMatchesArray)
  }

  private PutRequestFlow(content: string) {
    const lineRegexput = new RegExp(
      `\\b(\\w+<.*?>)?\\s*\\.put\\([^)]*\\)[^}]*}`,
      "g"
    )

    const apiFunctionMatches = new Set<string>() // Use a Set to store unique matches

    // Use matchAll instead of match
    const matches = content.matchAll(lineRegexput)

    if (!matches) {
      return
    }

    console.log("apifunctionmatches: ")
    for (const match of matches) {
      const apiFunctionMatch = match[0]
      console.log("apifunctionmatch: ", apiFunctionMatch)
      apiFunctionMatches.add(apiFunctionMatch)
      this.apiCallingFunctions.add(apiFunctionMatch)
    }

    // If you need to convert the Set back to an array:
    const uniqueMatchesArray = Array.from(apiFunctionMatches)
    console.log("Unique Matches Array: ", uniqueMatchesArray)
  }

  private DeleteRequestFlow(content: string) {
    const lineRegexdelete = new RegExp(
      `\\b(\\w+<.*?>)?\\s*\\.delete\\([^)]*\\)[^}]*}`,
      "g"
    )

    const apiFunctionMatches = new Set<string>() // Use a Set to store unique matches

    // Use matchAll instead of match
    const matches = content.matchAll(lineRegexdelete)

    if (!matches) {
      return
    }

    console.log("apifunctionmatches: ")
    for (const match of matches) {
      const apiFunctionMatch = match[0]
      console.log("apifunctionmatch: ", apiFunctionMatch)
      apiFunctionMatches.add(apiFunctionMatch)
      this.apiCallingFunctions.add(apiFunctionMatch)
    }

    // If you need to convert the Set back to an array:
    const uniqueMatchesArray = Array.from(apiFunctionMatches)
    console.log("Unique Matches Array: ", uniqueMatchesArray)
  }

  //Error handling detect

  private detectFunctionsWithCatchDart(code: string): string[] {
    // Regular expression to match functions with a catch block
    const functionRegex =
      /(\b\w+\b)\([^)]*\)\s*async\s*{\s*try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{[^}]*}/g

    const functions: string[] = []

    let match
    while ((match = functionRegex.exec(code)) !== null) {
      console.log("match: ", match)
      this.errorhandlingarr.push(match[0])
      functions.push(match[1])
    }

    return functions
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
      // Show the webview panel
      // this.createWebviewPanel()
      // vscode.window.showInformationMessage(
      //   `Flutter App Analysis Summary:\nAPI Endpoints: ${Array.from(
      //     this.apiEndpoints
      //   )}\nAPI Calling Functions: ${Array.from(
      //     this.apiCallingFunctions
      //   )}\nFile Structure: ${JSON.stringify(this.fileStructure, null, 2)}`
      // )
    } else {
      vscode.window.showErrorMessage(
        "No workspace folder found. Please open a folder in VSCode."
      )
    }
  }
}



//command mapping with class
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
