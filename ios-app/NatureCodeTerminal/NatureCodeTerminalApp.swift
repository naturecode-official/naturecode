import SwiftUI

@main
struct NatureCodeTerminalApp: App {
    @StateObject private var terminalViewModel = TerminalViewModel()
    @StateObject private var settingsViewModel = SettingsViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(terminalViewModel)
                .environmentObject(settingsViewModel)
                .preferredColorScheme(settingsViewModel.isDarkMode ? .dark : .light)
        }
    }
}

struct ContentView: View {
    @EnvironmentObject var terminalViewModel: TerminalViewModel
    @EnvironmentObject var settingsViewModel: SettingsViewModel
    
    var body: some View {
        NavigationView {
            TerminalView()
                .navigationTitle("NatureCode Terminal")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        NavigationLink(destination: SettingsView()) {
                            Image(systemName: "gear")
                                .foregroundColor(.blue)
                        }
                    }
                    
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button(action: {
                            terminalViewModel.clearTerminal()
                        }) {
                            Image(systemName: "trash")
                                .foregroundColor(.red)
                        }
                    }
                }
        }
        .navigationViewStyle(.stack)
        .onAppear {
            terminalViewModel.showWelcomeMessage()
        }
    }
}

// 预览
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(TerminalViewModel())
            .environmentObject(SettingsViewModel())
            .preferredColorScheme(.dark)
    }
}