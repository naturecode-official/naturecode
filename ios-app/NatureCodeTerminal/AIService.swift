import Foundation

class AIService: ObservableObject {
    private let networkService = NetworkService()
    private let keychainService = KeychainService()
    
    // 支持的 AI 提供商
    enum AIProvider: String, CaseIterable {
        case deepseek = "DeepSeek"
        case openai = "OpenAI"
        case anthropic = "Anthropic"
        case gemini = "Google Gemini"
        case ollama = "Ollama"
        case custom = "Custom"
    }
    
    // AI 配置
    struct AIConfiguration: Codable {
        var provider: AIProvider
        var apiKey: String
        var baseURL: String?
        var model: String
        var temperature: Double
        var maxTokens: Int
        
        static var `default`: AIConfiguration {
            AIConfiguration(
                provider: .deepseek,
                apiKey: "",
                baseURL: nil,
                model: "deepseek-chat",
                temperature: 0.7,
                maxTokens: 2000
            )
        }
    }
    
    @Published var configuration: AIConfiguration = .default
    @Published var isConfigured: Bool = false
    @Published var lastError: String?
    
    init() {
        loadConfiguration()
    }
    
    private func loadConfiguration() {
        do {
            if let savedConfig = try keychainService.loadConfiguration() {
                configuration = savedConfig
                isConfigured = !savedConfig.apiKey.isEmpty
            }
        } catch {
            lastError = "Failed to load configuration: \(error.localizedDescription)"
        }
    }
    
    func saveConfiguration(_ config: AIConfiguration) throws {
        configuration = config
        isConfigured = !config.apiKey.isEmpty
        
        try keychainService.saveConfiguration(config)
    }
    
    func clearConfiguration() throws {
        configuration = .default
        isConfigured = false
        
        try keychainService.clearConfiguration()
    }
    
    // AI 对话
    func sendMessage(_ message: String) async throws -> String {
        guard isConfigured else {
            throw AIError.notConfigured
        }
        
        guard !configuration.apiKey.isEmpty else {
            throw AIError.invalidAPIKey
        }
        
        do {
            let response = try await networkService.sendAIRequest(
                message: message,
                configuration: configuration
            )
            
            return response
        } catch {
            lastError = error.localizedDescription
            throw error
        }
    }
    
    // 代码分析
    func analyzeCode(_ code: String, language: String) async throws -> String {
        let prompt = """
        Analyze the following \(language) code:
        
        \(code)
        
        Please provide:
        1. Code quality assessment
        2. Potential issues or bugs
        3. Performance considerations
        4. Security concerns
        5. Improvement suggestions
        
        Format the response clearly.
        """
        
        return try await sendMessage(prompt)
    }
    
    // 项目分析
    func analyzeProjectStructure(_ structure: String) async throws -> String {
        let prompt = """
        Analyze this project structure:
        
        \(structure)
        
        Please provide:
        1. Overall project organization assessment
        2. Directory structure recommendations
        3. Missing files or configurations
        4. Best practices suggestions
        5. Potential improvements
        
        Format the response clearly.
        """
        
        return try await sendMessage(prompt)
    }
    
    // 获取可用模型
    func getAvailableModels(for provider: AIProvider) async throws -> [String] {
        switch provider {
        case .deepseek:
            return ["deepseek-chat", "deepseek-coder"]
        case .openai:
            return ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
        case .anthropic:
            return ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]
        case .gemini:
            return ["gemini-pro", "gemini-pro-vision"]
        case .ollama:
            return ["llama2", "mistral", "codellama"]
        case .custom:
            return ["custom-model"]
        }
    }
}

// 错误类型
enum AIError: LocalizedError {
    case notConfigured
    case invalidAPIKey
    case networkError(String)
    case rateLimitExceeded
    case invalidResponse
    
    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "AI service is not configured. Please run 'naturecode model' first."
        case .invalidAPIKey:
            return "Invalid API key. Please check your configuration."
        case .networkError(let message):
            return "Network error: \(message)"
        case .rateLimitExceeded:
            return "Rate limit exceeded. Please try again later."
        case .invalidResponse:
            return "Invalid response from AI service."
        }
    }
}

// 网络服务
class NetworkService {
    private let session = URLSession.shared
    
    func sendAIRequest(message: String, configuration: AIService.AIConfiguration) async throws -> String {
        var request: URLRequest
        
        switch configuration.provider {
        case .deepseek:
            request = try createDeepSeekRequest(message: message, config: configuration)
        case .openai:
            request = try createOpenAIRequest(message: message, config: configuration)
        case .anthropic:
            request = try createAnthropicRequest(message: message, config: configuration)
        case .gemini:
            request = try createGeminiRequest(message: message, config: configuration)
        case .ollama:
            request = try createOllamaRequest(message: message, config: configuration)
        case .custom:
            request = try createCustomRequest(message: message, config: configuration)
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AIError.networkError("Invalid response")
        }
        
        switch httpResponse.statusCode {
        case 200:
            return try parseAIResponse(data: data, provider: configuration.provider)
        case 401:
            throw AIError.invalidAPIKey
        case 429:
            throw AIError.rateLimitExceeded
        case 400...499:
            throw AIError.networkError("Client error: \(httpResponse.statusCode)")
        case 500...599:
            throw AIError.networkError("Server error: \(httpResponse.statusCode)")
        default:
            throw AIError.networkError("Unexpected status code: \(httpResponse.statusCode)")
        }
    }
    
    private func createDeepSeekRequest(message: String, config: AIService.AIConfiguration) throws -> URLRequest {
        let url = URL(string: config.baseURL ?? "https://api.deepseek.com/v1/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(config.apiKey)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = [
            "model": config.model,
            "messages": [
                ["role": "user", "content": message]
            ],
            "temperature": config.temperature,
            "max_tokens": config.maxTokens
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        return request
    }
    
    private func createOpenAIRequest(message: String, config: AIService.AIConfiguration) throws -> URLRequest {
        let url = URL(string: config.baseURL ?? "https://api.openai.com/v1/chat/completions")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(config.apiKey)", forHTTPHeaderField: "Authorization")
        
        let body: [String: Any] = [
            "model": config.model,
            "messages": [
                ["role": "user", "content": message]
            ],
            "temperature": config.temperature,
            "max_tokens": config.maxTokens
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        return request
    }
    
    // 其他提供商的请求创建方法类似...
    private func createAnthropicRequest(message: String, config: AIService.AIConfiguration) throws -> URLRequest {
        // 实现 Anthropic API 请求
        fatalError("Not implemented")
    }
    
    private func createGeminiRequest(message: String, config: AIService.AIConfiguration) throws -> URLRequest {
        // 实现 Gemini API 请求
        fatalError("Not implemented")
    }
    
    private func createOllamaRequest(message: String, config: AIService.AIConfiguration) throws -> URLRequest {
        // 实现 Ollama API 请求
        fatalError("Not implemented")
    }
    
    private func createCustomRequest(message: String, config: AIService.AIConfiguration) throws -> URLRequest {
        guard let baseURL = config.baseURL, let url = URL(string: baseURL) else {
            throw AIError.networkError("Invalid base URL for custom provider")
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(config.apiKey)", forHTTPHeaderField: "Authorization")
        
        // 自定义提供商的请求体格式
        let body: [String: Any] = [
            "model": config.model,
            "messages": [
                ["role": "user", "content": message]
            ],
            "temperature": config.temperature,
            "max_tokens": config.maxTokens
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        return request
    }
    
    private func parseAIResponse(data: Data, provider: AIService.AIProvider) throws -> String {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw AIError.invalidResponse
        }
        
        switch provider {
        case .deepseek, .openai, .custom:
            if let choices = json["choices"] as? [[String: Any]],
               let firstChoice = choices.first,
               let message = firstChoice["message"] as? [String: Any],
               let content = message["content"] as? String {
                return content.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        case .anthropic:
            // Anthropic 的响应格式不同
            if let content = json["content"] as? [[String: Any]],
               let text = content.first?["text"] as? String {
                return text.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        case .gemini:
            // Gemini 的响应格式不同
            if let candidates = json["candidates"] as? [[String: Any]],
               let firstCandidate = candidates.first,
               let content = firstCandidate["content"] as? [String: Any],
               let parts = content["parts"] as? [[String: Any]],
               let text = parts.first?["text"] as? String {
                return text.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        case .ollama:
            // Ollama 的响应格式
            if let response = json["response"] as? String {
                return response.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        
        throw AIError.invalidResponse
    }
}

// 钥匙串服务
class KeychainService {
    private let service = "com.naturecode.terminal"
    private let configKey = "ai_configuration"
    
    func saveConfiguration(_ config: AIService.AIConfiguration) throws {
        let encoder = JSONEncoder()
        let data = try encoder.encode(config)
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: configKey,
            kSecValueData as String: data
        ]
        
        // 先删除现有的
        SecItemDelete(query as CFDictionary)
        
        // 添加新的
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed
        }
    }
    
    func loadConfiguration() throws -> AIService.AIConfiguration? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: configKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        
        guard status == errSecSuccess, let data = item as? Data else {
            if status == errSecItemNotFound {
                return nil
            }
            throw KeychainError.loadFailed
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode(AIService.AIConfiguration.self, from: data)
    }
    
    func clearConfiguration() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: configKey
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.deleteFailed
        }
    }
}

enum KeychainError: LocalizedError {
    case saveFailed
    case loadFailed
    case deleteFailed
    
    var errorDescription: String? {
        switch self {
        case .saveFailed:
            return "Failed to save configuration to keychain"
        case .loadFailed:
            return "Failed to load configuration from keychain"
        case .deleteFailed:
            return "Failed to delete configuration from keychain"
        }
    }
}