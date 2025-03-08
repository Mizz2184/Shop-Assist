const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Read the SQL file
const sqlContent = fs.readFileSync('fix-column-case.sql', 'utf8');

// Create an HTML file with the SQL content
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fix Column Case - SQL Commands</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #2563eb;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        h2 {
            color: #4b5563;
            margin-top: 30px;
        }
        pre {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        code {
            font-family: 'Courier New', Courier, monospace;
        }
        .step {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .note {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 10px 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        button {
            background-color: #2563eb;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-top: 10px;
        }
        button:hover {
            background-color: #1d4ed8;
        }
        .copy-success {
            color: #059669;
            margin-left: 10px;
            display: none;
        }
    </style>
</head>
<body>
    <h1>Fix Column Case for Shop Assist</h1>
    
    <div class="note">
        <strong>Note:</strong> You need to run these SQL commands in the Supabase dashboard to fix the column case issue.
    </div>
    
    <div class="step">
        <h2>SQL Commands to Fix Column Case</h2>
        <p>This SQL script will:</p>
        <ul>
            <li>Create the query function if it doesn't exist</li>
            <li>Rename the column from 'imageurl' to 'imageUrl' if it exists</li>
            <li>Add the 'imageUrl' column if it doesn't exist</li>
            <li>Fix the row-level security policy</li>
        </ul>
        <pre><code>${sqlContent}</code></pre>
        <button onclick="copyToClipboard('sql-commands')">Copy to Clipboard</button>
        <span id="sql-commands-success" class="copy-success">Copied!</span>
    </div>
    
    <div class="note">
        <strong>Instructions:</strong>
        <ol>
            <li>Go to the <a href="https://app.supabase.com" target="_blank">Supabase Dashboard</a></li>
            <li>Select your project</li>
            <li>Go to the SQL Editor (left sidebar)</li>
            <li>Create a new query</li>
            <li>Paste the SQL commands from above</li>
            <li>Run the query</li>
            <li>After running the SQL, come back and run the verify-fix.js script to verify the fix</li>
        </ol>
    </div>
    
    <script>
        function copyToClipboard(id) {
            const text = document.querySelector('pre code').textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                const successElement = document.getElementById(\`\${id}-success\`);
                successElement.style.display = 'inline';
                setTimeout(() => {
                    successElement.style.display = 'none';
                }, 2000);
            });
        }
    </script>
</body>
</html>
`;

// Write the HTML file
const htmlFilePath = path.join(__dirname, 'fix-column-case.html');
fs.writeFileSync(htmlFilePath, htmlContent);

// Determine the command to open the HTML file based on the OS
let command;
switch (os.platform()) {
  case 'darwin': // macOS
    command = `open "${htmlFilePath}"`;
    break;
  case 'win32': // Windows
    command = `start "" "${htmlFilePath}"`;
    break;
  default: // Linux and others
    command = `xdg-open "${htmlFilePath}"`;
}

// Open the HTML file in the default browser
console.log('Opening the SQL commands in your browser...');
exec(command, (error) => {
  if (error) {
    console.error('Error opening the file:', error.message);
    console.log('Please open the file manually:', htmlFilePath);
  } else {
    console.log('Successfully opened the SQL commands in your browser.');
    console.log('Follow the instructions to fix the column case issue.');
  }
}); 