<?php
// ─── Neuroku — JWT Utility ────────────────────────────────────────────────────
// Lightweight JWT implementation — no external dependencies required.

declare(strict_types=1);

final class JWT
{
    // ── Encode ────────────────────────────────────────────────────────────────
    public static function encode(array $payload, string $secret, int $ttl): string
    {
        $header = self::b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));

        $payload['iat'] = time();
        $payload['exp'] = time() + $ttl;

        $body = self::b64url(json_encode($payload));
        $sig  = self::b64url(hash_hmac('sha256', "$header.$body", $secret, true));

        return "$header.$body.$sig";
    }

    // ── Decode & verify ───────────────────────────────────────────────────────
    // Returns payload array, or throws RuntimeException on failure.
    public static function decode(string $token, string $secret): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \RuntimeException('Invalid token format');
        }

        [$header, $body, $sig] = $parts;

        $expectedSig = self::b64url(hash_hmac('sha256', "$header.$body", $secret, true));

        // Constant-time comparison
        if (!hash_equals($expectedSig, $sig)) {
            throw new \RuntimeException('Invalid token signature');
        }

        $payload = json_decode(self::b64urlDecode($body), true);

        if (!is_array($payload)) {
            throw new \RuntimeException('Invalid token payload');
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new \RuntimeException('Token expired');
        }

        return $payload;
    }

    // ── Issue access token ────────────────────────────────────────────────────
    public static function issueAccess(int $userId, string $username, string $role): string
    {
        return self::encode(
            ['sub' => $userId, 'username' => $username, 'role' => $role, 'type' => 'access'],
            JWT_SECRET,
            JWT_ACCESS_TTL
        );
    }

    // ── Issue refresh token ───────────────────────────────────────────────────
    public static function issueRefresh(int $userId): string
    {
        return self::encode(
            ['sub' => $userId, 'type' => 'refresh', 'jti' => bin2hex(random_bytes(16))],
            JWT_REFRESH_SECRET,
            JWT_REFRESH_TTL
        );
    }

    // ── Verify access token from request ─────────────────────────────────────
    public static function fromRequest(): array
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!str_starts_with($auth, 'Bearer ')) {
            throw new \RuntimeException('No authorization header');
        }
        return self::decode(substr($auth, 7), JWT_SECRET);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static function b64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function b64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}