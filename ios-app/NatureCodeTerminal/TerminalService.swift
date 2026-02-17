import Foundation

enum TerminalError: LocalizedError {
    case commandFailed(String)
    case unsupportedCommand
    case sandboxRestriction
    
    var errorDescription: String? {
        switch self {
        case .commandFailed(let message):
            return "Command failed: \(message)"
        case .unsupportedCommand:
            return "Unsupported command in iOS sandbox"
        case .sandboxRestriction:
            return "Operation not allowed due to iOS sandbox restrictions"
        }
    }
}

class TerminalService: ObservableObject {
    @Published var currentDirectory: String = "~"
    
    private let fileManager = FileManager.default
    private let allowedCommands = ["ls", "pwd", "echo", "cat"]
    
    func executeCommand(_ command: String) async throws -> String {
        let trimmedCommand = command.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // 解析命令和参数
        let components = trimmedCommand.components(separatedBy: .whitespaces)
        guard let commandName = components.first?.lowercased() else {
            throw TerminalError.unsupportedCommand
        }
        
        let arguments = Array(components.dropFirst())
        
        switch commandName {
        case "ls":
            return try await listFiles(arguments: arguments)
        case "pwd":
            return currentDirectory
        case "echo":
            return arguments.joined(separator: " ")
        case "cat":
            return try await readFile(arguments: arguments)
        case "help":
            return showHelp()
        default:
            // 尝试执行系统命令（有限支持）
            return try await executeSystemCommand(commandName, arguments: arguments)
        }
    }
    
    private func listFiles(arguments: [String]) async throws -> String {
        let path = arguments.first ?? "."
        let url = urlForPath(path)
        
        do {
            let contents = try fileManager.contentsOfDirectory(at: url, includingPropertiesForKeys: nil)
            let fileList = contents.map { fileURL -> String in
                let isDirectory = (try? fileURL.resourceValues(forKeys: [.isDirectoryKey]))?.isDirectory ?? false
                let fileName = fileURL.lastPathComponent
                return isDirectory ? "📁 \(fileName)/" : "📄 \(fileName)"
            }
            
            if fileList.isEmpty {
                return "(empty directory)"
            }
            
            return fileList.joined(separator: "\n")
        } catch {
            throw TerminalError.commandFailed("Cannot list directory: \(error.localizedDescription)")
        }
    }
    
    private func readFile(arguments: [String]) async throws -> String {
        guard let fileName = arguments.first else {
            throw TerminalError.commandFailed("No file specified")
        }
        
        let url = urlForPath(fileName)
        
        // 安全检查：确保在应用沙盒内
        guard isWithinSandbox(url: url) else {
            throw TerminalError.sandboxRestriction
        }
        
        do {
            let content = try String(contentsOf: url, encoding: .utf8)
            return content
        } catch {
            throw TerminalError.commandFailed("Cannot read file: \(error.localizedDescription)")
        }
    }
    
    private func executeSystemCommand(_ command: String, arguments: [String]) async throws -> String {
        // iOS 沙盒限制，只能执行有限命令
        // 这里可以添加更多支持的命令
        
        if command == "whoami" {
            return "ios-user"
        } else if command == "date" {
            let formatter = DateFormatter()
            formatter.dateFormat = "EEE MMM d HH:mm:ss zzz yyyy"
            return formatter.string(from: Date())
        } else if command == "uname" {
            return "Darwin"
        } else if command == "hostname" {
            return UIDevice.current.name
        } else {
            throw TerminalError.unsupportedCommand
        }
    }
    
    private func showHelp() -> String {
        return """
        Available commands in iOS sandbox:
        
        File Operations:
        • ls [path]      - List files and directories
        • cat <file>     - View file content
        • pwd            - Print working directory
        
        System Info:
        • whoami         - Show current user
        • date           - Show current date/time
        • uname          - Show system name
        • hostname       - Show device name
        
        Utilities:
        • echo <text>    - Print text
        • help           - Show this help
        
        Note: iOS sandbox restrictions apply.
        Some commands may have limited functionality.
        """
    }
    
    private func urlForPath(_ path: String) -> URL {
        if path == "~" || path == "~/" {
            return fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        } else if path.starts(with: "~/") {
            let relativePath = String(path.dropFirst(2))
            let docsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
            return docsURL.appendingPathComponent(relativePath)
        } else if path == "." {
            // 当前目录实现
            return fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        } else if path == ".." {
            // 父目录实现
            let docsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
            return docsURL.deletingLastPathComponent()
        } else {
            // 相对路径
            let baseURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
            return baseURL.appendingPathComponent(path)
        }
    }
    
    private func isWithinSandbox(url: URL) -> Bool {
        let sandboxURLs = [
            fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!,
            fileManager.urls(for: .libraryDirectory, in: .userDomainMask).first!,
            fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first!,
            fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        ]
        
        for sandboxURL in sandboxURLs {
            if url.path.hasPrefix(sandboxURL.path) {
                return true
            }
        }
        
        return false
    }
    
    func createFile(name: String, content: String) throws {
        let url = urlForPath(name)
        
        guard isWithinSandbox(url: url) else {
            throw TerminalError.sandboxRestriction
        }
        
        try content.write(to: url, atomically: true, encoding: .utf8)
    }
    
    func deleteFile(name: String) throws {
        let url = urlForPath(name)
        
        guard isWithinSandbox(url: url) else {
            throw TerminalError.sandboxRestriction
        }
        
        try fileManager.removeItem(at: url)
    }
}