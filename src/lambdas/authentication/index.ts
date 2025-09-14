// typescript
// File: `src/lambdas/authentication/index.ts`
import { CognitoIdentityProviderClient, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

export async function handler(event: any): Promise<any> {
    try {
        const body = typeof event.body === "string" ? JSON.parse(event.body || "{}") : event.body || {};
        const { username, password } = body;

        if (!username || !password) {
            return { statusCode: 400, body: JSON.stringify({ message: "username and password required" }) };
        }

        const cmd = new AdminInitiateAuthCommand({
            UserPoolId: process.env.USER_POOL_ID!,
            ClientId: process.env.CLIENT_ID!,
            AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
            AuthParameters: { USERNAME: username, PASSWORD: password },
        });

        const resp = await client.send(cmd);

        // If a challenge is returned (MFA, NEW_PASSWORD_REQUIRED), forward challenge info to client
        if (resp.ChallengeName) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    challenge: resp.ChallengeName,
                    challengeParameters: resp.ChallengeParameters || {},
                }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                tokens: resp.AuthenticationResult, // access, id, refresh tokens and expires
            }),
        };
    } catch (err: any) {
        const message = err?.name === "NotAuthorizedException" || err?.name === "UserNotFoundException"
            ? "Invalid credentials"
            : err?.message || "Authentication error";
        const status = err?.name === "NotAuthorizedException" ? 401 : 500;
        return { statusCode: status, body: JSON.stringify({ message }) };
    }
}