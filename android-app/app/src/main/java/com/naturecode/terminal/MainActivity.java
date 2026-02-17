package com.naturecode.terminal;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.method.ScrollingMovementMethod;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {
    
    private TextView terminalOutput;
    private EditText terminalInput;
    private ImageButton sendButton;
    private ImageButton clearButton;
    private ImageButton settingsButton;
    
    private ExecutorService executorService;
    private Handler mainHandler;
    private Process currentProcess;
    private String currentDirectory;
    private StringBuilder commandHistory;
    private int historyIndex;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        // Initialize components
        terminalOutput = findViewById(R.id.terminal_output);
        terminalInput = findViewById(R.id.terminal_input);
        sendButton = findViewById(R.id.send_button);
        clearButton = findViewById(R.id.clear_button);
        settingsButton = findViewById(R.id.settings_button);
        
        // Setup terminal output
        terminalOutput.setMovementMethod(new ScrollingMovementMethod());
        terminalOutput.setTextColor(ContextCompat.getColor(this, R.color.terminal_green));
        terminalOutput.setBackgroundColor(ContextCompat.getColor(this, R.color.terminal_black));
        
        // Setup terminal input
        terminalInput.setBackgroundColor(ContextCompat.getColor(this, R.color.terminal_dark_gray));
        terminalInput.setTextColor(ContextCompat.getColor(this, R.color.terminal_white));
        
        // Initialize variables
        executorService = Executors.newSingleThreadExecutor();
        mainHandler = new Handler(Looper.getMainLooper());
        currentDirectory = getFilesDir().getAbsolutePath();
        commandHistory = new StringBuilder();
        historyIndex = 0;
        
        // Set click listeners
        sendButton.setOnClickListener(v -> executeCommand());
        clearButton.setOnClickListener(v -> clearTerminal());
        settingsButton.setOnClickListener(v -> showSettings());
        
        // Handle enter key in input field
        terminalInput.setOnEditorActionListener((v, actionId, event) -> {
            executeCommand();
            return true;
        });
        
        // Initial welcome message
        showWelcomeMessage();
    }
    
    private void showWelcomeMessage() {
        String welcomeMessage = """
            ========================================
            NatureCode Terminal v1.5.6
            Android Edition
            ========================================
            
            Welcome to NatureCode AI Terminal!
            
            Available commands:
            • help           - Show help information
            • naturecode     - Start NatureCode AI assistant
            • ls             - List files
            • cd <dir>       - Change directory
            • pwd            - Print working directory
            • clear          - Clear terminal
            
            Type 'naturecode start' to begin AI session.
            
            ========================================
            """;
        
        appendToTerminal(welcomeMessage);
        appendToTerminal("naturecode-android:~$ ");
    }
    
    private void executeCommand() {
        String command = terminalInput.getText().toString().trim();
        if (command.isEmpty()) {
            return;
        }
        
        // Add to history
        commandHistory.append(command).append("\n");
        historyIndex = commandHistory.toString().split("\n").length;
        
        // Show command in terminal
        appendToTerminal("> " + command + "\n");
        terminalInput.setText("");
        
        // Hide keyboard
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(terminalInput.getWindowToken(), 0);
        
        // Execute command in background thread
        executorService.execute(() -> {
            try {
                if (command.equals("clear")) {
                    mainHandler.post(this::clearTerminal);
                } else if (command.startsWith("cd ")) {
                    changeDirectory(command.substring(3).trim());
                } else if (command.equals("pwd")) {
                    appendToTerminal(currentDirectory + "\n");
                } else if (command.equals("help")) {
                    showHelp();
                } else if (command.startsWith("naturecode")) {
                    executeNatureCodeCommand(command);
                } else {
                    executeSystemCommand(command);
                }
                
                // Show prompt after command execution
                mainHandler.post(() -> appendToTerminal("naturecode-android:~$ "));
            } catch (Exception e) {
                appendToTerminal("Error: " + e.getMessage() + "\n");
            }
        });
    }
    
    private void executeNatureCodeCommand(String command) {
        if (command.equals("naturecode") || command.equals("naturecode --help")) {
            showNatureCodeHelp();
        } else if (command.equals("naturecode start")) {
            startNatureCodeAI();
        } else if (command.startsWith("naturecode ")) {
            executeNodeScript(command.substring(11));
        } else {
            appendToTerminal("Unknown NatureCode command. Type 'naturecode --help' for usage.\n");
        }
    }
    
    private void startNatureCodeAI() {
        appendToTerminal("Starting NatureCode AI assistant...\n");
        appendToTerminal("Note: Full AI features require network connection.\n");
        appendToTerminal("To configure AI model, run: naturecode model\n");
        appendToTerminal("\n[AI Session Started]\n");
        appendToTerminal("Type your questions or commands. Type 'exit' to end session.\n");
        appendToTerminal("========================================\n");
    }
    
    private void showNatureCodeHelp() {
        String helpText = """
            NatureCode AI Assistant v1.5.6
            
            Available commands:
            • naturecode start      - Start interactive AI session
            • naturecode model      - Configure AI model and API
            • naturecode code       - Code analysis tools
            • naturecode project    - Project management tools
            • naturecode git        - Git operations
            • naturecode plugin     - Plugin management
            • naturecode --help     - Show this help
            • naturecode --version  - Show version
            
            For detailed help on specific commands, run:
            naturecode <command> --help
            """;
        appendToTerminal(helpText);
    }
    
    private void executeSystemCommand(String command) {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder();
            
            if (command.startsWith("ls")) {
                String[] parts = command.split(" ", 2);
                String path = parts.length > 1 ? parts[1] : ".";
                File dir = new File(currentDirectory, path);
                
                if (dir.exists() && dir.isDirectory()) {
                    File[] files = dir.listFiles();
                    if (files != null) {
                        for (File file : files) {
                            String type = file.isDirectory() ? "d" : "-";
                            String name = file.getName();
                            appendToTerminal(type + " " + name + "\n");
                        }
                    }
                } else {
                    appendToTerminal("Directory not found: " + path + "\n");
                }
            } else {
                // Execute shell command
                processBuilder.command("sh", "-c", command);
                processBuilder.directory(new File(currentDirectory));
                
                currentProcess = processBuilder.start();
                
                // Read output
                BufferedReader reader = new BufferedReader(
                    new InputStreamReader(currentProcess.getInputStream()));
                String line;
                while ((line = reader.readLine()) != null) {
                    appendToTerminal(line + "\n");
                }
                
                // Read errors
                BufferedReader errorReader = new BufferedReader(
                    new InputStreamReader(currentProcess.getErrorStream()));
                while ((line = errorReader.readLine()) != null) {
                    appendToTerminal("Error: " + line + "\n");
                }
                
                int exitCode = currentProcess.waitFor();
                if (exitCode != 0) {
                    appendToTerminal("Command exited with code: " + exitCode + "\n");
                }
            }
        } catch (IOException | InterruptedException e) {
            appendToTerminal("Command execution failed: " + e.getMessage() + "\n");
        }
    }
    
    private void executeNodeScript(String args) {
        appendToTerminal("Node.js script execution not available in this version.\n");
        appendToTerminal("Please use the web version at: https://naturecode.ai\n");
    }
    
    private void changeDirectory(String path) {
        File newDir;
        if (path.startsWith("/")) {
            newDir = new File(path);
        } else {
            newDir = new File(currentDirectory, path);
        }
        
        if (newDir.exists() && newDir.isDirectory()) {
            currentDirectory = newDir.getAbsolutePath();
            appendToTerminal("Changed directory to: " + currentDirectory + "\n");
        } else {
            appendToTerminal("Directory not found: " + path + "\n");
        }
    }
    
    private void showHelp() {
        String helpText = """
            Terminal Help:
            
            Basic Commands:
            • help           - Show this help
            • clear          - Clear terminal screen
            • ls [path]      - List files and directories
            • cd <dir>       - Change directory
            • pwd            - Print working directory
            
            NatureCode Commands:
            • naturecode     - NatureCode AI assistant
            • naturecode start - Start AI session
            
            File Operations:
            • cat <file>     - View file content
            • echo <text>    - Print text
            
            Note: Some Linux commands may not be available.
            """;
        appendToTerminal(helpText);
    }
    
    private void clearTerminal() {
        terminalOutput.setText("");
        showWelcomeMessage();
    }
    
    private void showSettings() {
        Toast.makeText(this, "Settings menu coming soon", Toast.LENGTH_SHORT).show();
    }
    
    private void appendToTerminal(final String text) {
        mainHandler.post(() -> {
            terminalOutput.append(text);
            // Auto-scroll to bottom
            final int scrollAmount = terminalOutput.getLayout().getLineTop(
                terminalOutput.getLineCount()) - terminalOutput.getHeight();
            if (scrollAmount > 0) {
                terminalOutput.scrollTo(0, scrollAmount);
            } else {
                terminalOutput.scrollTo(0, 0);
            }
        });
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (executorService != null) {
            executorService.shutdown();
        }
        if (currentProcess != null) {
            currentProcess.destroy();
        }
    }
}