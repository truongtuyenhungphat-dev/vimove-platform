@echo off
chcp 65001 >nul
echo ==========================================
echo    TỰ ĐỘNG ĐẨY CODE LÊN GITHUB & DEPLOY
echo ==========================================
echo.

set /p commit_msg="Nhap noi dung thay doi (Nhan Enter de dung noi dung 'Auto update'): "
if "%commit_msg%"=="" set commit_msg="Auto update"

echo.
echo Dang luu va day code len...
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "%commit_msg%"
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ==========================================
echo HOAN TAT! 
echo Da day ma nguon len GitHub.
echo Neu ban da lien ket GitHub voi Netlify, website se tu dong duoc deploy trong it phut!
echo ==========================================
pause
