@echo off
REM Batch script to generate a new PKCS12 (.p12) SSL certificate for Liberty

set KEYSTORE_FILE=key.p12
set KEYSTORE_PASSWORD=ChangeMe123!
set CERT_ALIAS=liberty-server
set VALIDITY_DAYS=365

REM Remove old keystore if exists
del /Q %KEYSTORE_FILE%

REM Generate new PKCS12 keystore with self-signed certificate
keytool -genkeypair -alias %CERT_ALIAS% ^
    -keyalg RSA ^
    -keysize 2048 ^
    -validity %VALIDITY_DAYS% ^
    -keystore %KEYSTORE_FILE% ^
    -storetype PKCS12 ^
    -storepass %KEYSTORE_PASSWORD% ^
    -keypass %KEYSTORE_PASSWORD% ^
    -dname "CN=localhost, OU=Dev, O=ATOM LMS, L=Mumbai, S=Maharashtra, C=IN" ^
    -ext SAN=dns:localhost,ip:127.0.0.1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SSL Certificate generated successfully!
    echo Keystore: %KEYSTORE_FILE%
    echo Password: %KEYSTORE_PASSWORD%
    echo Alias: %CERT_ALIAS%
    echo.
    echo Please update your liberty-server.xml with:
    echo   location="key.p12"
    echo   password="ChangeMe123!"
    echo.
) else (
    echo Error generating SSL certificate!
    echo Ensure Java keytool is in your PATH.
)
pause
