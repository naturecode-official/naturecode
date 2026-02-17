import SwiftUI

struct TerminalView: View {
    @EnvironmentObject var viewModel: TerminalViewModel
    @State private var commandInput: String = ""
    @FocusState private var isInputFocused: Bool
    
    var body: some View {
        VStack(spacing: 0) {
            // 终端输出区域
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 4) {
                        ForEach(viewModel.outputLines) { line in
                            TerminalOutputLine(line: line)
                                .id(line.id)
                        }
                    }
                    .padding()
                    .onChange(of: viewModel.outputLines.count) { _ in
                        if let lastLine = viewModel.outputLines.last {
                            withAnimation {
                                proxy.scrollTo(lastLine.id, anchor: .bottom)
                            }
                        }
                    }
                }
                .background(Color.black)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            
            // 命令输入区域
            VStack(spacing: 8) {
                HStack {
                    Text("naturecode-ios:~$")
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(.green)
                    
                    TextField("Enter command...", text: $commandInput)
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(.white)
                        .textFieldStyle(PlainTextFieldStyle())
                        .focused($isInputFocused)
                        .onSubmit {
                            executeCommand()
                        }
                        .submitLabel(.send)
                    
                    Button(action: executeCommand) {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.title2)
                            .foregroundColor(.blue)
                    }
                    .disabled(commandInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(.horizontal)
                .padding(.vertical, 12)
                .background(Color(white: 0.1))
                
                // 命令历史导航
                if !viewModel.commandHistory.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(viewModel.commandHistory.prefix(10).reversed(), id: \.self) { command in
                                Button(action: {
                                    commandInput = command
                                    isInputFocused = true
                                }) {
                                    Text(command)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.blue.opacity(0.2))
                                        .cornerRadius(4)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.bottom, 8)
                }
            }
            .background(Color(white: 0.05))
        }
        .background(Color.black)
        .onAppear {
            isInputFocused = true
        }
        .gesture(
            TapGesture()
                .onEnded { _ in
                    isInputFocused = true
                }
        )
    }
    
    private func executeCommand() {
        let command = commandInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !command.isEmpty else { return }
        
        viewModel.executeCommand(command)
        commandInput = ""
        isInputFocused = true
    }
}

struct TerminalOutputLine: View {
    let line: TerminalOutput
    
    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            if line.type == .command {
                Text(">")
                    .foregroundColor(.green)
                    .font(.system(.body, design: .monospaced))
            }
            
            Text(line.text)
                .font(.system(.body, design: .monospaced))
                .foregroundColor(colorForLine(line))
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .multilineTextAlignment(.leading)
        }
    }
    
    private func colorForLine(_ line: TerminalOutput) -> Color {
        switch line.type {
        case .command:
            return .white
        case .output:
            return .white
        case .error:
            return .red
        case .success:
            return .green
        case .info:
            return .blue
        case .welcome:
            return .cyan
        }
    }
}

// 预览
struct TerminalView_Previews: PreviewProvider {
    static var previews: some View {
        TerminalView()
            .environmentObject(TerminalViewModel())
            .preferredColorScheme(.dark)
    }
}