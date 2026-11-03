# A static file server for developing MarkdownEditor.Web: ES modules are not loaded from file:// pages, so the demo and the
# test page are served from http://localhost. Needs nothing but Windows PowerShell (5.1 or later).
#
#   powershell -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 8765]
#
# Serves the folder above this one; only files inside it, and only to this machine.

param([int]$Port = 8765)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$types = @{
    '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
    '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.md' = 'text/markdown; charset=utf-8'
    '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.gif' = 'image/gif'
    '.ico' = 'image/x-icon'; '.txt' = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/ (Ctrl+C to stop)"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        try {
            $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
            if ($relative -eq '') { $relative = 'demo/index.html' }
            $path = [IO.Path]::GetFullPath((Join-Path $root $relative))
            if (Test-Path $path -PathType Container) { $path = Join-Path $path 'index.html' }
            if (-not $path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $path -PathType Leaf)) {
                $response.StatusCode = 404
                $bytes = [Text.Encoding]::UTF8.GetBytes("Not found: $relative")
            } else {
                $extension = [IO.Path]::GetExtension($path).ToLowerInvariant()
                $type = 'application/octet-stream'
                if ($types.ContainsKey($extension)) { $type = $types[$extension] }
                $response.ContentType = $type
                $response.Headers.Add('Cache-Control', 'no-store')
                $bytes = [IO.File]::ReadAllBytes($path)
            }
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $response.StatusCode = 500
        } finally {
            $response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
}
