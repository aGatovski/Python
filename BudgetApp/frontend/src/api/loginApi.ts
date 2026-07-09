import api from './client'

interface TokenResponse {
    access_token: string,
    refresh_token: string
    token_type: string
}

function mapTokenResponse(raw: unknown): TokenResponse {
    const r = raw as Record<string, unknown>
    return {
        access_token: r.access_token as string,
        refresh_token: r.refresh_token as string,
        token_type: r.token_type as string,
    }
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
    const raw = await api.post("/api/auth/login", {
        email: email,
        password: password
    }) //token response

    return mapTokenResponse(raw)
}
