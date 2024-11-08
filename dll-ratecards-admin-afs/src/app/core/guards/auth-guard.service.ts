import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';

import { doLog } from '../app-settings';

import { AuthService } from '../services';

const LOG_TAG = '[core/guards/AuthGuardService]';

/**
 * @class AuthGuardService
 * Prevent access to private areas on the application.
 * @uses angular.core.Injectable
 * @uses angular.route.CanActivate
 * @uses core.services.AuthService
 * @version 1.0.0
 */
@Injectable()
export class AuthGuardService implements CanActivate {
	constructor(private _auth: AuthService) {}

	/**
	 * @method canActivate
	 * Validate the current session and enable private modules.
	 * @return {Boolean}
	 */
	public canActivate() {
		doLog && console.log(LOG_TAG, '- canActivate');
		return this._auth.isSessionActive();
	}
}
