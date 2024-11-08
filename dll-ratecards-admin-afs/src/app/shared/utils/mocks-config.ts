/**
 * @class ToastServiceMock
 * Class for Mock instance of ToastService for unit tests
 * @version 1.0.0
 */
export class ToastServiceMock {
	public static instance(): any {
		const toastInstance = jasmine.createSpyObj('ToastService', ['clear', 'pop']);
		return toastInstance;
	}
}
