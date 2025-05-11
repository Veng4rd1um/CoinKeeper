<#
.SYNOPSIS
    Collects all project code into a single text file.
#>

# Get the directory where the script is located
$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
}

# Set parameters
$SourcePath = $scriptDir
$OutputFile = Join-Path -Path $scriptDir -ChildPath "project_code.txt"
$ExcludeDirs = @(".git", ".idea", "build", "node_modules", "dist", "target", "__pycache__", "venv", ".gradle", ".env", ".venv", "env")
$ExcludeFiles = @("project_code.txt", "CollectCode.bat", "CollectCode.ps1", "package-lock.json", "yarn.lock", "*.class", "*.jar", "*.war", "*.pyc", "*.pyo")
$ExcludeExtensions = @(".exe", ".dll", ".so", ".dylib", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff", ".ttf", ".eot", ".zip", ".tar", ".gz", ".mp3", ".mp4")

Write-Host "Starting code collection from $SourcePath"
Write-Host "Output will be saved to $OutputFile"

try {
    # Create or clear the output file
    "# PROJECT CODE COMPILATION" | Out-File -FilePath $OutputFile -Encoding utf8 -Force
    "# Generated on $(Get-Date)" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "# Source: $SourcePath" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "" | Out-File -FilePath $OutputFile -Encoding utf8 -Append

    # Track statistics
    $fileCount = 0
    $totalSize = 0
    $startTime = Get-Date
    
    # Known code extensions for React, Java, Python, Kotlin, Android projects
    $knownCodeExtensions = @(".js", ".jsx", ".ts", ".tsx", ".java", ".py", ".kt", ".xml", ".json", ".html", ".css", 
                            ".scss", ".less", ".md", ".txt", ".sh", ".bat", ".ps1", ".yml", ".yaml", ".c", ".cpp", 
                            ".h", ".cs", ".go", ".rb", ".php", ".swift", ".rs", ".dart", ".gradle", ".properties")
    
    # Use a queue for directory traversal (avoids recursion issues)
    $directoriesToProcess = New-Object System.Collections.Queue
    $directoriesToProcess.Enqueue($SourcePath)
    $processedDirs = 0
    
    while ($directoriesToProcess.Count -gt 0) {
        $currentDir = $directoriesToProcess.Dequeue()
        $processedDirs++
        
        # Report progress periodically
        if ($processedDirs % 10 -eq 0) {
            Write-Host "Processed $processedDirs directories, $fileCount files, queue size: $($directoriesToProcess.Count)"
        }
        
        # Get all files in the current directory (non-recursive)
        try {
            $files = Get-ChildItem -Path $currentDir -File -ErrorAction SilentlyContinue
            
            # Process each file in the directory
            foreach ($file in $files) {
                try {
                    # Skip excluded files
                    $skipFile = $false
                    foreach ($pattern in $ExcludeFiles) {
                        if ($file.Name -like $pattern) {
                            $skipFile = $true
                            break
                        }
                    }
                    if ($skipFile) { continue }
                    
                    # Skip excluded extensions
                    if ($ExcludeExtensions -contains $file.Extension) {
                        continue
                    }
                    
                    # Skip files larger than 10MB
                    if ($file.Length -gt 10MB) {
                        continue
                    }
                    
                    # Skip files that are not code files
                    if ($knownCodeExtensions -notcontains $file.Extension) {
                        continue
                    }
                    
                    # Get relative path from source
                    $relativePath = $file.FullName.Substring($SourcePath.Length).TrimStart('\', '/')
                    
                    # Write file header
                    "" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
                    "###############################################################################" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
                    "# FILE: $relativePath" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
                    "###############################################################################" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
                    "" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
                    
                    # Write file content - use .NET method for better performance
                    [System.IO.File]::AppendAllText($OutputFile, [System.IO.File]::ReadAllText($file.FullName) + "`r`n")
                    
                    $fileCount++
                    $totalSize += $file.Length
                }
                catch {
                    Write-Warning "Failed to process file: $($file.FullName). Error: $_"
                }
            }
            
            # Get all subdirectories and add them to the queue
            $subdirs = Get-ChildItem -Path $currentDir -Directory -ErrorAction SilentlyContinue
            foreach ($dir in $subdirs) {
                # Skip excluded directories
                if ($ExcludeDirs -contains $dir.Name) {
                    continue
                }
                $directoriesToProcess.Enqueue($dir.FullName)
            }
        }
        catch {
            Write-Warning "Failed to process directory: $currentDir. Error: $_"
        }
    }

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    # Write summary at the end of the file
    "" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "###############################################################################" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "# SUMMARY" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "# Total files: $fileCount" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "# Total size: $([Math]::Round($totalSize / 1KB, 2)) KB" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "# Processing time: $([Math]::Round($duration, 2)) seconds" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    "###############################################################################" | Out-File -FilePath $OutputFile -Encoding utf8 -Append
    
    Write-Host "Code collection complete!" -ForegroundColor Green
    Write-Host "Processed $fileCount files ($([Math]::Round($totalSize / 1KB, 2)) KB) in $([Math]::Round($duration, 2)) seconds."
    Write-Host "Output saved to: $OutputFile"
    
    # Keep the window open
    Write-Host ""
    Write-Host "Press any key to exit..." -NoNewline
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
catch {
    Write-Error "An error occurred: $_"
    Write-Host "Press any key to exit..." -NoNewline
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}