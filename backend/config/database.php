<?php
class Database {
    private static $host = "localhost";
    private static $db_name = "regetech_controle";
    private static $username = "root";
    private static $password = "291118";
    private static $port = "3306";
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn !== null) {
            return self::$conn;
        }

        // Tentar ler de variáveis de ambiente se disponíveis
        $host = getenv('DB_HOST') ?: self::$host;
        $db_name = getenv('DB_NAME') ?: self::$db_name;
        $username = getenv('DB_USER') ?: self::$username;
        $password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : self::$password;
        $port = getenv('DB_PORT') ?: self::$port;

        try {
            $driver = getenv('DB_DRIVER') ?: 'mysql';
            if ($driver === 'pgsql') {
                $dsn = "pgsql:host=" . $host . ";port=" . $port . ";dbname=" . $db_name;
            } else {
                $dsn = "mysql:host=" . $host . ";port=" . $port . ";dbname=" . $db_name . ";charset=utf8mb4";
            }
            self::$conn = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $exception) {
            // Em produção, não exiba detalhes do erro de conexão diretamente
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "message" => "Erro na conexão com o banco de dados: " . $exception->getMessage()
            ]);
            exit();
        }

        return self::$conn;
    }
}
