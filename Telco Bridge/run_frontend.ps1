$env:PATH = "D:\;" + $env:PATH
Set-Location -Path "$PSScriptRoot\frontend"
& "D:\npm.cmd" run dev
