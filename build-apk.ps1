# Build IgniteChat APK natively using Gradle
Write-Host "Building IgniteChat APK using Capacitor and Gradle..." -ForegroundColor Cyan

# Ensure we are in the root directory
$scriptPath = $PSScriptRoot
Set-Location -Path $scriptPath

Write-Host "Step 1: Building frontend assets for Mobile..." -ForegroundColor Yellow
Set-Location -Path "frontend"
# Temporarily overwrite .env.production with live API URL since mobile runs on localhost
"VITE_API_URL=https://api.ignite-chat-freex.dns.army/api`n" | Out-File -FilePath .env.production -Encoding utf8
npm run build
# Restore original setting for web deployment
"VITE_API_URL=/api`n" | Out-File -FilePath .env.production -Encoding utf8

Write-Host "Step 2: Syncing Capacitor Android project..." -ForegroundColor Yellow
npx cap sync android

Write-Host "Step 3: Compiling Android APK..." -ForegroundColor Yellow
Set-Location -Path "android"
.\gradlew assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! 🎉" -ForegroundColor Green
    Write-Host "Your APK is located at: frontend\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
} else {
    Write-Host "Build failed. Please ensure you have the Android SDK cmdline-tools installed or open frontend\android in Android Studio." -ForegroundColor Red
}

Set-Location -Path $scriptPath
