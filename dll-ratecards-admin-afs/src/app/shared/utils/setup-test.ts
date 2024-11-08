/**
 * @class SetupUnitTests
 * Class for user functions for unit tests
 * @property {string} USER_DATA
 * @property {object} userAfs
 * @version 1.0.0
 */
export class SetupUnitTests {
	/**
	 * @property {string} USER_DATA variable for save user data in localStorage
	 */
	private USER_DATA = 'user_data';
	/**
	 * @property {object} userAfs User AFS data for login simulation
	 */
	private userAfs = {
		username: 'RCCMTestUser1@webssodev.user',
		authToken:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJSQ0NNVGVzdFVzZXIxQHdlYnNzb2Rldi51c2VyIiwiYXBpVHlwZSI6W3siRGVzY3JpcHRpb24iOm51bGwsIkhyZWYiOiJSQ01UU1QifV0sImlhdCI6MTU5NTE3NTgzNywiZXhwIjoxNTk1MTc5NDM3fQ.ow0TZebh8stgYILxQqfiRyy5ll-GM--a7WgcropQeGw',
		refreshToken:
			'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkbGxUb2tlbiI6Ijg0MjBBNjRCQzE1NjI1QTY2QzE5MzkyNERBMUJDNEYwIiwiaWF0IjoxNTk1MTc1ODM3LCJleHAiOjE2MjY3MzM0Mzd9.ykjCsQMYN1C58sKHXTgNAeomodoVetDQCs6eucIOgfU',
		sessionCreated: '2020-07-19T11:23:57-05:00',
		rcmPermissions: 'AFSRCM_TST',
	};
	/**
	 * @method loginUser
	 * Set user item to localStorage for simulate a login
	 * @return {void}
	 */
	public loginUser(): void {
		localStorage.setItem(this.USER_DATA, JSON.stringify(this.userAfs));
	}
	/**
	 * @method logout
	 * Clear localStorage for simulate a logout
	 * @return {void}
	 */
	public logout(): void {
		localStorage.clear();
	}
}
