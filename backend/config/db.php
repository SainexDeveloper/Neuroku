<?php
// ─── Neuroku — Database Configuration ────────────────────────────────────────
// Copy this file to db.php and fill in your credentials.
// Never commit the real db.php to version control.

declare(strict_types=1);

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'neuroku');
define('DB_USER', getenv('DB_USER') ?: 'neuroku_user');
define('DB_PASS', getenv('DB_PASS') ?: 'change_me_in_production');
define('DB_CHARSET', 'utf8mb4');

// JWT secrets
define('JWT_SECRET',         getenv('JWT_SECRET')         ?: 'CHANGE_ME_JWT_SECRET_32CHARS_MIN');
define('JWT_REFRESH_SECRET', getenv('JWT_REFRESH_SECRET') ?: 'CHANGE_ME_REFRESH_SECRET_32CHARS');
define('JWT_ACCESS_TTL',     15 * 60);         // 15 minutes
define('JWT_REFRESH_TTL',    30 * 24 * 60 * 60); // 30 days

// App
define('APP_ENV',    getenv('APP_ENV')    ?: 'development'); // 'production' in prod
define('APP_URL',    getenv('APP_URL')    ?: 'http://localhost:5173');
define('BCRYPT_COST', 12);

// ─── PDO Singleton ────────────────────────────────────────────────────────────

final class DB
{
    private static ?PDO $instance = null;

    private function __construct() {}

    public static function get(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
            );
            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::MYSQL_ATTR_FOUND_ROWS   => true,
                ]);
            } catch (PDOException $e) {
                // Don't expose credentials in the error message
                http_response_code(503);
                header('Content-Type: application/json');
                echo json_encode(['error' => 'Database unavailable']);
                exit;
            }
        }
        return self::$instance;
    }

    // Shorthand helpers
    public static function query(string $sql, array $params = []): \PDOStatement
    {
        $stmt = self::get()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function row(string $sql, array $params = []): ?array
    {
        $row = self::query($sql, $params)->fetch();
        return $row ?: null;
    }

    public static function rows(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function insert(string $sql, array $params = []): string
    {
        self::query($sql, $params);
        return self::get()->lastInsertId();
    }

    public static function execute(string $sql, array $params = []): int
    {
        return self::query($sql, $params)->rowCount();
    }

    public static function beginTransaction(): void { self::get()->beginTransaction(); }
    public static function commit(): void           { self::get()->commit(); }
    public static function rollback(): void         { self::get()->rollBack(); }
}