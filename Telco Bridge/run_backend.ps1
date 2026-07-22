$env:JAVA_HOME = "D:\JAVA25"
$env:PATH = "D:\JAVA25\bin;D:\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin;D:\;" + $env:PATH
Set-Location -Path "$PSScriptRoot\backend"
& "D:\apache-maven-3.9.16-bin\apache-maven-3.9.16\bin\mvn.cmd" spring-boot:run
