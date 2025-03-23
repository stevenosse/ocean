import { User } from "@prisma/client";

export class ChangePasswordResponse {
    message: string;
    user: Partial<User>;
}