param([switch]$SkipVendor)
$ErrorActionPreference='Stop'
$workspaceRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$releaseRoot=Join-Path $workspaceRoot 'releases'
$stageRoot=Join-Path $releaseRoot ('.stage-'+[Guid]::NewGuid().ToString('N'))
function Assert-ReleasePath([string]$target) {
    $resolved=[IO.Path]::GetFullPath($target)
    $prefix=[IO.Path]::GetFullPath($releaseRoot).TrimEnd([IO.Path]::DirectorySeparatorChar)+[IO.Path]::DirectorySeparatorChar
    if(-not $resolved.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){throw "Path keluar dari direktori rilis: $target"}
}
function Copy-ReleaseFile([string]$source,[string]$target) {
    Assert-ReleasePath $target
    $null=New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($target)) -Force
    Copy-Item -LiteralPath $source -Destination $target
}
if(-not (Test-Path -LiteralPath (Join-Path $workspaceRoot 'be-svill/artisan'))){throw 'Jalankan dari workspace SVIL yang lengkap.'}
$null=New-Item -ItemType Directory -Path $stageRoot -Force
Assert-ReleasePath $stageRoot
try {
    $backend=Join-Path $stageRoot 'be-svill';$frontend=Join-Path $stageRoot 'fe-svill'
    $null=New-Item -ItemType Directory -Path $backend,$frontend -Force
    foreach($folder in @('app','config','database','public','routes')) {
        Get-ChildItem -LiteralPath (Join-Path $workspaceRoot ('be-svill/'+$folder)) -Recurse -File | Where-Object {$_.Extension -ne '.sqlite'} | ForEach-Object {
            $relative=[IO.Path]::GetRelativePath((Join-Path $workspaceRoot 'be-svill'),$_.FullName)
            Copy-ReleaseFile $_.FullName (Join-Path $backend $relative)
        }
    }
    foreach($file in @('artisan','composer.json','composer.lock','README.md','.gitignore','.env.production.example','bootstrap/app.php','bootstrap/providers.php')) { Copy-ReleaseFile (Join-Path $workspaceRoot ('be-svill/'+$file)) (Join-Path $backend $file) }
    foreach($folder in @('bootstrap/cache','storage/app/private','storage/app/public','storage/framework/cache/data','storage/framework/sessions','storage/framework/views','storage/logs')) {
        $target=Join-Path $backend $folder;$null=New-Item -ItemType Directory -Path $target -Force
        [IO.File]::WriteAllText((Join-Path $target '.gitignore'),"*`n!.gitignore`n",(New-Object Text.UTF8Encoding($false)))
    }
    if(-not $SkipVendor) {
        Push-Location $backend
        try { & composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction --no-scripts; if($LASTEXITCODE -ne 0){throw 'Composer production gagal.'}; & php artisan package:discover --no-interaction; if($LASTEXITCODE -ne 0){throw 'Package discovery gagal.'}; & composer check-platform-reqs --no-dev --no-interaction; if($LASTEXITCODE -ne 0){throw 'Platform PHP belum memenuhi dependensi.'} }
        finally { Pop-Location }
    }
    foreach($folder in @('app','public')) {
        Get-ChildItem -LiteralPath (Join-Path $workspaceRoot ('fe-svill/'+$folder)) -Recurse -File | ForEach-Object {
            $relative=[IO.Path]::GetRelativePath((Join-Path $workspaceRoot 'fe-svill'),$_.FullName)
            Copy-ReleaseFile $_.FullName (Join-Path $frontend $relative)
        }
    }
    foreach($file in @('package.json','package-lock.json','next.config.ts','eslint.config.mjs','postcss.config.mjs','tsconfig.json','next-env.d.ts','README.md','.gitignore','.env.production.example','scripts/check-api-client.cjs','scripts/check-navigation.cjs')) { $source=Join-Path $workspaceRoot ('fe-svill/'+$file);if(Test-Path -LiteralPath $source){Copy-ReleaseFile $source (Join-Path $frontend $file)} }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $outputs=@()
    foreach($name in @('be-svill','fe-svill')) {
        $zipPath=Join-Path $releaseRoot ($name+'-hosting.zip');Assert-ReleasePath $zipPath
        if(Test-Path -LiteralPath $zipPath){Remove-Item -LiteralPath $zipPath -Force}
        [IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $stageRoot $name),$zipPath,[IO.Compression.CompressionLevel]::Optimal,$true)
        $zip=[IO.Compression.ZipFile]::OpenRead($zipPath)
        try { $bad=$zip.Entries | Where-Object {$_.FullName -match '(^|/)(\.env|\.env\.production|\.env\.local|\.env\.testing)$|^(be-svill|fe-svill)/(\.tools|\.next|node_modules|tests)/|storage/(app/private/.+[^/]$|logs/.+\.log$)' };$bad=@($bad | Where-Object {$_.Name -ne '.gitignore'});if($bad){throw 'Paket mengandung file lokal/rahasia yang tidak boleh dikirim.'} }
        finally { $zip.Dispose() }
        $hash=Get-FileHash -LiteralPath $zipPath -Algorithm SHA256
        $outputs+=($hash.Hash.ToLowerInvariant()+'  '+[IO.Path]::GetFileName($zipPath))
        $file=Get-Item -LiteralPath $zipPath
        Write-Output ($file.Name+' · '+[Math]::Round($file.Length/1MB,2)+' MB')
    }
    [IO.File]::WriteAllText((Join-Path $releaseRoot 'SHA256SUMS.txt'),($outputs -join "`n")+"`n",(New-Object Text.UTF8Encoding($false)))
    Write-Output 'Environment rahasia, database aktual, berkas siswa, cache dan dependency frontend tidak disertakan. Backup data privat dipindahkan secara terpisah.'
}
finally {
    if(Test-Path -LiteralPath $stageRoot){Assert-ReleasePath $stageRoot;if([IO.Path]::GetFileName($stageRoot) -notmatch '^\.stage-[a-f0-9]{32}$'){throw 'Nama staging tidak valid.'};Remove-Item -LiteralPath $stageRoot -Recurse -Force}
}
