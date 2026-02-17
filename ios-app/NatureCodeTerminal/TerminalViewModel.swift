import Foundation
import Combine

enum TerminalOutputType {
    case command
    case output
    case error
    case success
    case info
    case welcome
}

struct TerminalOutput: Identifiable {
    let id = UUID()
    let text: String
    let type: TerminalOutputType
    let timestamp: Date
    
    init(_ text: String, type: TerminalOutputType = .output) {
        self.text = text
        self.type = type
        self.timestamp = Date()
    }
}

class TerminalViewModel: ObservableObject {
    @Published var outputLines: [TerminalOutput] = []
    @Published var commandHistory: [String] = []
    @Published var currentDirectory: String = "~"
    @Published var isProcessing: Bool = false
    
    private let terminalService = TerminalService()
    private let aiService = AIService()
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupBindings()
    }
    
    private func setupBindings() {
        terminalService.$currentDirectory
            .assign(to: \.currentDirectory, on: self)
            .store(in: &cancellables)
    }
    
    func showWelcomeMessage() {
        let welcomeMessage = """
        ========================================
        NatureCode Terminal v1.5.6
        iOS Edition
        ========================================
        
        Welcome to NatureCode AI Terminal!
        
        Available commands:
        • help           - Show help information
        • naturecode     - Start NatureCode AI assistant
        • ls             - List files (sandbox only)
        • pwd            - Print working directory
        • clear          - Clear terminal
        
        Type 'naturecode start' to begin AI session.
        
        ========================================
        """
        
        addOutput(TerminalOutput(welcomeMessage, type: .welcome))
        addOutput(TerminalOutput("naturecode-ios:~$ ", type: .command))
    }
    
    func executeCommand(_ command: String) {
        guard !command.isEmpty else { return }
        
        // 添加到历史记录
        if !commandHistory.contains(command) {
            commandHistory.append(command)
            if commandHistory.count > 50 {
                commandHistory.removeFirst()
            }
        }
        
        // 显示命令
        addOutput(TerminalOutput(command, type: .command))
        
        // 处理特殊命令
        if command.lowercased() == "clear" {
            clearTerminal()
            return
        }
        
        if command.lowercased() == "help" {
            showHelp()
            return
        }
        
        // 执行命令
        isProcessing = true
        
        Task {
            do {
                let result = try await executeCommandAsync(command)
                await MainActor.run {
                    addOutput(TerminalOutput(result, type: .output))
                    addOutput(TerminalOutput("naturecode-ios:~$ ", type: .command))
                    isProcessing = false
                }
            } catch {
                await MainActor.run {
                    addOutput(TerminalOutput("Error: \(error.localizedDescription)", type: .error))
                    addOutput(TerminalOutput("naturecode-ios:~$ ", type: .command))
                    isProcessing = false
                }
            }
        }
    }
    
    private func executeCommandAsync(_ command: String) async throws -> String {
        if command.starts(with: "naturecode") {
            return try await executeNatureCodeCommand(command)
        } else {
            return try await terminalService.executeCommand(command)
        }
    }
    
    private func executeNatureCodeCommand(_ command: String) async throws -> String {
        if command == "naturecode" || command == "naturecode --help" {
            return """
            NatureCode AI Assistant v1.5.6
            
            Available commands:
            • naturecode start      - Start interactive AI session
            • naturecode model      - Configure AI model and API
            • naturecode code       - Code analysis tools
            • naturecode project    - Project management tools
            • naturecode --help     - Show this help
            • naturecode --version  - Show version
            
            Note: Some features require network connection.
            """
        } else if command == "naturecode start" {
            return """
            Starting NatureCode AI assistant...
            
            [AI Session Started]
            Type your questions or commands.
            Type 'exit' to end session.
            
            Note: Full AI features require network connection.
            To configure AI model, run: naturecode model
            """
        } else if command == "naturecode --version" {
            return "NatureCode v1.5.6 (iOS Edition)"
        } else {
            return "Unknown NatureCode command. Type 'naturecode --help' for usage."
        }
    }
    
    private func showHelp() {
        let helpText = """
        Terminal Help:
        
        Basic Commands:
        • help           - Show this help
        • clear          - Clear terminal screen
        • pwd            - Print working directory
        
        NatureCode Commands:
        • naturecode     - NatureCode AI assistant
        • naturecode start - Start AI session
        
        File Operations (Sandbox):
        • ls             - List files in sandbox
        • cat <file>     - View file content
        • echo <text>    - Print text
        
        Note: iOS sandbox restrictions apply.
        Some Linux commands may not be available.
        """
        
        addOutput(TerminalOutput(helpText, type: .info))
    }
    
    func clearTerminal() {
        outputLines.removeAll()
        showWelcomeMessage()
    }
    
    private func addOutput(_ output: TerminalOutput) {
        outputLines.append(output)
        
        // 限制输出行数
        if outputLines.count > 1000 {
            outputLines.removeFirst(200)
        }
    }
    
    func navigateHistory(up: Bool) -> String? {
        // 实现命令历史导航
        return nil
    }
}