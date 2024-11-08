/**
 * @class User
 * @abstract
 * User `Interface` Data
 * @version 2.0.0
 */
export interface IUser {
	username?: string;
	authToken?: string;
	refreshToken?: string;
	group?: string;
	sessionCreated?: string;
}
