export async function handler(event: any): Promise<any> {
    return {
        ...event,
        response: {
            autoConfirmUser: true,
            autoVerifyEmail: false,
        }
    }
}