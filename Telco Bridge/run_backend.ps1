$env:JAVA_HOME = "H:\JAVA\openjdk-24.0.2\jdk-24.0.2"
$env:PATH = "$env:JAVA_HOME\bin;H:\MAVEN\apache-maven-3.9.10\bin;" + $env:PATH
Set-Location -Path "$PSScriptRoot\backend"
mvn spring-boot:run

