import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var viewModel: SettingsViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        Form {
            // 外观设置
            Section("Appearance") {
                Toggle("Dark Mode", isOn: $viewModel.isDarkMode)
                
                Picker("Font Size", selection: $viewModel.fontSize) {
                    Text("Small").tag(12.0)
                    Text("Medium").tag(14.0)
                    Text("Large").tag(16.0)
                }
                
                ColorPicker("Terminal Color", selection: $viewModel.terminalColor)
            }
            
            // AI 配置
            Section("AI Configuration") {
                if viewModel.isAIConfigured {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("AI Service Configured")
                            .foregroundColor(.green)
                    }
                    
                    Button("Reconfigure AI") {
                        viewModel.showAIConfiguration = true
                    }
                    
                    Button("Clear Configuration", role: .destructive) {
                        viewModel.clearAIConfiguration()
                    }
                } else {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text("AI Service Not Configured")
                            .foregroundColor(.orange)
                    }
                    
                    Button("Configure AI") {
                        viewModel.showAIConfiguration = true
                    }
                }
            }
            
            // 终端设置
            Section("Terminal Settings") {
                Toggle("Show Line Numbers", isOn: $viewModel.showLineNumbers)
                Toggle("Enable Syntax Highlighting", isOn: $viewModel.enableSyntaxHighlighting)
                Toggle("Auto-scroll", isOn: $viewModel.autoScroll)
                
                Stepper("History Size: \(viewModel.historySize)", value: $viewModel.historySize, in: 10...1000)
            }
            
            // 关于
            Section("About") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.5.6")
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("Build")
                    Spacer()
                    Text("2026.02.17")
                        .foregroundColor(.secondary)
                }
                
                Link("GitHub Repository", destination: URL(string: "https://github.com/naturecode-official/naturecode")!)
                
                Link("Documentation", destination: URL(string: "https://naturecode.ai/docs")!)
                
                Button("Send Feedback") {
                    // 实现反馈功能
                }
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Done") {
                    dismiss()
                }
            }
        }
        .sheet(isPresented: $viewModel.showAIConfiguration) {
            AIConfigurationView()
                .environmentObject(viewModel)
        }
    }
}

struct AIConfigurationView: View {
    @EnvironmentObject var viewModel: SettingsViewModel
    @Environment(\.dismiss) var dismiss
    
    @State private var selectedProvider: AIService.AIProvider = .deepseek
    @State private var apiKey: String = ""
    @State private var baseURL: String = ""
    @State private var selectedModel: String = ""
    @State private var temperature: Double = 0.7
    @State private var maxTokens: Int = 2000
    @State private var availableModels: [String] = []
    @State private var isLoadingModels = false
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                Section("AI Provider") {
                    Picker("Provider", selection: $selectedProvider) {
                        ForEach(AIService.AIProvider.allCases, id: \.self) { provider in
                            Text(provider.rawValue).tag(provider)
                        }
                    }
                    .onChange(of: selectedProvider) { _ in
                        loadAvailableModels()
                    }
                    
                    if selectedProvider == .custom {
                        TextField("Base URL", text: $baseURL)
                            .textContentType(.URL)
                            .autocapitalization(.none)
                            .disableAutocorrection(true)
                    }
                }
                
                Section("API Configuration") {
                    SecureField("API Key", text: $apiKey)
                        .textContentType(.password)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    if !availableModels.isEmpty {
                        Picker("Model", selection: $selectedModel) {
                            ForEach(availableModels, id: \.self) { model in
                                Text(model).tag(model)
                            }
                        }
                    } else if isLoadingModels {
                        HStack {
                            ProgressView()
                            Text("Loading models...")
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Section("Advanced Settings") {
                    VStack {
                        HStack {
                            Text("Temperature: \(temperature, specifier: "%.1f")")
                            Spacer()
                            Text("(0.0 - 2.0)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        
                        Slider(value: $temperature, in: 0.0...2.0, step: 0.1)
                    }
                    
                    Stepper("Max Tokens: \(maxTokens)", value: $maxTokens, in: 100...8000, step: 100)
                }
                
                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                }
            }
            .navigationTitle("Configure AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveConfiguration()
                    }
                    .disabled(apiKey.isEmpty || selectedModel.isEmpty)
                }
            }
        }
        .onAppear {
            loadCurrentConfiguration()
            loadAvailableModels()
        }
    }
    
    private func loadCurrentConfiguration() {
        if let config = viewModel.aiConfiguration {
            selectedProvider = config.provider
            apiKey = config.apiKey
            baseURL = config.baseURL ?? ""
            selectedModel = config.model
            temperature = config.temperature
            maxTokens = config.maxTokens
        } else {
            // 默认值
            selectedModel = defaultModel(for: selectedProvider)
        }
    }
    
    private func loadAvailableModels() {
        isLoadingModels = true
        errorMessage = nil
        
        Task {
            do {
                let models = try await viewModel.getAvailableModels(for: selectedProvider)
                await MainActor.run {
                    availableModels = models
                    if selectedModel.isEmpty || !models.contains(selectedModel) {
                        selectedModel = models.first ?? defaultModel(for: selectedProvider)
                    }
                    isLoadingModels = false
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Failed to load models: \(error.localizedDescription)"
                    availableModels = [defaultModel(for: selectedProvider)]
                    selectedModel = availableModels.first!
                    isLoadingModels = false
                }
            }
        }
    }
    
    private func defaultModel(for provider: AIService.AIProvider) -> String {
        switch provider {
        case .deepseek:
            return "deepseek-chat"
        case .openai:
            return "gpt-3.5-turbo"
        case .anthropic:
            return "claude-3-haiku"
        case .gemini:
            return "gemini-pro"
        case .ollama:
            return "llama2"
        case .custom:
            return "custom-model"
        }
    }
    
    private func saveConfiguration() {
        let config = AIService.AIConfiguration(
            provider: selectedProvider,
            apiKey: apiKey,
            baseURL: baseURL.isEmpty ? nil : baseURL,
            model: selectedModel,
            temperature: temperature,
            maxTokens: maxTokens
        )
        
        do {
            try viewModel.saveAIConfiguration(config)
            dismiss()
        } catch {
            errorMessage = "Failed to save configuration: \(error.localizedDescription)"
        }
    }
}

// 预览
struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            SettingsView()
                .environmentObject(SettingsViewModel())
        }
    }
}

struct AIConfigurationView_Previews: PreviewProvider {
    static var previews: some View {
        AIConfigurationView()
            .environmentObject(SettingsViewModel())
    }
}