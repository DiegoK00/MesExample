#Requires -Version 7.0
<#
.SYNOPSIS
    Setup and deployment script for MesClaude (API + Web + Mobile).

.DESCRIPTION
    Two modes:
      -Dev    : restore all dependencies for local development
      -Deploy : publish API and install/update it as a Windows Service

.PARAMETER Dev
    Run local developer setup (restore .NET, npm, flutter dependencies).

.PARAMETER Deploy
    Publish API and install or update the Windows Service.

.PARAMETER Uninstall
    Stop and remove the Windows Service.

.PARAMETER ServiceName
    Name of the Windows Service. Default: MesClaudeApi

.PARAMETER InstallPath
    Folder where the published API will be deployed. Default: C:\Services\MesClaudeApi

.PARAMETER ApiUrl
    Base URL the service will listen on. Default: http://localhost:5000

.EXAMPLE
    .\setup.ps1 -Dev
    .\setup.ps1 -Deploy
    .\setup.ps1 -Deploy -ServiceName "MyApi" -InstallPath "D:\Services\MyApi"
    .\setup.ps1 -Uninstall
#>
[CmdletBinding(DefaultParameterSetName = 'Dev')]
param(
    [Parameter(ParameterSetName = 'Dev', Mandatory)]
    [switch]$Dev,

    [Parameter(ParameterSetName = 'Deploy', Mandatory)]
    [switch]$Deploy,

    [Parameter(ParameterSetName = 'Uninstall', Mandatory)]
    [switch]$Uninstall,

    [string]$ServiceName  = 'MesClaudeApi',
    [string]$InstallPath  = 'C:\Services\MesClaudeApi',
    [string]$ApiUrl       = 'http://localhost:5000'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── helpers ──────────────────────────────────────────────────────────────────

function Write-Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "    [WARN] $msg" -ForegroundColor Yellow }
function Write-Fail([string]$msg) { Write-Host "    [FAIL] $msg" -ForegroundColor Red; exit 1 }

function Assert-Command([string]$cmd, [string]$hint) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Fail "'$cmd' not found. $hint"
    }
    Write-Ok "$cmd found"
}

# ── prerequisite check ────────────────────────────────────────────────────────

function Test-Prerequisites([string[]]$required) {
    Write-Step "Checking prerequisites"
    foreach ($req in $required) {
        switch ($req) {
            'dotnet' {
                Assert-Command 'dotnet' 'Install .NET 10 SDK from https://dot.net'
                $ver = (dotnet --version)
                if ($ver -notmatch '^10\.') { Write-Fail ".NET 10 required, found $ver" }
                Write-Ok ".NET version: $ver"
            }
            'node' {
                Assert-Command 'node' 'Install Node.js 20+ from https://nodejs.org'
                $ver = (node --version)
                Write-Ok "Node version: $ver"
            }
            'npm' {
                Assert-Command 'npm' 'npm is bundled with Node.js'
            }
            'flutter' {
                Assert-Command 'flutter' 'Install Flutter SDK from https://flutter.dev'
                $ver = (flutter --version --machine 2>$null | ConvertFrom-Json).frameworkVersion
                Write-Ok "Flutter version: $ver"
            }
        }
    }
}

# ── dev setup ────────────────────────────────────────────────────────────────

function Invoke-DevSetup {
    Test-Prerequisites @('dotnet', 'node', 'npm', 'flutter')

    Write-Step "Restoring .NET dependencies"
    $projects = @('api/Api.csproj', 'Api_Test/Api.Tests.csproj', 'Api_E2E/Api.E2E.csproj', 'Api_Playwright/Api.Playwright.csproj')
    foreach ($proj in $projects) {
        if (Test-Path $proj) {
            dotnet restore $proj
            Write-Ok "Restored $proj"
        } else {
            Write-Warn "$proj not found, skipping"
        }
    }

    Write-Step "Installing web (Angular) dependencies"
    if (Test-Path 'web/package.json') {
        Push-Location web
        npm ci
        Pop-Location
        Write-Ok "npm ci completed"
    } else {
        Write-Warn "web/package.json not found, skipping"
    }

    Write-Step "Installing Flutter (mobile) dependencies"
    if (Test-Path 'mobile/pubspec.yaml') {
        Push-Location mobile
        flutter pub get
        Pop-Location
        Write-Ok "flutter pub get completed"
    } else {
        Write-Warn "mobile/pubspec.yaml not found, skipping"
    }

    Write-Host "`nDev setup complete." -ForegroundColor Green
}

# ── deploy / service setup ────────────────────────────────────────────────────

function Invoke-Deploy {
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
            [Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Fail "Deploy requires Administrator privileges. Re-run from an elevated PowerShell."
    }

    Test-Prerequisites @('dotnet')

    # 1. Publish API
    Write-Step "Publishing API to $InstallPath"
    New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
    dotnet publish api/Api.csproj `
        --configuration Release `
        --output $InstallPath `
        --self-contained false
    Write-Ok "API published"

    # 2. Write env/config override (never commit secrets — use this file on the server)
    $envFile = Join-Path $InstallPath 'appsettings.Production.json'
    if (-not (Test-Path $envFile)) {
        @{
            Urls = $ApiUrl
            Logging = @{ LogLevel = @{ Default = "Information" } }
        } | ConvertTo-Json -Depth 5 | Set-Content $envFile -Encoding UTF8
        Write-Ok "Created $envFile (fill in secrets manually)"
    } else {
        Write-Ok "appsettings.Production.json already exists — not overwritten"
    }

    # 3. Install or update the Windows Service
    $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    $exePath = Join-Path $InstallPath 'api.exe'

    if (-not (Test-Path $exePath)) {
        Write-Fail "Published executable not found at $exePath"
    }

    if ($null -eq $svc) {
        Write-Step "Installing Windows Service '$ServiceName'"
        New-Service `
            -Name        $ServiceName `
            -BinaryPathName "$exePath" `
            -DisplayName "MesClaude API" `
            -Description "MesClaude ASP.NET Core API service" `
            -StartupType Automatic
        Write-Ok "Service installed"
    } else {
        Write-Step "Service '$ServiceName' already exists — stopping for update"
        Stop-Service -Name $ServiceName -Force
        # sc.exe allows updating the binary path without reinstalling
        sc.exe config $ServiceName binPath= "`"$exePath`""
        Write-Ok "Service binary path updated"
    }

    Write-Step "Starting service '$ServiceName'"
    Start-Service -Name $ServiceName
    $status = (Get-Service -Name $ServiceName).Status
    Write-Ok "Service status: $status"

    Write-Host "`nDeploy complete. API listening on $ApiUrl" -ForegroundColor Green
}

# ── uninstall ─────────────────────────────────────────────────────────────────

function Invoke-Uninstall {
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
            [Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Fail "Uninstall requires Administrator privileges."
    }

    $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($null -eq $svc) {
        Write-Warn "Service '$ServiceName' not found — nothing to uninstall."
        return
    }

    Write-Step "Stopping service '$ServiceName'"
    Stop-Service -Name $ServiceName -Force
    Write-Ok "Service stopped"

    Write-Step "Removing service '$ServiceName'"
    sc.exe delete $ServiceName
    Write-Ok "Service removed"

    Write-Host "`nUninstall complete." -ForegroundColor Green
}

# ── entry point ───────────────────────────────────────────────────────────────

switch ($PSCmdlet.ParameterSetName) {
    'Dev'       { Invoke-DevSetup }
    'Deploy'    { Invoke-Deploy }
    'Uninstall' { Invoke-Uninstall }
}
