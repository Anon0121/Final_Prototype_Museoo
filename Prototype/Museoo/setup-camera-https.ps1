Write-Host "🔐 Setting up HTTPS for camera access..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Please run this from the Museoo directory" -ForegroundColor Red
    exit 1
}

Write-Host "📱 Current setup: HTTPS enabled for camera access" -ForegroundColor Yellow
Write-Host "🌐 Access your site at: https://192.168.1.9:5173/admin" -ForegroundColor Cyan

Write-Host "`n🔧 To eliminate security warnings:" -ForegroundColor Yellow
Write-Host "1. Download mkcert: https://github.com/FiloSottile/mkcert/releases" -ForegroundColor White
Write-Host "2. Install: mkcert -install" -ForegroundColor White
Write-Host "3. Generate: mkcert localhost 192.168.1.9 127.0.0.1" -ForegroundColor White
Write-Host "4. Move files to certs/ folder" -ForegroundColor White

Write-Host "`n📱 For now, camera will work with security warning:" -ForegroundColor Green
Write-Host "• Accept the security warning on your phone" -ForegroundColor White
Write-Host "• Click 'Advanced' → 'Proceed to site'" -ForegroundColor White
Write-Host "• Camera will work after that!" -ForegroundColor White

Write-Host "`n🚀 Starting development server..." -ForegroundColor Green
npm run dev
