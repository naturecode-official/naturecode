import Foundation
import SwiftUI

class SettingsViewModel: ObservableObject {
    // 外观设置
    @Published var isDarkMode: Bool = true {
        didSet { saveSettings() }
    }
    
    @Published var fontSize: Double = 14.0 {
        didSet { saveSettings() }
    }
    
    @Published var terminalColor: Color = .green {
        didSet { saveSettings() }
    }
    
    // 终端设置
    @Published var showLineNumbers: Bool = false {
        didSet { saveSettings() }
    }
    
    @Published var enableSyntaxHighlighting: Bool = true {
        didSet { saveSettings() }
    }
    
    @Published var autoScroll: Bool = true {
        didSet { saveSettings() }
    }
    
    @Published var historySize: Int = 100 {
        didSet { saveSettings() }
    }
    
    // AI 配置
    @Published var isAIConfigured: Bool = false
    @Published var aiConfiguration: AIService.AIConfiguration?
    @Published var showAIConfiguration: Bool = false
    
    private let userDefaults = UserDefaults.standard
    private let aiService = AIService()
    
    init() {
        loadSettings()
        loadAIConfiguration()
    }
    
    // MARK: - 设置管理
    
    private func loadSettings() {
        isDarkMode = userDefaults.bool(forKey: "isDarkMode")
        fontSize = userDefaults.double(forKey: "fontSize")
        if fontSize == 0 { fontSize = 14.0 }
        
        if let colorData = userDefaults.data(forKey: "terminalColor"),
           let color = try? NSKeyedUnarchiver.unarchivedObject(ofClass: UIColor.self, from: colorData) {
            terminalColor = Color(color)
        }
        
        showLineNumbers = userDefaults.bool(forKey: "showLineNumbers")
        enableSyntaxHighlighting = userDefaults.bool(forKey: "enableSyntaxHighlighting")
        autoScroll = userDefaults.bool(forKey: "autoScroll")
        historySize = userDefaults.integer(forKey: "historySize")
        if historySize == 0 { historySize = 100 }
    }
    
    private func saveSettings() {
        userDefaults.set(isDarkMode, forKey: "isDarkMode")
        userDefaults.set(fontSize, forKey: "fontSize")
        
        if let colorData = try? NSKeyedArchiver.archivedData(withRootObject: UIColor(terminalColor), requiringSecureCoding: false) {
            userDefaults.set(colorData, forKey: "terminalColor")
        }
        
        userDefaults.set(showLineNumbers, forKey: "showLineNumbers")
        userDefaults.set(enableSyntaxHighlighting, forKey: "enableSyntaxHighlighting")
        userDefaults.set(autoScroll, forKey: "autoScroll")
        userDefaults.set(historySize, forKey: "historySize")
    }
    
    func resetToDefaults() {
        isDarkMode = true
        fontSize = 14.0
        terminalColor = .green
        showLineNumbers = false
        enableSyntaxHighlighting = true
        autoScroll = true
        historySize = 100
        
        saveSettings()
    }
    
    // MARK: - AI 配置管理
    
    private func loadAIConfiguration() {
        do {
            if let config = try aiService.loadConfiguration() {
                aiConfiguration = config
                isAIConfigured = true
            }
        } catch {
            print("Failed to load AI configuration: \(error)")
        }
    }
    
    func saveAIConfiguration(_ config: AIService.AIConfiguration) throws {
        try aiService.saveConfiguration(config)
        aiConfiguration = config
        isAIConfigured = true
    }
    
    func clearAIConfiguration() {
        do {
            try aiService.clearConfiguration()
            aiConfiguration = nil
            isAIConfigured = false
        } catch {
            print("Failed to clear AI configuration: \(error)")
        }
    }
    
    func getAvailableModels(for provider: AIService.AIProvider) async throws -> [String] {
        return try await aiService.getAvailableModels(for: provider)
    }
    
    // MARK: - 应用信息
    
    var appVersion: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.5.6"
    }
    
    var buildNumber: String {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "2026.02.17"
    }
    
    var appName: String {
        return Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "NatureCode Terminal"
    }
    
    // MARK: - 实用功能
    
    func exportSettings() -> Data? {
        let settings: [String: Any] = [
            "isDarkMode": isDarkMode,
            "fontSize": fontSize,
            "showLineNumbers": showLineNumbers,
            "enableSyntaxHighlighting": enableSyntaxHighlighting,
            "autoScroll": autoScroll,
            "historySize": historySize,
            "appVersion": appVersion,
            "exportDate": Date().ISO8601Format()
        ]
        
        return try? JSONSerialization.data(withJSONObject: settings, options: .prettyPrinted)
    }
    
    func importSettings(from data: Data) throws {
        guard let settings = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw SettingsError.invalidFormat
        }
        
        if let darkMode = settings["isDarkMode"] as? Bool {
            isDarkMode = darkMode
        }
        
        if let fontSize = settings["fontSize"] as? Double {
            self.fontSize = fontSize
        }
        
        if let showLineNumbers = settings["showLineNumbers"] as? Bool {
            self.showLineNumbers = showLineNumbers
        }
        
        if let enableSyntaxHighlighting = settings["enableSyntaxHighlighting"] as? Bool {
            self.enableSyntaxHighlighting = enableSyntaxHighlighting
        }
        
        if let autoScroll = settings["autoScroll"] as? Bool {
            self.autoScroll = autoScroll
        }
        
        if let historySize = settings["historySize"] as? Int {
            self.historySize = historySize
        }
        
        saveSettings()
    }
    
    func sendFeedback(subject: String, message: String) async throws {
        // 实现反馈发送逻辑
        // 这里可以集成邮件发送或 API 调用
        try await Task.sleep(nanoseconds: 1_000_000_000) // 模拟网络请求
    }
    
    func checkForUpdates() async throws -> UpdateInfo? {
        // 实现更新检查逻辑
        // 这里可以调用 GitHub API 检查新版本
        return nil
    }
}

// 错误类型
enum SettingsError: LocalizedError {
    case invalidFormat
    case importFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidFormat:
            return "Invalid settings format"
        case .importFailed:
            return "Failed to import settings"
        }
    }
}

// 更新信息
struct UpdateInfo {
    let version: String
    let buildNumber: String
    let releaseNotes: String
    let downloadURL: URL
    let isMandatory: Bool
}

// 扩展 Date 用于 ISO8601 格式化
extension Date {
    func ISO8601Format() -> String {
        let formatter = ISO8601DateFormatter()
        return formatter.string(from: self)
    }
}