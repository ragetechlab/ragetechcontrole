<?php
class AuthHelper {
    private static $secret = "regetech_secret_key_2026_super_secure_change_in_production";

    private static function getSecret() {
        return getenv('JWT_SECRET') ?: self::$secret;
    }

    /**
     * Gera um token assinado (stateless JWT alternativo) para um usuário
     */
    public static function generateToken($userId, $nome, $email, $papel, $acessos = 'dashboard,leads,os,suportes') {
        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        
        // Expiração de 12 horas
        $exp = time() + (12 * 3600);
        
        $payload = json_encode([
            'id' => $userId,
            'nome' => $nome,
            'email' => $email,
            'papel' => $papel,
            'acessos' => $acessos,
            'exp' => $exp
        ]);
        
        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::getSecret(), true);
        $base64UrlSignature = self::base64UrlEncode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Valida um token recebido nos headers e retorna os dados do usuário ou false
     */
    public static function validateTokenFromHeader() {
        $headers = getallheaders();
        $authHeader = null;

        // Tentar ler o header Authorization de forma insensível a maiúsculas/minúsculas
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $value;
                break;
            }
        }

        if (!$authHeader) {
            return false;
        }

        // Formato esperado: Bearer <token>
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            return self::verifyToken($token);
        }

        return false;
    }

    /**
     * Verifica a validade do token
     */
    public static function verifyToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
        
        // Validar assinatura
        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::getSecret(), true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        // Decodificar payload e checar expiração
        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);
        if (!$payload || !isset($payload['exp'])) {
            return false;
        }
        
        if (time() > $payload['exp']) {
            return false; // Token expirado
        }
        
        return $payload;
    }

    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }
}

// Implementação fallback para getallheaders em servidores que não possuem (ex: Nginx sem PHP-FPM às vezes)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
