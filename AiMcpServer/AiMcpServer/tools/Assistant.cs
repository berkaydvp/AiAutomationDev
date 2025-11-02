using System.ComponentModel;
using ModelContextProtocol.Server;

namespace AiMcpServer.Tools;

[McpServerToolType]
public class Assistant
{
    private static void Log(string message)
    {
        var logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Desktop", "mcp_log.txt");
        File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}\n");
    }

    [McpServerTool(Name = "Greeting"), Description("Belirtilen isimle selamlaşır")]
    public static async Task<string> GreetUser(
        [Description(description: "Kullanıcının ismi")] string userName)
    {
        Log($"GreetUser çağrıldı - userName: {userName}");
        return $"Merhaba, {userName}!";
    }

    [McpServerTool(Name = "ListDirectoryFiles"), Description("Belirtilen dizindeki dosya ve klasörlerin isimlerini listeler")]
    public static async Task<string> ListDirectoryFiles(
        [Description(description: "Listelenecek dizinin tam yolu")] string directoryPath)
    {
        try
        {
            Log($"[BAŞLANGIÇ] ListDirectoryFiles çağrıldı - directoryPath: {directoryPath}");

            // Dizinin var olup olmadığını kontrol et
            Log($"[ADIM 1] Dizin varlığı kontrol ediliyor: {directoryPath}");
            if (!Directory.Exists(directoryPath))
            {
                Log($"[HATA] Dizin bulunamadı: {directoryPath}");
                return $"Hata: '{directoryPath}' dizini bulunamadı.";
            }
            Log($"[ADIM 1] Dizin mevcut");

            // Dizindeki tüm dosya ve klasörleri al
            Log($"[ADIM 2] Dosya sistem girdileri alınıyor...");
            var entries = Directory.GetFileSystemEntries(directoryPath);
            Log($"[ADIM 2] Toplam {entries.Length} girdi bulundu");

            if (entries.Length == 0)
            {
                Log($"[BİTİŞ] Dizin boş");
                return $"'{directoryPath}' dizini boş.";
            }

            // Sonuçları formatla
            var result = new System.Text.StringBuilder();
            result.AppendLine($"'{directoryPath}' dizinindeki içerik:\n");

            // Klasörler
            Log($"[ADIM 3] Klasörler alınıyor...");
            var directories = Directory.GetDirectories(directoryPath);
            Log($"[ADIM 3] {directories.Length} klasör bulundu");
            if (directories.Length > 0)
            {
                result.AppendLine("📁 Klasörler:");
                foreach (var dir in directories)
                {
                    var dirName = Path.GetFileName(dir);
                    Log($"[ADIM 3] Klasör ekleniyor: {dirName}");
                    result.AppendLine($"  - {dirName}/");
                }
                result.AppendLine();
            }

            // Dosyalar
            Log($"[ADIM 4] Dosyalar alınıyor...");
            var files = Directory.GetFiles(directoryPath);
            Log($"[ADIM 4] {files.Length} dosya bulundu");
            if (files.Length > 0)
            {
                result.AppendLine("📄 Dosyalar:");
                foreach (var file in files)
                {
                    var fileInfo = new FileInfo(file);
                    var fileName = Path.GetFileName(file);
                    var fileSize = FormatFileSize(fileInfo.Length);
                    Log($"[ADIM 4] Dosya ekleniyor: {fileName} ({fileSize})");
                    result.AppendLine($"  - {fileName} ({fileSize})");
                }
            }

            result.AppendLine($"\nToplam: {directories.Length} klasör, {files.Length} dosya");
            Log($"[BİTİŞ] Sonuç başarıyla oluşturuldu. Toplam: {directories.Length} klasör, {files.Length} dosya");

            return result.ToString();
        }
        catch (UnauthorizedAccessException ex)
        {
            Log($"[HATA] UnauthorizedAccessException: {ex.Message}");
            return $"Hata: '{directoryPath}' dizinine erişim izni yok.";
        }
        catch (Exception ex)
        {
            Log($"[HATA] Exception: {ex.GetType().Name} - {ex.Message}");
            Log($"[HATA] StackTrace: {ex.StackTrace}");
            return $"Hata: {ex.Message}";
        }
    }

    [McpServerTool(Name = "ReadFileContent"), Description("Belirtilen dosyanın içeriğini okur ve döndürür")]
    public static async Task<string> ReadFileContent(
        [Description(description: "Okunacak dosyanın tam yolu")] string filePath)
    {
        try
        {
            Log($"[BAŞLANGIÇ] ReadFileContent çağrıldı - filePath: {filePath}");

            // Dosyanın var olup olmadığını kontrol et
            Log($"[ADIM 1] Dosya varlığı kontrol ediliyor: {filePath}");
            if (!File.Exists(filePath))
            {
                Log($"[HATA] Dosya bulunamadı: {filePath}");
                return $"Hata: '{filePath}' dosyası bulunamadı.";
            }
            Log($"[ADIM 1] Dosya mevcut");

            // Dosya bilgilerini al
            Log($"[ADIM 2] Dosya bilgileri alınıyor...");
            var fileInfo = new FileInfo(filePath);
            var fileSize = FormatFileSize(fileInfo.Length);
            Log($"[ADIM 2] Dosya boyutu: {fileSize}");

            // Dosya içeriğini oku
            Log($"[ADIM 3] Dosya içeriği okunuyor...");
            var content = await File.ReadAllTextAsync(filePath);
            var lineCount = content.Split('\n').Length;
            Log($"[ADIM 3] İçerik okundu. Satır sayısı: {lineCount}");

            // Sonuç oluştur
            var result = new System.Text.StringBuilder();
            result.AppendLine($"📄 Dosya: {Path.GetFileName(filePath)}");
            result.AppendLine($"📂 Konum: {Path.GetDirectoryName(filePath)}");
            result.AppendLine($"📊 Boyut: {fileSize}");
            result.AppendLine($"📝 Satır Sayısı: {lineCount}");
            result.AppendLine($"\n{'='} İÇERİK {'='}\n");
            result.AppendLine(content);
            result.AppendLine($"\n{'='} İÇERİK SONU {'='}\n");

            Log($"[BİTİŞ] Dosya içeriği başarıyla okundu");
            return result.ToString();
        }
        catch (UnauthorizedAccessException ex)
        {
            Log($"[HATA] UnauthorizedAccessException: {ex.Message}");
            return $"Hata: '{filePath}' dosyasına erişim izni yok.";
        }
        catch (Exception ex)
        {
            Log($"[HATA] Exception: {ex.GetType().Name} - {ex.Message}");
            Log($"[HATA] StackTrace: {ex.StackTrace}");
            return $"Hata: {ex.Message}";
        }
    }

    [McpServerTool(Name = "WriteFileContent"), Description("Belirtilen dosyanın içeriğini siler ve yeni içeriği yazar")]
    public static async Task<string> WriteFileContent(
        [Description(description: "Yazılacak dosyanın tam yolu")] string filePath,
        [Description(description: "Dosyaya yazılacak yeni içerik")] string content)
    {
        try
        {
            Log($"[BAŞLANGIÇ] WriteFileContent çağrıldı - filePath: {filePath}");
            Log($"[BAŞLANGIÇ] İçerik uzunluğu: {content.Length} karakter");

            // Dosyanın var olup olmadığını kontrol et
            Log($"[ADIM 1] Dosya varlığı kontrol ediliyor: {filePath}");
            if (!File.Exists(filePath))
            {
                Log($"[HATA] Dosya bulunamadı: {filePath}");
                return $"Hata: '{filePath}' dosyası bulunamadı.";
            }
            Log($"[ADIM 1] Dosya mevcut");

            var oldFileInfo = new FileInfo(filePath);
            Log($"[ADIM 1] Eski dosya boyutu: {FormatFileSize(oldFileInfo.Length)}");

            // Önce dosya içeriğini tamamen sil
            Log($"[ADIM 2] Dosya içeriği siliniyor...");
            await File.WriteAllTextAsync(filePath, string.Empty);
            Log($"[ADIM 2] Dosya içeriği silindi");

            // Sonra yeni içeriği yaz
            Log($"[ADIM 3] Dosyaya yeni içerik yazılıyor...");
            await File.WriteAllTextAsync(filePath, content);
            Log($"[ADIM 3] İçerik başarıyla yazıldı");

            // Yeni dosya bilgilerini al
            Log($"[ADIM 4] Yeni dosya bilgileri alınıyor...");
            var newFileInfo = new FileInfo(filePath);
            var newFileSize = FormatFileSize(newFileInfo.Length);
            var lineCount = content.Split('\n').Length;
            Log($"[ADIM 4] Yeni dosya boyutu: {newFileSize}, Satır sayısı: {lineCount}");

            // Git'e commit ve push yap
            Log($"[ADIM 5] Git repository kontrol ediliyor...");
            var repoPath = FindGitRepository(filePath);
            var gitResult = "";
            if (!string.IsNullOrEmpty(repoPath))
            {
                try
                {
                    Log($"[ADIM 5] Git repository bulundu: {repoPath}");

                    // Git add
                    var relativeFilePath = Path.GetRelativePath(repoPath, filePath);
                    Log($"[ADIM 5] Git add çalıştırılıyor: {relativeFilePath}");
                    await RunGitCommand(repoPath, $"add \"{relativeFilePath}\"");

                    // Git commit
                    var commitMessage = $"Dosya güncellendi: {Path.GetFileName(filePath)}";
                    Log($"[ADIM 5] Git commit çalıştırılıyor: {commitMessage}");
                    await RunGitCommand(repoPath, $"commit -m \"{commitMessage}\"");

                    // Git push
                    Log($"[ADIM 5] Git push çalıştırılıyor...");
                    try
                    {
                        await RunGitCommand(repoPath, "push");
                        gitResult = "\n🔄 Git İşlemleri:\n✅ Değişiklikler repository'ye gönderildi";
                        Log($"[ADIM 5] Git işlemleri başarıyla tamamlandı");
                    }
                    catch (Exception pushEx)
                    {
                        // Upstream ayarlı değilse otomatik ayarlayıp tekrar dene
                        Log($"[ADIM 5 UYARI] İlk push denemesi başarısız: {pushEx.Message}");
                        try
                        {
                            var branch = await GetCurrentBranchName(repoPath);
                            Log($"[ADIM 5] Upstream ayarlanıyor: origin {branch}");
                            await RunGitCommand(repoPath, $"push --set-upstream origin {branch}");
                            gitResult = $"\n🔄 Git İşlemleri:\n✅ Upstream ayarlandı ve push tamamlandı (origin {branch})";
                            Log($"[ADIM 5] Upstream ayarlandı ve push başarılı");
                        }
                        catch (Exception upstreamEx)
                        {
                            gitResult = $"\n⚠️ Git İşlemleri:\n❌ Push hatası ve upstream ayarlanamadı: {upstreamEx.Message}\nLütfen manuel olarak şu komutu çalıştırın:\n  git push --set-upstream origin $(git rev-parse --abbrev-ref HEAD)";
                            Log($"[ADIM 5 HATA] Upstream ayarlanamadı: {upstreamEx.Message}");
                        }
                    }
                }
                catch (Exception gitEx)
                {
                    gitResult = $"\n⚠️ Git İşlemleri:\n❌ Git hatası: {gitEx.Message}";
                    Log($"[ADIM 5 HATA] Git işlemi başarısız: {gitEx.Message}");
                }
            }
            else
            {
                gitResult = "\n⚠️ Git repository bulunamadı (değişiklik kaydedilmedi)";
                Log($"[ADIM 5] Git repository bulunamadı");
            }

            // Sonuç oluştur
            var result = new System.Text.StringBuilder();
            result.AppendLine($"✅ Dosya başarıyla güncellendi!");
            result.AppendLine($"\n📄 Dosya: {Path.GetFileName(filePath)}");
            result.AppendLine($"📂 Konum: {Path.GetDirectoryName(filePath)}");
            result.AppendLine($"📊 Yeni Boyut: {newFileSize}");
            result.AppendLine($"📝 Satır Sayısı: {lineCount}");
            result.AppendLine($"⏰ Değiştirilme Zamanı: {newFileInfo.LastWriteTime:yyyy-MM-dd HH:mm:ss}");
            result.AppendLine(gitResult);

            Log($"[BİTİŞ] Dosya başarıyla güncellendi");
            return result.ToString();
        }
        catch (UnauthorizedAccessException ex)
        {
            Log($"[HATA] UnauthorizedAccessException: {ex.Message}");
            return $"Hata: '{filePath}' dosyasına yazma izni yok.";
        }
        catch (DirectoryNotFoundException ex)
        {
            Log($"[HATA] DirectoryNotFoundException: {ex.Message}");
            return $"Hata: Dizin bulunamadı - {ex.Message}";
        }
        catch (Exception ex)
        {
            Log($"[HATA] Exception: {ex.GetType().Name} - {ex.Message}");
            Log($"[HATA] StackTrace: {ex.StackTrace}");
            return $"Hata: {ex.Message}";
        }
    }

    [McpServerTool(Name = "GitCommitAndPush"), Description("Belirtilen dosyayı git'e commit edip push eder")]
    public static async Task<string> GitCommitAndPush(
        [Description(description: "Commit edilecek dosyanın tam yolu")] string filePath,
        [Description(description: "Commit mesajı")] string commitMessage)
    {
        try
        {
            Log($"[BAŞLANGIÇ] GitCommitAndPush çağrıldı - filePath: {filePath}, message: {commitMessage}");

            // Dosyanın var olup olmadığını kontrol et
            Log($"[ADIM 1] Dosya varlığı kontrol ediliyor: {filePath}");
            if (!File.Exists(filePath))
            {
                Log($"[HATA] Dosya bulunamadı: {filePath}");
                return $"Hata: '{filePath}' dosyası bulunamadı.";
            }
            Log($"[ADIM 1] Dosya mevcut");

            // Git repository dizinini bul
            Log($"[ADIM 2] Git repository dizini bulunuyor...");
            var repoPath = FindGitRepository(filePath);
            if (string.IsNullOrEmpty(repoPath))
            {
                Log($"[HATA] Git repository bulunamadı");
                return $"Hata: '{filePath}' için git repository bulunamadı.";
            }
            Log($"[ADIM 2] Git repository bulundu: {repoPath}");

            var result = new System.Text.StringBuilder();
            result.AppendLine($"📁 Repository: {repoPath}");
            result.AppendLine($"📄 Dosya: {Path.GetFileName(filePath)}\n");

            // Git add
            Log($"[ADIM 3] Git add komutu çalıştırılıyor...");
            var relativeFilePath = Path.GetRelativePath(repoPath, filePath);
            var addResult = await RunGitCommand(repoPath, $"add \"{relativeFilePath}\"");
            Log($"[ADIM 3] Git add sonucu: {addResult}");
            result.AppendLine($"✅ Git add tamamlandı");

            // Git commit
            Log($"[ADIM 4] Git commit komutu çalıştırılıyor...");
            var commitResult = await RunGitCommand(repoPath, $"commit -m \"{commitMessage}\"");
            Log($"[ADIM 4] Git commit sonucu: {commitResult}");
            result.AppendLine($"✅ Git commit tamamlandı");
            result.AppendLine($"   Mesaj: {commitMessage}");

            // Git push
            Log($"[ADIM 5] Git push komutu çalıştırılıyor...");
            try
            {
                var pushResult = await RunGitCommand(repoPath, "push");
                Log($"[ADIM 5] Git push sonucu: {pushResult}");
                result.AppendLine($"✅ Git push tamamlandı\n");
            }
            catch (Exception pushEx)
            {
                Log($"[ADIM 5 UYARI] İlk push denemesi başarısız: {pushEx.Message}");
                try
                {
                    var branch = await GetCurrentBranchName(repoPath);
                    Log($"[ADIM 5] Upstream ayarlanıyor: origin {branch}");
                    var setUpstream = await RunGitCommand(repoPath, $"push --set-upstream origin {branch}");
                    Log($"[ADIM 5] Upstream ve push sonucu: {setUpstream}");
                    result.AppendLine($"✅ Upstream ayarlandı ve push tamamlandı (origin {branch})\n");
                }
                catch (Exception upstreamEx)
                {
                    Log($"[ADIM 5 HATA] Upstream ayarlanamadı: {upstreamEx.Message}");
                    result.AppendLine("⚠️ Push hatası ve upstream ayarlanamadı. Manuel olarak şu komutu çalıştırın:");
                    result.AppendLine("  git push --set-upstream origin $(git rev-parse --abbrev-ref HEAD)\n");
                }
            }

            result.AppendLine($"🎉 Değişiklikler başarıyla repository'ye gönderildi!");

            Log($"[BİTİŞ] Git işlemleri başarıyla tamamlandı");
            return result.ToString();
        }
        catch (Exception ex)
        {
            Log($"[HATA] Exception: {ex.GetType().Name} - {ex.Message}");
            Log($"[HATA] StackTrace: {ex.StackTrace}");
            return $"Hata: {ex.Message}";
        }
    }

    private static string FindGitRepository(string filePath)
    {
        var directory = Path.GetDirectoryName(filePath);
        while (!string.IsNullOrEmpty(directory))
        {
            var gitPath = Path.Combine(directory, ".git");
            if (Directory.Exists(gitPath))
            {
                return directory;
            }
            directory = Path.GetDirectoryName(directory);
        }
        return string.Empty;
    }

    private static async Task<string> RunGitCommand(string workingDirectory, string arguments)
    {
        var processStartInfo = new System.Diagnostics.ProcessStartInfo
        {
            FileName = "git",
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = System.Diagnostics.Process.Start(processStartInfo);
        if (process == null)
        {
            throw new Exception("Git process başlatılamadı");
        }

        var output = await process.StandardOutput.ReadToEndAsync();
        var error = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0 && !string.IsNullOrEmpty(error))
        {
            throw new Exception($"Git komutu başarısız: {error}");
        }

        return string.IsNullOrEmpty(output) ? error : output;
    }

    private static async Task<string> GetCurrentBranchName(string repoPath)
    {
        var branch = await RunGitCommand(repoPath, "rev-parse --abbrev-ref HEAD");
        return branch.Trim();
    }

    [McpServerTool, Description("Dosya boyutunu okunabilir bir biçimde formatlar")]
    private static string FormatFileSize(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }
        return $"{len:0.##} {sizes[order]}";
    }
}
