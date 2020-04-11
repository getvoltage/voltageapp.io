import { authStore } from '~/store'
import { layoutStore } from '~/store'
import { Auth } from 'aws-amplify'

export default function useAuthentication () {
    async function login (email: string, password:string) {
        const user = await Auth.signIn(email, password)
        authStore.SET_USER(user)
        return user
    }

    async function register (email: string, password: string) {
        const user = await Auth.signUp({
            username: email,
            password
        })
        return user
    }

    async function load () {
        try {
            const user = await Auth.currentAuthenticatedUser()
            authStore.SET_USER(user)
        } catch (error) {
            authStore.SET_USER(null)
            layoutStore.SET_ERROR(error)
        }
    }

    async function logout () {
        await Auth.signOut()
        authStore.SET_USER(null)
        return true
    }

    async function refresh () {
        const creds = await Auth.currentCredentials()
        authStore.SET_USER(creds)
        return creds
    }

    async function resend (email: string) {
        return await Auth.resendSignUp(email)
    }

    async function confirm (email: string, code: string) {
        return await Auth.confirmSignUp(email, code)
    }

    return {
        login,
        register,
        load,
        logout,
        refresh,
        resend,
        confirm
    }
}