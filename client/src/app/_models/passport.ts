export interface Passport {
    token: string,
    display_name: string,
    avatar_url?: string,
    id: number,
    bio?: string,
    created_at?: string
}

export interface RegisterModel {
    username: string
    password: string
    display_name: string
}
export interface LoginModel {
    username: string
    password: string
}
